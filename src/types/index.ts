/** Status cru devolvido pela BrasaFut API */
export type ApiMatchStatus =
  | 'SCHEDULED'
  | 'FIRST_HALF'
  | 'HALF_TIME'
  | 'SECOND_HALF'
  | 'EXTRA_TIME'
  | 'PENALTIES'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED';

/** Status normalizado usado pela UI */
export type MatchStatus =
  | 'scheduled'
  | 'live'
  | 'half_time'
  | 'finished'
  | 'postponed'
  | 'cancelled';

/** Tipos de evento devolvidos pela API (GET /matches/:id/events) */
export type ApiEventType =
  | 'GOAL'
  | 'OWN_GOAL'
  | 'PENALTY_SCORED'
  | 'PENALTY_MISSED'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'SECOND_YELLOW'
  | 'SUBSTITUTION';

export interface Team {
  id: string;
  /** Nome de exibição (curto) */
  name: string;
  /** Sigla usada no escudo fallback (ex.: FLA) */
  shortName: string;
  /** Cor principal para o escudo fallback (dados mock) */
  color?: string;
  /** Logo real (Sofascore) quando vem da API */
  logoUrl?: string | null;
}

export interface MatchEvent {
  minute: number;
  type: ApiEventType;
  teamId: string;
  player: string;
  description?: string;
}

export interface Match {
  id: string;
  /** Conhecido quando o fetch filtra por temporada (senão, omitido) */
  competition?: string;
  /** Ex.: "Rodada 29" (a API já devolve o rótulo pronto) */
  round?: string;
  /** Data/hora de início em ISO 8601 */
  startTime: string;
  status: MatchStatus;
  /** Status cru da API — usado para rótulos como "1º TEMPO", "PÊNALTIS" */
  apiStatus?: ApiMatchStatus;
  /** Minuto atual (apenas em dados mock; a API não expõe minuto) */
  minute?: number;
  home: Team;
  away: Team;
  homeScore?: number;
  awayScore?: number;
  /** Ex.: "Maracanã · Rio de Janeiro" */
  venue?: string;
  events: MatchEvent[];
}

export type FormResult = 'V' | 'E' | 'D';

export interface StandingRow {
  position: number;
  team: Team;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  /** Último resultado (a API devolve apenas um; null quando sem dado) */
  form: FormResult | null;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
}

/** Notícia do feed ESPN (GET /news/) */
export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  publishedAt: string;
  source: string;
}

/** Time resumido (busca, fixtures, detalhe) */
export interface TeamSummary {
  id: string;
  name: string;
  shortName: string;
  acronym?: string | null;
  country?: string | null;
  logoUrl?: string | null;
}

export interface SearchResponse {
  query: string;
  teams: TeamSummary[];
  news: NewsArticle[];
}

/** Detalhe do clube (GET /teams/:id) */
export interface TeamDetail extends TeamSummary {
  foundedYear?: number | null;
  venue?: {
    name: string;
    city?: string | null;
    capacity?: number | null;
  } | null;
}

export type TeamFormLetter = 'W' | 'D' | 'L';

/** Um jogo na agenda do clube (GET /teams/:id/fixtures) */
export interface TeamFixtureEntry {
  id: string;
  round?: string | null;
  kickoffTime: string;
  status: ApiMatchStatus;
  /** true = o clube consultado joga em casa */
  isHome: boolean;
  homeScore?: number;
  awayScore?: number;
  competition: string;
  opponent: TeamSummary;
}

export interface TeamFixtures {
  team: TeamSummary;
  form: TeamFormLetter[];
  past: TeamFixtureEntry[];
  next: TeamFixtureEntry[];
}

/** Item da sala de troféus */
export interface TrophyItem {
  name: string;
  count: number;
  years?: number[];
  lastYear?: number;
}

/** Sala de troféus completa (GET /teams/:id/trophies) */
export interface TeamTrophies {
  totalCount: number;
  international: TrophyItem[];
  national: TrophyItem[];
  state: TrophyItem[];
}

/** Estatística de um time no jogo (GET /matches/:id/statistics) */
export interface MatchStatRow {
  teamId: string;
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

/** Palpites e probabilidades (GET /matches/:id/predictions + /odds) */
export interface MatchPrediction {
  matchId: string;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  avgGoals?: number;
  over25Pct?: number;
  bttsYesPct?: number;
  likelyScores: Array<{ score: string; probability: number }>;
  insights: string[];
  fairOdds?: { home: number; draw: number; away: number } | null;
}

/** Item da narração lance a lance (GET /matches/:id/commentary) */
export interface CommentaryItem {
  id: string;
  minute: number;
  extraMinute?: number;
  period?: string;
  type: string;
  headline: string;
  text: string;
  teamSide?: 'HOME' | 'AWAY' | null;
}

/** Linha da tabela ao vivo (GET /standings/live) */
export interface LiveStandingRow extends StandingRow {
  movement: 'UP' | 'DOWN' | 'SAME';
  movementDelta: number;
  liveScore?: string | null;
  liveStatus?: ApiMatchStatus | null;
  liveMatchId?: string | null;
}

/** Artilheiro / Jogador em destaque */
export interface TopScorer {
  rank: number;
  playerId: string;
  playerName: string;
  team: TeamSummary;
  goals: number;
  assists?: number;
  penalties?: number;
  matchesPlayed: number;
  avatarUrl?: string | null;
}

/** Partida histórica entre dois times */
export interface MatchH2HEntry {
  id: string;
  date: string;
  competition: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  homeScore: number;
  awayScore: number;
  winnerId?: string | null;
}

/** Resumo Head-to-Head (Confronto Direto) */
export interface HeadToHead {
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  totalMatches: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeGoals: number;
  awayGoals: number;
  recentMatches: MatchH2HEntry[];
}

/** Palpite local do usuário para a partida */
export interface UserPrediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
  updatedAt: string;
  points?: number | null;
}


