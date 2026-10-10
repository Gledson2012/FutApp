import {
  API_BASE_URL,
  API_CACHE_TTL_MS,
  API_KEY,
  API_TIMEOUT_MS,
  BRA_COMPETITION_NAME,
  BRA_SEASON_ID,
} from '../config';
import { ALL_MATCHES, RESULTS, STANDINGS, TODAY_MATCHES } from '../data/mock';
import {
  ApiEventType,
  ApiMatchStatus,
  CommentaryItem,
  FormResult,
  LiveStandingRow,
  Match,
  MatchEvent,
  MatchPrediction,
  MatchStatRow,
  MatchStatus,
  NewsArticle,
  SearchResponse,
  StandingRow,
  Team,
  TeamDetail,
  TeamFixtures,
  TeamFixtureEntry,
  TeamFormLetter,
  TeamSummary,
  TeamTrophies,
  TrophyItem,
} from '../types';
import { isSameDay, startOfDay } from '../utils/date';

/**
 * Camada de acesso a dados — BrasaFut API
 * (https://api-brasa-fut.vercel.app/ · docs /docs)
 *
 * Plano ENTERPRISE (300 req/min): dá folga para o auto-refresh, mas
 * mantemos:
 *  - cache em memória por 30s (trocar de aba não refaz chamadas);
 *  - timeout de 8s por requisição;
 *  - fallback automático para dados mock em caso de erro/queda de rede
 *    (aviso no console), para o app nunca ficar quebrado.
 *
 * Endpoints usados:
 *  GET /matches?date=… · /matches/live · /matches?status=FINISHED|SCHEDULED
 *  GET /standings?seasonId= · GET /matches/:id + /matches/:id/events
 */

// ---------------------------------------------------------------------------
// HTTP com cache + timeout
// ---------------------------------------------------------------------------
interface CacheEntry {
  at: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();

/** Limpa o cache (usado pelo pull-to-refresh) */
export function invalidateCache(): void {
  cache.clear();
}

async function httpGet<T>(path: string, useCache = true): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const hit = cache.get(url);
  if (useCache && hit && Date.now() - hit.at < API_CACHE_TTL_MS) {
    return hit.data as T;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'x-api-key': API_KEY, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (res.status === 429) {
      throw new Error('RATE_LIMIT (429) — verifique o plano da API key');
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = (await res.json()) as T;
    cache.set(url, { at: Date.now(), data: json });
    return json;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Mapeamento API → modelos do app
// ---------------------------------------------------------------------------
interface ApiTeam {
  id: number;
  name: string;
  shortName: string;
  acronym?: string | null;
  country?: string | null;
  logoUrl?: string | null;
}

interface ApiVenue {
  id?: number;
  name: string;
  city?: string | null;
}

interface ApiMatch {
  id: number;
  seasonId?: number;
  round?: string | null;
  kickoffTime: string;
  status: ApiMatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  venue?: ApiVenue | null;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
}

interface ApiStandingRow {
  position: number;
  team: ApiTeam;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  form?: string | null;
}

interface ApiStandingResponse {
  seasonId: number;
  standings: ApiStandingRow[];
}

interface ApiEvent {
  id?: number;
  minute: number;
  extraMinute?: number;
  type: ApiEventType;
  description?: string | null;
  teamId: number;
  player?: { id?: number; name?: string } | null;
}

const STATUS_MAP: Record<ApiMatchStatus, MatchStatus> = {
  SCHEDULED: 'scheduled',
  FIRST_HALF: 'live',
  SECOND_HALF: 'live',
  EXTRA_TIME: 'live',
  PENALTIES: 'live',
  HALF_TIME: 'half_time',
  FINISHED: 'finished',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
};

/** Paleta para escudos fallback quando a API não traz cor */
const FALLBACK_COLORS = [
  '#E30613', '#006437', '#0D80BF', '#F59E0B', '#7C3AED',
  '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#475569',
];

function fallbackColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

function mapTeam(t: ApiTeam): Team {
  const short = t.acronym || t.shortName || t.name.slice(0, 3).toUpperCase();
  return {
    id: String(t.id),
    name: t.shortName || t.name,
    shortName: short,
    color: fallbackColor(short),
    logoUrl: t.logoUrl ?? null,
  };
}

function mapMatch(m: ApiMatch, competition?: string): Match {
  return {
    id: String(m.id),
    competition,
    round: m.round ?? undefined,
    startTime: m.kickoffTime,
    status: STATUS_MAP[m.status] ?? 'scheduled',
    apiStatus: m.status,
    home: mapTeam(m.homeTeam),
    away: mapTeam(m.awayTeam),
    homeScore: m.homeScore ?? undefined,
    awayScore: m.awayScore ?? undefined,
    venue: m.venue
      ? `${m.venue.name}${m.venue.city ? ` · ${m.venue.city}` : ''}`
      : undefined,
    events: [],
  };
}

/** Remove duplicatas (a API retorna alguns registros repetidos) */
function dedupeMatches(list: Match[]): Match[] {
  const seen = new Set<string>();
  return list.filter((m) => {
    const key = `${m.startTime}|${m.home.id}|${m.away.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function byStartTimeAsc(a: Match, b: Match): number {
  return a.startTime.localeCompare(b.startTime);
}

/** Data local "AAAA-MM-DD" (query param date=) */
function localDateParam(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${day}`;
}

/** Executa a chamada real; em caso de falha, usa o mock e avisa no console */
async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[BrasaFut] API indisponível, usando dados mock:', err);
    return fallback();
  }
}

// ---------------------------------------------------------------------------
// Endpoints públicos (assinaturas usadas pelas telas)
// ---------------------------------------------------------------------------

/** Jogos de hoje (todas as competições), ordenados por horário */
export async function getTodayMatches(): Promise<Match[]> {
  return withFallback(async () => {
    const raw = await httpGet<ApiMatch[]>(
      `/api/v1/matches?date=${localDateParam()}&limit=100`,
    );
    return dedupeMatches(raw.map((m) => mapMatch(m))).sort(byStartTimeAsc);
  }, () => [...TODAY_MATCHES].sort(byStartTimeAsc));
}

/** Jogos acontecendo agora (mais recentes primeiro, máx. 20) */
export async function getLiveMatches(): Promise<Match[]> {
  return withFallback(async () => {
    const raw = await httpGet<ApiMatch[]>('/api/v1/matches/live');
    return dedupeMatches(raw.map((m) => mapMatch(m)))
      .sort((a, b) => b.startTime.localeCompare(a.startTime))
      .slice(0, 20);
  }, () =>
    ALL_MATCHES.filter((m) => m.status === 'live' || m.status === 'half_time'),
  );
}

/** Classificação do Brasileirão (duplicatas de time removidas) */
export async function getStandings(): Promise<StandingRow[]> {
  return withFallback(async () => {
    const raw = await httpGet<ApiStandingResponse>(
      `/api/v1/standings/?seasonId=${BRA_SEASON_ID}`,
    );
    const seen = new Set<string>();
    const rows: StandingRow[] = [];
    for (const r of raw.standings) {
      const team = mapTeam(r.team);
      const key = team.shortName.toUpperCase();
      if (seen.has(key)) continue; // remove clubes duplicados na API
      seen.add(key);
      rows.push({
        position: r.position,
        team,
        points: r.points,
        played: r.played,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        form: (r.form as FormResult | null | undefined) ?? null,
      });
    }
    return rows
      .sort((a, b) => a.position - b.position)
      .map((row, idx) => ({ ...row, position: idx + 1 }));
  }, () => STANDINGS);
}

/** Jogos agendados de hoje em diante (calendário) */
export async function getFixtures(): Promise<Match[]> {
  return withFallback(async () => {
    const raw = await httpGet<ApiMatch[]>(
      `/api/v1/matches?status=SCHEDULED&seasonId=${BRA_SEASON_ID}&limit=100`,
    );
    const today = startOfDay(new Date());
    return dedupeMatches(raw.map((m) => mapMatch(m, BRA_COMPETITION_NAME)))
      .filter((m) => new Date(m.startTime) >= today)
      .sort(byStartTimeAsc);
  }, () =>
    ALL_MATCHES.filter(
      (m) =>
        m.status === 'scheduled' &&
        new Date(m.startTime) >= startOfDay(new Date()),
    ).sort(byStartTimeAsc),
  );
}

/** Jogos de um dia específico (fixtures + jogos de hoje quando for hoje) */
export async function getMatchesByDay(day: Date): Promise<Match[]> {
  const [fixtures, todayMatches] = await Promise.all([
    getFixtures(),
    isSameDay(day, new Date()) ? getTodayMatches() : Promise.resolve([]),
  ]);
  return dedupeMatches([...todayMatches, ...fixtures])
    .filter((m) => isSameDay(new Date(m.startTime), day))
    .sort(byStartTimeAsc);
}


/** Resultados encerrados do Brasileirão (mais recentes primeiro) */
export async function getResults(): Promise<Match[]> {
  return withFallback(async () => {
    const raw = await httpGet<ApiMatch[]>(
      `/api/v1/matches?status=FINISHED&seasonId=${BRA_SEASON_ID}&limit=100`,
    );
    return dedupeMatches(
      raw.map((m) => mapMatch(m, BRA_COMPETITION_NAME)),
    ).sort((a, b) => b.startTime.localeCompare(a.startTime));
  }, () => [...RESULTS].sort((a, b) => b.startTime.localeCompare(a.startTime)));
}

/** Detalhe de um jogo + eventos (gols, cartões, substituições) */
export async function getMatchDetail(
  id: string,
): Promise<{ match: Match; events: MatchEvent[] } | undefined> {
  return withFallback(async () => {
    const matchRaw = await httpGet<ApiMatch>(`/api/v1/matches/${id}`);
    const match = mapMatch(matchRaw);

    let events: MatchEvent[] = [];
    try {
      const rawEvents = await httpGet<ApiEvent[]>(
        `/api/v1/matches/${id}/events`,
      );
      events = rawEvents.map((e) => ({
        minute: e.minute + (e.extraMinute ?? 0),
        type: e.type,
        teamId: String(e.teamId),
        player: e.player?.name ?? '—',
        description: e.description ?? undefined,
      }));
    } catch {
      // eventos são opcionais — segue sem eles
    }
    match.events = events;
    return { match, events };
  }, () => {
    const mock = ALL_MATCHES.find((m) => m.id === id);
    return mock ? { match: mock, events: mock.events } : undefined;
  });
}

// ---------------------------------------------------------------------------
// Novos endpoints (melhorias)
// ---------------------------------------------------------------------------

interface ApiLiveStandingRow {
  originalPosition: number;
  team: ApiTeam;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  form?: string | null;
  liveMatch?: {
    matchId: number;
    score: string;
    isHome: boolean;
    status: ApiMatchStatus;
  } | null;
  currentPosition: number;
  movement: 'UP' | 'DOWN' | 'SAME';
  movementDelta: number;
}

interface ApiLiveStandingsResponse {
  seasonId: number;
  liveMatchesCount: number;
  hasLiveChanges: boolean;
  standings: ApiLiveStandingRow[];
}

/** Classificação recalculada com os jogos em andamento (setas ▲▼) */
export async function getLiveStandings(): Promise<LiveStandingRow[]> {
  return withFallback(async () => {
    const raw = await httpGet<ApiLiveStandingsResponse>(
      `/api/v1/standings/live?seasonId=${BRA_SEASON_ID}`,
    );
    const seen = new Set<string>();
    const rows: LiveStandingRow[] = [];
    for (const r of raw.standings) {
      const team = mapTeam(r.team);
      const key = team.shortName.toUpperCase();
      if (seen.has(key)) continue; // remove clubes duplicados na API
      seen.add(key);
      rows.push({
        position: r.currentPosition,
        team,
        points: r.points,
        played: r.played,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        form: (r.form as FormResult | null | undefined) ?? null,
        movement: r.movement,
        movementDelta: r.movementDelta,
        liveScore: r.liveMatch?.score ?? null,
        liveStatus: r.liveMatch?.status ?? null,
        liveMatchId: r.liveMatch ? String(r.liveMatch.matchId) : null,
      });
    }
    return rows
      .sort((a, b) => a.position - b.position)
      .map((row, idx) => ({ ...row, position: idx + 1 }));
  }, () => STANDINGS.map((r) => ({ ...r, movement: 'SAME' as const, movementDelta: 0 })));
}

interface ApiStatRow {
  teamId: number;
  teamName: string;
  possessionPct?: number;
  shotsTotal?: number;
  shotsOnTarget?: number;
  corners?: number;
  fouls?: number;
  offsides?: number;
  yellowCards?: number;
  redCards?: number;
  saves?: number;
  passesTotal?: number;
  passesAccurate?: number;
}

/** Estatísticas do jogo (posse, chutes, passes…) */
export async function getMatchStatistics(id: string): Promise<MatchStatRow[]> {
  const raw = await httpGet<ApiStatRow[]>(`/api/v1/matches/${id}/statistics`);
  return raw.map((r) => ({ ...r, teamId: String(r.teamId) }));
}

interface ApiPrediction {
  matchId: number;
  probabilities: { homeWinPct: number; drawPct: number; awayWinPct: number };
  goalsExpected?: { averageExpected?: number; over25Pct?: number };
  bothTeamsToScore?: { yesPct?: number };
  mostLikelyScores?: Array<{ score: string; probability: number }>;
  insights?: string[];
}

interface ApiOdds {
  matchId: number;
  fairOdds?: { market1X2?: { home: number; draw: number; away: number } };
}

/** Probabilidades do modelo + placares prováveis + odds justas */
export async function getMatchPrediction(id: string): Promise<MatchPrediction | null> {
  const [pred, odds] = await Promise.all([
    httpGet<ApiPrediction>(`/api/v1/matches/${id}/predictions`),
    httpGet<ApiOdds>(`/api/v1/matches/${id}/odds`).catch(() => null),
  ]);
  const fair = odds?.fairOdds?.market1X2;
  return {
    matchId: String(pred.matchId),
    homeWinPct: pred.probabilities.homeWinPct,
    drawPct: pred.probabilities.drawPct,
    awayWinPct: pred.probabilities.awayWinPct,
    avgGoals: pred.goalsExpected?.averageExpected,
    over25Pct: pred.goalsExpected?.over25Pct,
    bttsYesPct: pred.bothTeamsToScore?.yesPct,
    likelyScores: pred.mostLikelyScores ?? [],
    insights: pred.insights ?? [],
    fairOdds: fair ? { home: fair.home, draw: fair.draw, away: fair.away } : null,
  };
}

interface ApiCommentaryItem {
  id: number;
  minute: number;
  extraMinute?: number | null;
  period?: string | null;
  type: string;
  headline: string;
  text: string;
  teamSide?: 'HOME' | 'AWAY' | null;
}

interface ApiCommentaryResponse {
  matchId: number;
  commentary: ApiCommentaryItem[];
}

/** Narração lance a lance */
export async function getMatchCommentary(id: string): Promise<CommentaryItem[]> {
  const raw = await httpGet<ApiCommentaryResponse>(
    `/api/v1/matches/${id}/commentary?limit=50`,
  );
  return raw.commentary.map((c) => ({
    id: String(c.id),
    minute: c.minute,
    extraMinute: c.extraMinute ?? undefined,
    period: c.period ?? undefined,
    type: c.type,
    headline: c.headline,
    text: c.text,
    teamSide: c.teamSide ?? null,
  }));
}

interface ApiNewsItem {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  imageUrl?: string | null;
  publishedAt: string;
  source?: string | null;
}

interface ApiNewsResponse {
  total: number;
  articles: ApiNewsItem[];
}

interface ApiSearchResponse {
  query: string;
  teams?: ApiTeam[];
  news?: ApiNewsItem[];
}

function mapNews(a: ApiNewsItem): NewsArticle {
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? undefined,
    url: a.url,
    imageUrl: a.imageUrl ?? null,
    publishedAt: a.publishedAt,
    source: a.source ?? 'ESPN Brasil',
  };
}

/** Últimas notícias do futebol (ESPN) */
export async function getNews(limit = 20): Promise<NewsArticle[]> {
  const raw = await httpGet<ApiNewsResponse>(`/api/v1/news?limit=${limit}`);
  return (raw.articles ?? []).map(mapNews);
}

function mapTeamSummary(t: ApiTeam): TeamSummary {
  return {
    id: String(t.id),
    name: t.name,
    shortName: t.shortName,
    acronym: t.acronym ?? null,
    country: t.country ?? null,
    logoUrl: t.logoUrl ?? null,
  };
}

/** Busca global: times + notícias */
export async function searchAll(query: string): Promise<SearchResponse> {
  const q = query.trim();
  if (!q) return { query: q, teams: [], news: [] };
  const raw = await httpGet<ApiSearchResponse>(
    `/api/v1/search?q=${encodeURIComponent(q)}`,
  );
  return {
    query: raw.query ?? q,
    teams: (raw.teams ?? []).map(mapTeamSummary),
    news: (raw.news ?? []).map(mapNews),
  };
}

interface ApiTeamDetail {
  id: number;
  name: string;
  shortName: string;
  acronym?: string | null;
  foundedYear?: number | null;
  country?: string | null;
  logoUrl?: string | null;
  venue?: { name: string; city?: string | null; capacity?: number | null } | null;
}

/** Ficha do clube (fundação, estádio…) */
export async function getTeamDetail(id: string): Promise<TeamDetail | null> {
  try {
    const raw = await httpGet<ApiTeamDetail>(`/api/v1/teams/${id}`);
    return {
      ...mapTeamSummary(raw),
      foundedYear: raw.foundedYear ?? null,
      venue: raw.venue ?? null,
    };
  } catch {
    return null;
  }
}

interface ApiTeamFixtureEntry {
  id: number;
  round?: string | null;
  kickoffTime: string;
  status: ApiMatchStatus;
  isHome: boolean;
  score?: { home?: number | null; away?: number | null } | null;
  competition: { name: string; code?: string | null };
  opponent: ApiTeam;
}

interface ApiTeamFixturesResponse {
  team: ApiTeam;
  form?: Array<'W' | 'D' | 'L'> | null;
  pastMatches?: ApiTeamFixtureEntry[];
  nextMatches?: ApiTeamFixtureEntry[];
}

/** Agenda do clube: forma recente + últimos e próximos jogos */
export async function getTeamFixtures(id: string): Promise<TeamFixtures | null> {
  try {
    const raw = await httpGet<ApiTeamFixturesResponse>(
      `/api/v1/teams/${id}/fixtures?limit=10`,
    );
    const mapEntry = (e: ApiTeamFixtureEntry): TeamFixtureEntry => ({
      id: String(e.id),
      round: e.round ?? null,
      kickoffTime: e.kickoffTime,
      status: e.status,
      isHome: e.isHome,
      homeScore: e.score?.home ?? undefined,
      awayScore: e.score?.away ?? undefined,
      competition: e.competition?.name ?? '',
      opponent: mapTeamSummary(e.opponent),
    });
    return {
      team: mapTeamSummary(raw.team),
      form: (raw.form ?? []) as TeamFormLetter[],
      past: (raw.pastMatches ?? []).map(mapEntry),
      next: (raw.nextMatches ?? []).map(mapEntry),
    };
  } catch {
    return null;
  }
}

interface ApiTrophyItem {
  name: string;
  count: number;
  years?: number[];
  lastYear?: number;
}

interface ApiTeamTrophiesResponse {
  team: ApiTeam;
  totalTrophiesCount: number;
  trophies: {
    international?: ApiTrophyItem[];
    national?: ApiTrophyItem[];
    state?: ApiTrophyItem[];
  };
}

/** Sala de troféus do clube (mundiais, nacionais, estaduais) */
export async function getTeamTrophies(id: string): Promise<TeamTrophies | null> {
  try {
    const raw = await httpGet<ApiTeamTrophiesResponse>(
      `/api/v1/teams/${id}/trophies`,
    );
    return {
      totalCount: raw.totalTrophiesCount ?? 0,
      international: raw.trophies?.international ?? [],
      national: raw.trophies?.national ?? [],
      state: raw.trophies?.state ?? [],
    };
  } catch {
    return null;
  }
}

