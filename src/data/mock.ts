import { ApiMatchStatus, Competition, Match, MatchStatus, StandingRow, Team } from '../types';

export const COMPETITIONS: Competition[] = [
  { id: 'bra', name: 'Brasileirão Série A', country: 'Brasil' },
  { id: 'lib', name: 'Copa Libertadores', country: 'CONMEBOL' },
];

const t = (id: string, name: string, shortName: string, color: string): Team => ({
  id,
  name,
  shortName,
  color,
});

export const TEAMS: Record<string, Team> = Object.fromEntries(
  [
    t('fla', 'Flamengo', 'FLA', '#E30613'),
    t('pal', 'Palmeiras', 'PAL', '#006437'),
    t('cor', 'Corinthians', 'COR', '#2B2B2B'),
    t('sao', 'São Paulo', 'SAO', '#FE0000'),
    t('flu', 'Fluminense', 'FLU', '#7A1E3A'),
    t('bot', 'Botafogo', 'BOT', '#333333'),
    t('vas', 'Vasco da Gama', 'VAS', '#333333'),
    t('gre', 'Grêmio', 'GRE', '#0D80BF'),
    t('int', 'Internacional', 'INT', '#E4002B'),
    t('cam', 'Atlético-MG', 'CAM', '#333333'),
    t('cru', 'Cruzeiro', 'CRU', '#003DA5'),
    t('bah', 'Bahia', 'BAH', '#005CA9'),
    t('san', 'Santos', 'SAN', '#333333'),
    t('for', 'Fortaleza', 'FOR', '#004B93'),
    t('cea', 'Ceará', 'CEA', '#333333'),
    t('spt', 'Sport Recife', 'SPT', '#E30613'),
    t('vit', 'Vitória', 'VIT', '#E30613'),
    t('cui', 'Cuiabá', 'CUI', '#00713B'),
    t('juv', 'Juventude', 'JUV', '#009640'),
    t('rbb', 'RB Bragantino', 'RBB', '#E02020'),
  ].map((team) => [team.id, team]),
);

const team = (id: string): Team => TEAMS[id];

/** Data de hoje com a hora especificada */
function todayAt(hours: number, minutes = 0): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Data N dias a partir de hoje, com a hora especificada */
function daysFromNow(days: number, hours: number, minutes = 0): Date {
  const d = todayAt(hours, minutes);
  d.setDate(d.getDate() + days);
  return d;
}

let idSeq = 0;

const API_STATUS_BY_STATUS: Record<string, ApiMatchStatus> = {
  scheduled: 'SCHEDULED',
  live: 'SECOND_HALF',
  half_time: 'HALF_TIME',
  finished: 'FINISHED',
  postponed: 'POSTPONED',
  cancelled: 'CANCELLED',
};

function match(
  competition: string,
  round: number | string,
  start: Date,
  homeId: string,
  awayId: string,
  overrides: Partial<Match> = {},
): Match {
  idSeq += 1;
  const status = (overrides.status ?? 'scheduled') as MatchStatus;
  return {
    id: `m${idSeq}`,
    competition,
    round: typeof round === 'string' ? round : `Rodada ${round}`,
    startTime: start.toISOString(),
    status,
    apiStatus: API_STATUS_BY_STATUS[status],
    home: team(homeId),
    away: team(awayId),
    events: [],
    ...overrides,
  };
}

const BRA = 'Brasileirão Série A';
const LIB = 'Copa Libertadores';
const now = new Date();

/** Minuto de um jogo ao vivo iniciado em `start` (limitado a 1..90) */
function liveMinute(start: Date): number {
  const elapsed = Math.round((now.getTime() - start.getTime()) / 60_000);
  return Math.max(1, Math.min(90, elapsed));
}

// ---------------------------------------------------------------------------
// Jogos de HOJE: finalizados, ao vivo e agendados
// ---------------------------------------------------------------------------

const finishedToday = [
  match(BRA, 34, todayAt(7, 30), 'cea', 'juv', {
    status: 'finished',
    homeScore: 2,
    awayScore: 1,
    events: [
      { minute: 23, type: 'GOAL', teamId: 'cea', player: 'Fernando Sobral' },
      { minute: 55, type: 'GOAL', teamId: 'juv', player: 'Marcelo' },
      { minute: 81, type: 'GOAL', teamId: 'cea', player: 'Zé Roberto' },
    ],
  }),
  match(BRA, 34, todayAt(9, 0), 'cui', 'spt', {
    status: 'finished',
    homeScore: 0,
    awayScore: 0,
  }),
  match(BRA, 34, todayAt(10, 30), 'vit', 'rbb', {
    status: 'finished',
    homeScore: 1,
    awayScore: 3,
    events: [
      { minute: 12, type: 'GOAL', teamId: 'rbb', player: 'Jhon Jhon' },
      { minute: 44, type: 'GOAL', teamId: 'vit', player: 'Matheus Babi' },
      { minute: 60, type: 'GOAL', teamId: 'rbb', player: 'Everton Cebolinha' },
      { minute: 88, type: 'PENALTY_SCORED', teamId: 'rbb', player: 'Helinho' },
    ],
  }),
];

const liveStart1 = new Date(now.getTime() - 62 * 60_000);
const liveStart2 = new Date(now.getTime() - 35 * 60_000);
const liveStart3 = new Date(now.getTime() - 12 * 60_000);

const liveMatches = [
  match(BRA, 34, liveStart1, 'fla', 'cor', {
    status: 'live',
    minute: liveMinute(liveStart1),
    homeScore: 2,
    awayScore: 1,
    venue: 'Maracanã',
    events: [
      { minute: 8, type: 'GOAL', teamId: 'fla', player: 'Pedro' },
      { minute: 31, type: 'GOAL', teamId: 'cor', player: 'Yuri Alberto' },
      { minute: 57, type: 'GOAL', teamId: 'fla', player: 'Gabriel' },
    ],
  }),
  match(BRA, 34, liveStart2, 'sao', 'bot', {
    status: 'live',
    minute: liveMinute(liveStart2),
    homeScore: 0,
    awayScore: 0,
    venue: 'MorumBIS',
  }),
  match(LIB, 'Quartas', liveStart3, 'pal', 'int', {
    status: 'live',
    minute: liveMinute(liveStart3),
    homeScore: 1,
    awayScore: 0,
    venue: 'Allianz Parque',
    events: [{ minute: 5, type: 'GOAL', teamId: 'pal', player: 'Vitor Roque' }],
  }),
];

const scheduledToday = [
  match(BRA, 34, todayAt(19, 30), 'flu', 'bah', { venue: 'Maracanã' }),
  match(BRA, 34, todayAt(21, 30), 'gre', 'san', { venue: 'Arena do Grêmio' }),
  match(BRA, 34, todayAt(22, 0), 'vas', 'cam', { venue: 'São Januário' }),
];

export const TODAY_MATCHES: Match[] = [
  ...finishedToday,
  ...liveMatches,
  ...scheduledToday,
].sort((a, b) => a.startTime.localeCompare(b.startTime));

// ---------------------------------------------------------------------------
// Resultados dos últimos 6 dias (aba "Resultados")
// ---------------------------------------------------------------------------
const pastScores: Array<[string, string, number, number]> = [
  ['fla', 'for', 3, 0],
  ['pal', 'juv', 2, 0],
  ['bot', 'int', 1, 1],
  ['cor', 'gre', 0, 2],
  ['sao', 'bah', 2, 2],
  ['flu', 'vas', 1, 0],
  ['cam', 'spt', 4, 1],
  ['san', 'cui', 1, 0],
  ['rbb', 'cea', 2, 2],
  ['juv', 'fla', 0, 1],
  ['for', 'pal', 1, 2],
  ['int', 'sao', 3, 1],
  ['bah', 'cor', 1, 1],
  ['gre', 'flu', 0, 0],
  ['vas', 'san', 2, 1],
  ['cui', 'cam', 1, 3],
  ['spt', 'rbb', 0, 1],
  ['cea', 'bot', 2, 0],
];

const pastResults: Match[] = pastScores.map(([h, a, hs, as], i) => {
  const dayOffset = -(1 + Math.floor(i / 3)); // 3 jogos por dia
  const hour = 16 + (i % 3) * 2;
  return match(BRA, 33, daysFromNow(dayOffset, hour), h, a, {
    status: 'finished',
    homeScore: hs,
    awayScore: as,
  });
});

// Resultados já encerrados de hoje também entram na lista
export const RESULTS: Match[] = [...TODAY_MATCHES, ...pastResults]
  .filter((m) => m.status === 'finished')
  .sort((a, b) => b.startTime.localeCompare(a.startTime));

// ---------------------------------------------------------------------------
// Calendário: próximos 10 dias de jogos agendados
// ---------------------------------------------------------------------------
const fixtures: Array<[number, string, string, number]> = [
  [1, 'fla', 'flu', 19],
  [1, 'int', 'cor', 21],
  [2, 'bot', 'pal', 16],
  [2, 'san', 'sao', 18],
  [2, 'bah', 'vas', 20],
  [3, 'cor', 'cam', 19],
  [3, 'flu', 'pal', 21],
  [4, 'gre', 'fla', 16],
  [4, 'int', 'bot', 18],
  [4, 'spt', 'for', 20],
  [5, 'pal', 'sao', 19],
  [6, 'vas', 'gre', 19],
  [6, 'cui', 'flu', 21],
  [7, 'san', 'fla', 20],
  [8, 'cam', 'bah', 19],
  [8, 'bot', 'cea', 21],
  [9, 'for', 'int', 19],
  [10, 'sao', 'vas', 20],
];

const upcoming: Match[] = fixtures.map(([dayOffset, h, a, hour], i) =>
  match(BRA, 35 + Math.floor(i / 4), daysFromNow(dayOffset, hour), h, a),
);

/** Todos os jogos: hoje (qualquer status) + passados + futuros */
export const ALL_MATCHES: Match[] = [
  ...TODAY_MATCHES,
  ...pastResults,
  ...upcoming,
];
// ---------------------------------------------------------------------------
// Classificação (dados ilustrativos — a versão real vem da API)
// ---------------------------------------------------------------------------
type Row = [string, number, number, number, number, number, number, number, string | null];

// time, pontos, jogos, v, e, d, gp, gc, último resultado
const tableData: Row[] = [
  ['pal', 71, 33, 22, 5, 6, 58, 26, 'V'],
  ['fla', 67, 33, 20, 7, 6, 61, 30, 'V'],
  ['bot', 62, 33, 18, 8, 7, 49, 28, 'V'],
  ['int', 58, 33, 17, 7, 9, 48, 34, 'V'],
  ['sao', 55, 33, 15, 10, 8, 44, 33, 'E'],
  ['cru', 53, 33, 15, 8, 10, 42, 33, 'D'],
  ['bah', 51, 33, 14, 9, 10, 40, 35, 'E'],
  ['flu', 49, 33, 13, 10, 10, 38, 34, 'V'],
  ['cam', 48, 33, 13, 9, 11, 45, 39, 'E'],
  ['gre', 46, 33, 12, 10, 11, 36, 37, 'D'],
  ['cor', 44, 33, 11, 11, 11, 34, 36, 'D'],
  ['rbb', 43, 33, 11, 10, 12, 37, 39, 'E'],
  ['san', 41, 33, 11, 8, 14, 33, 40, 'D'],
  ['vas', 40, 33, 10, 10, 13, 35, 42, 'E'],
  ['for', 38, 33, 10, 8, 15, 31, 41, 'D'],
  ['cea', 36, 33, 9, 9, 15, 30, 44, 'V'],
  ['spt', 33, 33, 8, 9, 16, 27, 46, 'D'],
  ['vit', 31, 33, 8, 7, 18, 30, 51, 'D'],
  ['juv', 29, 33, 7, 8, 18, 26, 53, 'E'],
  ['cui', 25, 33, 5, 10, 18, 23, 55, 'D'],
];

export const STANDINGS: StandingRow[] = tableData.map(
  ([id, points, played, won, drawn, lost, gf, gc, form], index) => ({
    position: index + 1,
    team: team(id),
    points,
    played,
    won,
    drawn,
    lost,
    goalsFor: gf,
    goalsAgainst: gc,
    form: (form as StandingRow['form']) ?? null,
  }),
);

export const MOCK_TOP_SCORERS = [
  {
    rank: 1,
    playerId: 'p1',
    playerName: 'Pedro',
    team: { id: 'fla', name: 'Flamengo', shortName: 'FLA', acronym: 'FLA' },
    goals: 19,
    assists: 5,
    penalties: 3,
    matchesPlayed: 28,
  },
  {
    rank: 2,
    playerId: 'p2',
    playerName: 'Hulk',
    team: { id: 'cam', name: 'Atlético-MG', shortName: 'CAM', acronym: 'CAM' },
    goals: 16,
    assists: 7,
    penalties: 4,
    matchesPlayed: 29,
  },
  {
    rank: 3,
    playerId: 'p3',
    playerName: 'Flaco López',
    team: { id: 'pal', name: 'Palmeiras', shortName: 'PAL', acronym: 'PAL' },
    goals: 15,
    assists: 3,
    penalties: 0,
    matchesPlayed: 27,
  },
  {
    rank: 4,
    playerId: 'p4',
    playerName: 'Yuri Alberto',
    team: { id: 'cor', name: 'Corinthians', shortName: 'COR', acronym: 'COR' },
    goals: 14,
    assists: 4,
    penalties: 2,
    matchesPlayed: 30,
  },
  {
    rank: 5,
    playerId: 'p5',
    playerName: 'Luciano',
    team: { id: 'sao', name: 'São Paulo', shortName: 'SAO', acronym: 'SAO' },
    goals: 13,
    assists: 6,
    penalties: 1,
    matchesPlayed: 31,
  },
  {
    rank: 6,
    playerId: 'p6',
    playerName: 'Everaldo',
    team: { id: 'bah', name: 'Bahia', shortName: 'BAH', acronym: 'BAH' },
    goals: 12,
    assists: 2,
    penalties: 2,
    matchesPlayed: 29,
  },
  {
    rank: 7,
    playerId: 'p7',
    playerName: 'Luiz Henrique',
    team: { id: 'bot', name: 'Botafogo', shortName: 'BOT', acronym: 'BOT' },
    goals: 11,
    assists: 8,
    penalties: 0,
    matchesPlayed: 26,
  },
  {
    rank: 8,
    playerId: 'p8',
    playerName: 'Pablo Vegetti',
    team: { id: 'vas', name: 'Vasco da Gama', shortName: 'VAS', acronym: 'VAS' },
    goals: 11,
    assists: 1,
    penalties: 3,
    matchesPlayed: 28,
  },
  {
    rank: 9,
    playerId: 'p9',
    playerName: 'Rafael Borré',
    team: { id: 'int', name: 'Internacional', shortName: 'INT', acronym: 'INT' },
    goals: 10,
    assists: 3,
    penalties: 1,
    matchesPlayed: 24,
  },
  {
    rank: 10,
    playerId: 'p10',
    playerName: 'Germán Cano',
    team: { id: 'flu', name: 'Fluminense', shortName: 'FLU', acronym: 'FLU' },
    goals: 10,
    assists: 2,
    penalties: 0,
    matchesPlayed: 25,
  },
];




