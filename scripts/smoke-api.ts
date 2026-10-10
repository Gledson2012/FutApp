/**
 * Smoke test da integração com a BrasaFut API.
 * Roda fora do app (Node) e valida o plano ENTERPRISE da chave
 * e que os dados vêm da API real.
 *
 *   npx tsx scripts/smoke-api.ts   (ou: npm run smoke)
 */
import {
  API_BASE_URL,
  API_KEY,
} from '../src/config';
import {
  getFixtures,
  getLiveMatches,
  getLiveStandings,
  getMatchDetail,
  getResults,
  getStandings,
  getTeamDetail,
  getTeamFixtures,
  getTeamTrophies,
  getTodayMatches,
  getTopScorers,
  getMatchH2H,
} from '../src/services/api';

const isApiId = (id: string) => /^\d+$/.test(id);

function assert(cond: boolean, label: string): void {
  if (cond) {
    console.log(`  ✅ ${label}`);
  } else {
    console.error(`  ❌ ${label}`);
    process.exitCode = 1;
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('0) GET /auth/me — plano da API key');
  const me = (await (
    await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { 'x-api-key': API_KEY },
    })
  ).json()) as { plan: string; rateLimitPerMinute: number };
  assert(me.plan === 'ENTERPRISE', `plano: ${me.plan}`);
  assert(
    me.rateLimitPerMinute >= 300,
    `rate limit: ${me.rateLimitPerMinute} req/min`,
  );

  await wait(500);

  console.log('1) getTodayMatches');
  const today = await getTodayMatches();
  assert(today.length > 0, `jogos hoje: ${today.length}`);
  assert(
    today.every((m) => isApiId(m.id)),
    'ids numéricos (vem da API, não do mock)',
  );

  await wait(500);

  console.log('2) getLiveMatches');
  const live = await getLiveMatches();
  assert(live.length > 0, `jogos ao vivo: ${live.length}`);
  assert(
    live.every((m) => m.apiStatus !== undefined),
    'apiStatus presente (FIRST_HALF/SECOND_HALF/…)',
  );

  await wait(500);

  console.log('3) getResults');
  const results = await getResults();
  assert(results.length > 0, `resultados: ${results.length}`);
  assert(
    results.every((m) => m.status === 'finished'),
    'todos encerrados',
  );
  assert(
    results.every((m) => m.competition === 'Brasileirão Série A'),
    'competição rotulada',
  );

  await wait(500);

  console.log('4) getStandings');
  const table = await getStandings();
  assert(table.length >= 10, `linhas na tabela: ${table.length}`);
  const positions = new Set(table.map((r) => r.position));
  assert(
    positions.size === table.length,
    'sem posições duplicadas (dedupe ok)',
  );
  assert(
    table[0].points >= table[table.length - 1].points,
    'ordenado por pontos/posição',
  );

  await wait(500);

  console.log('5) getFixtures');
  const fixtures = await getFixtures();
  assert(fixtures.length > 0, `fixtures futuros: ${fixtures.length}`);

  await wait(500);

  console.log('6) getMatchDetail (id do 1º resultado)');
  const detail = await getMatchDetail(results[0].id);
  assert(!!detail, 'detalhe retornado');
  assert(
    !!detail && isApiId(detail.match.id),
    'id numérico no detalhe',
  );
  console.log(
    `    → ${detail?.match.home.name} ${detail?.match.homeScore ?? '-'} x ` +
      `${detail?.match.awayScore ?? '-'} ${detail?.match.away.name} · ` +
      `eventos: ${detail?.events.length ?? 0}`,
  );

  await wait(500);

  console.log('7) getLiveStandings');
  const liveTable = await getLiveStandings();
  assert(liveTable.length >= 10, `linhas na tabela ao vivo: ${liveTable.length}`);
  assert(
    liveTable.every((r) => r.movement !== undefined),
    'campo movement presente (UP/DOWN/SAME)',
  );

  await wait(500);

  console.log('8) getTeamDetail & getTeamFixtures');
  const testTeamId = table[0].team.id;
  const teamDetail = await getTeamDetail(testTeamId);
  assert(!!teamDetail, `detalhe do time ${table[0].team.name} retornado`);

  const teamFixtures = await getTeamFixtures(testTeamId);
  assert(!!teamFixtures, `fixtures do time retornados`);
  console.log(
    `    → Forma: ${(teamFixtures?.form ?? []).join('-')} · Passados: ${teamFixtures?.past.length ?? 0} · Próximos: ${teamFixtures?.next.length ?? 0}`,
  );

  await wait(500);

  console.log('9) getTeamTrophies');
  const trophies = await getTeamTrophies(testTeamId);
  assert(!!trophies, `sala de troféus de ${table[0].team.name} retornada`);
  console.log(
    `    → Total: ${trophies?.totalCount ?? 0} troféus (Int: ${trophies?.international.length ?? 0}, Nac: ${trophies?.national.length ?? 0}, Est: ${trophies?.state.length ?? 0})`,
  );

  await wait(500);

  console.log('10) getTopScorers');
  const scorers = await getTopScorers();
  assert(scorers.length > 0, `artilheiros retornados: ${scorers.length}`);
  console.log(`    → Líder: ${scorers[0].playerName} (${scorers[0].goals} gols)`);

  await wait(500);

  console.log('11) getMatchH2H');
  const h2h = await getMatchH2H(
    results[0].id,
    results[0].home,
    results[0].away,
  );
  assert(!!h2h, 'confronto direto retornado');
  console.log(
    `    → H2H ${results[0].home.name} x ${results[0].away.name}: ${h2h.totalMatches} jogos (${h2h.homeWins}V - ${h2h.draws}E - ${h2h.awayWins}D)`,
  );

  console.log(
    process.exitCode === 1
      ? '\nRESULTADO: FALHAS ACIMA ❌'
      : '\nRESULTADO: tudo OK ✅ (fonte: API real)',
  );
}

main().catch((err) => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
