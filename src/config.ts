/**
 * Configuração da BrasaFut API.
 * https://api-brasa-fut.vercel.app/  (docs: /docs)
 *
 * Plano da chave: ENTERPRISE (300 req/min) — ativado via fluxo de billing
 * em ambiente de testes (checkout + simulate-pix-paid). Confira com
 * GET /api/v1/auth/me.
 *
 * O cache e o fallback continuam por resiliência (rede instável/offline),
 * não mais por limite de cota.
 *
 * A chave pode ser sobrescrita via variável de ambiente:
 *   EXPO_PUBLIC_API_KEY=bf_live_... npm start
 */
export const API_BASE_URL = 'https://api-brasa-fut.vercel.app';

export const API_KEY =
  process.env.EXPO_PUBLIC_API_KEY ??
  'bf_live_77d64635a3a3849af19d30dc538f80b4bc8e388a';

/** seasonId do Brasileirão Série A (GET /competitions/1/seasons) */
export const BRA_SEASON_ID = 1;
export const BRA_COMPETITION_NAME = 'Brasileirão Série A';

/** TTL do cache em memória (evita chamadas repetidas ao trocar de aba) */
export const API_CACHE_TTL_MS = 30_000;

/** Timeout de cada requisição */
export const API_TIMEOUT_MS = 8_000;
