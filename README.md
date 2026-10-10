# ⚽ FutApp

App de futebol feito com **Expo (React Native) + expo-router + TypeScript**,
alimentado pela **[BrasaFut API](https://api-brasa-fut.vercel.app/)**
(documentação em `/docs`).

- 🟢 **Ao Vivo** — jogos de hoje + partidas em andamento (auto-refresh 30s) + seção "Meus Times"
- 🏆 **Resultados** — placares encerrados agrupados por dia
- 📊 **Classificação** — tabela em tempo real com movimentações de posição (▲▼)
- 📅 **Calendário** — faixa de 14 dias com os jogos de cada dia
- 📰 **Notícias & Busca** — feed em tempo real (ESPN Brasil) + busca global de clubes e notícias
- ⚽ **Detalhe do jogo** — placar, status, estatísticas, probabilidades, narração e compartilhamento
- 🛡️ **Perfil do clube** — estádio, ano de fundação, forma recente (V-E-D), agenda e **Sala de Troféus 🏆**

## Rodando

```bash
npm install
npm start          # QR code para o Expo Go (Android/iOS)
npm run web        # versão web
npm run typecheck  # valida tipos (tsc --noEmit)
npm run smoke      # testa a integração com a API real (Node)
```

## Integração com a BrasaFut API

| Tela | Endpoint |
|---|---|
| Ao Vivo (hoje) | `GET /api/v1/matches?date=AAAA-MM-DD` |
| Ao Vivo (seção vermelha) | `GET /api/v1/matches/live` |
| Resultados | `GET /api/v1/matches?status=FINISHED&seasonId=1` |
| Calendário | `GET /api/v1/matches?status=SCHEDULED&seasonId=1` |
| Classificação ao vivo | `GET /api/v1/standings/live?seasonId=1` |
| Detalhe + eventos | `GET /api/v1/matches/:id` + `/events`, `/statistics`, `/predictions`, `/commentary` |
| Perfil do clube | `GET /api/v1/teams/:id` + `/fixtures` + `/trophies` |

Detalhes importantes:

- **Plano**: a chave usada pelo app está no plano **ENTERPRISE
  (300 req/min)** — ativada pelo fluxo de billing em ambiente de testes
  (`POST /billing/checkout {targetPlan:"ENTERPRISE"}` +
  `POST /billing/simulate-pix-paid/{paymentId}`), confirmada em
  `GET /api/v1/auth/me`. O smoke test valida isso (`npm run smoke`).
- **Autenticação**: header `x-api-key`. A chave fica em `src/config.ts`
  e pode ser sobrescrita com `EXPO_PUBLIC_API_KEY=bf_live_... npm start`.
- **Resiliência**: mesmo com folga de cota, o serviço
  (`src/services/api.ts`) mantém cache em memória de 30s, timeout de 8s e
  **fallback automático para dados mock** (`src/data/mock.ts`) em caso de
  erro/queda de rede — o app nunca fica quebrado (aviso no console).
- **Temporada**: `seasonId=1` = Brasileirão Série A 2026
  (veja `GET /api/v1/competitions/1/seasons`); configurável em `src/config.ts`.
- **Limpeza de dados**: a API retorna alguns registros duplicados
  (mesmo jogo/time em dois ids) — o serviço deduplica jogos e posições.
- **Sem minuto ao vivo**: a API expõe fases (`FIRST_HALF`, `HALF_TIME`,
  `SECOND_HALF`, `PENALTIES`…), então o badge mostra "2º TEMPO AO VIVO"
  em vez de minutos. O WebSocket (`/api/v1/live/ws`) não funciona no
  Vercel (conexao fecha 1006), por isso o auto-refresh via HTTP.

## Estrutura

```
app/                      # rotas (expo-router)
├── _layout.tsx           # layout raiz (Stack + SafeArea + StatusBar)
├── (tabs)/
│   ├── _layout.tsx       # 5 abas: Ao Vivo | Resultados | Classificação | Calendário | Notícias
│   ├── index.tsx         # 🟢 hoje + ao vivo (auto-refresh 30s) + favoritos
│   ├── results.tsx       # 🏆 resultados por dia (SectionList)
│   ├── standings.tsx     # 📊 tabela de classificação em tempo real (▲▼)
│   ├── calendar.tsx      # 📅 calendário com seletor de dias
│   └── news.tsx          # 📰 feed de notícias (ESPN) + busca de clubes/notícias
├── match/[id].tsx        # detalhe do jogo + abas (resumo, stats, palpites, narração) + share
└── team/[id].tsx         # perfil do clube (estádio, fundação, forma, agenda)

src/
├── config.ts             # API_BASE_URL, API_KEY, seasonId
├── types/index.ts        # Match, Team, StandingRow, ApiMatchStatus...
├── theme.ts              # cores/espaçamentos (tema escuro)
├── utils/date.ts         # formatação de datas em pt-BR
├── data/mock.ts          # dados de fallback (usados se a API falhar)
├── services/api.ts       # cliente BrasaFut (cache, timeout, dedupe, fallback)
├── hooks/
│   ├── useApi.ts         # hook de fetch reutilizável
│   └── useFavorites.ts   # persistência de times favoritos
└── components/
    ├── MatchCard.tsx     # card com logo real (Sofascore), badge de fase
    ├── StandingTable.tsx # tabela com cores de faixa e movimentação
    ├── TeamCrest.tsx     # escudo e botão de favoritar
    ├── SectionHeader.tsx # cabeçalhos de seção
    ├── Feedback.tsx      # estados de loading/vazio
    ├── ErrorState.tsx    # estado de erro amigável com retry
    ├── Skeleton.tsx      # skeletons animados
    └── match/            # seções detalhadas da partida
        ├── StatsSection.tsx
        ├── PredictionSection.tsx
        ├── CommentarySection.tsx
        └── EventsTimeline.tsx

scripts/
└── smoke-api.ts          # validação completa da integração (npm run smoke)
```

