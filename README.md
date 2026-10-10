# ⚽ FutApp

App de futebol profissional feito com **Expo (React Native) + expo-router + TypeScript**,
alimentado pela **[BrasaFut API](https://api-brasa-fut.vercel.app/)**
(documentação em `/docs`).

- 🟢 **Ao Vivo** — jogos de hoje + partidas em andamento (auto-refresh 30s) + seção "Meus Times" + filtros por competição
- 🏆 **Resultados** — placares encerrados agrupados por dia com filtro de torneios
- 📊 **Classificação, Artilharia & Simulador**:
  - Tabela em tempo real com movimentações de posição (▲▼)
  - Tabela de Artilharia e assistências dos jogadores
  - **Simulador do Brasileirão**: simule resultados e veja o recálculo automático da tabela
- 📅 **Calendário** — faixa de 14 dias com seletor de competições
- 📰 **Notícias & Busca** — feed em tempo real (ESPN Brasil) + busca global instantânea de clubes e notícias
- ⚽ **Detalhe do Jogo**:
  - Resumo, eventos, estatísticas, probabilidades e narração lance a lance
  - ⚔️ **Head-to-Head (H2H)**: histórico e comparativo de vitórias/gols entre os dois times
  - 🎲 **Bolão do Usuário**: registre seus palpites, acumule pontos e acompanhe no card
  - 📸 **Social Card**: gerador de card estilizado para Instagram Stories, WhatsApp e X
- 🛡️ **Perfil do Clube** — estádio, ano de fundação, forma recente (V-E-D), agenda e **Sala de Troféus 🏆**
- 🌓 **Tema Escuro & Claro** — alternador rápido no topo com persistência local

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
| Artilharia | `GET /api/v1/competitions/:id/top-scorers` |
| Detalhe + eventos | `GET /api/v1/matches/:id` + `/events`, `/statistics`, `/predictions`, `/commentary`, `/h2h` |
| Perfil do clube | `GET /api/v1/teams/:id` + `/fixtures` + `/trophies` |

Detalhes importantes:

- **Plano**: a chave usada pelo app está no plano **ENTERPRISE
  (300 req/min)** — confirmada em `GET /api/v1/auth/me`. O smoke test valida isso (`npm run smoke`).
- **Autenticação**: header `x-api-key`. A chave fica em `src/config.ts`
  e pode ser sobrescrita com `EXPO_PUBLIC_API_KEY=bf_live_... npm start`.
- **Resiliência**: mesmo com folga de cota, o serviço
  (`src/services/api.ts`) mantém cache em memória de 30s, timeout de 8s e
  **fallback automático para dados mock** (`src/data/mock.ts`) em caso de
  erro/queda de rede — o app nunca fica quebrado (aviso no console).
- **Limpeza de dados**: deduplica jogos e posições automaticamente.

## Estrutura

```
app/                      # rotas (expo-router)
├── _layout.tsx           # layout raiz (Theme Context + Stack + SafeArea + StatusBar)
├── (tabs)/
│   ├── _layout.tsx       # 5 abas + botão de alternar tema Dark/Light
│   ├── index.tsx         # 🟢 hoje + ao vivo + favoritos + filtro de competições
│   ├── results.tsx       # 🏆 resultados por dia (SectionList) + filtro
│   ├── standings.tsx     # 📊 abas: Classificação (▲▼) | Artilharia | Simulador
│   ├── calendar.tsx      # 📅 calendário com seletor de dias e competições
│   └── news.tsx          # 📰 feed de notícias (ESPN) + busca de clubes/notícias
├── match/[id].tsx        # detalhe do jogo (5 abas: resumo, stats, palpites, H2H, narração) + share modal + bolão
└── team/[id].tsx         # perfil do clube (estádio, fundação, forma, agenda e sala de troféus)

src/
├── config.ts             # API_BASE_URL, API_KEY, seasonId
├── context/
│   └── ThemeContext.tsx  # provedor de tema claro/escuro com AsyncStorage
├── types/index.ts        # Match, Team, StandingRow, TopScorer, HeadToHead, UserPrediction...
├── theme.ts              # tokens de tema (dark/light), raios e espaçamentos
├── utils/date.ts         # formatação de datas em pt-BR
├── data/mock.ts          # dados de fallback (usados se a API falhar)
├── services/api.ts       # cliente BrasaFut (cache, timeout, dedupe, fallback)
├── hooks/
│   ├── useApi.ts         # hook de fetch reutilizável
│   ├── useFavorites.ts   # persistência de times favoritos
│   └── useUserPredictions.ts # bolão e palpites com cálculo automático de pontos
└── components/
    ├── MatchCard.tsx     # card com logo real, status, local e badge de palpite
    ├── StandingTable.tsx # tabela com cores de faixa e movimentação
    ├── TopScorersTable.tsx # tabela de artilheiros e assistências
    ├── StandingsSimulator.tsx # simulador interativo de classificação
    ├── CompetitionFilter.tsx # chips horizontais para filtrar torneios
    ├── TeamCrest.tsx     # escudo e botão de favoritar
    ├── SectionHeader.tsx # cabeçalhos de seção
    ├── Feedback.tsx      # estados de loading/vazio
    ├── ErrorState.tsx    # estado de erro amigável com retry
    ├── Skeleton.tsx      # skeletons animados
    └── match/            # seções detalhadas da partida
        ├── StatsSection.tsx
        ├── PredictionSection.tsx
        ├── CommentarySection.tsx
        ├── EventsTimeline.tsx
        ├── HeadToHeadSection.tsx # comparativo histórico H2H
        ├── MatchShareModal.tsx   # social card generator
        └── PredictionModal.tsx   # modal interativo de palpite

scripts/
└── smoke-api.ts          # validação completa de 11 endpoints da integração
```
