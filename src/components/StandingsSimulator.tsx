import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match, StandingRow } from '../types';
import { colors, radius, spacing } from '../theme';
import { TeamCrest } from './TeamCrest';

interface StandingsSimulatorProps {
  initialStandings: StandingRow[];
  upcomingMatches?: Match[];
}

interface SimulatedScore {
  home: number;
  away: number;
  active: boolean;
}

export function StandingsSimulator({
  initialStandings,
  upcomingMatches = [],
}: StandingsSimulatorProps) {
  // Gera uma rodada simulada se upcomingMatches for vazio
  const matchesToSimulate: Match[] = useMemo(() => {
    if (upcomingMatches && upcomingMatches.length > 0) {
      return upcomingMatches.slice(0, 10);
    }
    // Cria 10 jogos pareando a tabela atual (1x2, 3x4, 5x6...)
    const pairs: Match[] = [];
    for (let i = 0; i < initialStandings.length - 1; i += 2) {
      const h = initialStandings[i]?.team;
      const a = initialStandings[i + 1]?.team;
      if (h && a) {
        pairs.push({
          id: `sim-match-${i}`,
          home: h,
          away: a,
          startTime: new Date().toISOString(),
          status: 'scheduled',
          events: [],
        });
      }
    }
    return pairs;
  }, [upcomingMatches, initialStandings]);

  // Estado dos placares simulados
  const [scores, setScores] = useState<Record<string, SimulatedScore>>({});

  const setMatchScore = (matchId: string, home: number, away: number) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: { home, away, active: true },
    }));
  };

  const clearSimulation = () => {
    setScores({});
  };

  // Recalcula a tabela com base nos placares simulados
  const simulatedStandings = useMemo(() => {
    const tableMap = new Map<
      string,
      {
        position: number;
        originalPos: number;
        team: StandingRow['team'];
        points: number;
        played: number;
        won: number;
        drawn: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDiff: number;
      }
    >();

    // Inicializa com dados reais
    initialStandings.forEach((row) => {
      tableMap.set(row.team.id, {
        position: row.position,
        originalPos: row.position,
        team: row.team,
        points: row.points,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDiff: row.goalsFor - row.goalsAgainst,
      });
    });

    // Aplica os jogos simulados
    matchesToSimulate.forEach((m) => {
      const sim = scores[m.id];
      if (!sim || !sim.active) return;

      const homeRow = tableMap.get(m.home.id);
      const awayRow = tableMap.get(m.away.id);

      if (!homeRow || !awayRow) return;

      homeRow.played += 1;
      awayRow.played += 1;
      homeRow.goalsFor += sim.home;
      homeRow.goalsAgainst += sim.away;
      homeRow.goalDiff = homeRow.goalsFor - homeRow.goalsAgainst;

      awayRow.goalsFor += sim.away;
      awayRow.goalsAgainst += sim.home;
      awayRow.goalDiff = awayRow.goalsFor - awayRow.goalsAgainst;

      if (sim.home > sim.away) {
        homeRow.points += 3;
        homeRow.won += 1;
        awayRow.lost += 1;
      } else if (sim.away > sim.home) {
        awayRow.points += 3;
        awayRow.won += 1;
        homeRow.lost += 1;
      } else {
        homeRow.points += 1;
        awayRow.points += 1;
        homeRow.drawn += 1;
        awayRow.drawn += 1;
      }
    });

    // Ordenação oficial: Pontos -> Vitórias -> Saldo -> Gols Pró
    const sorted = Array.from(tableMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });

    return sorted.map((row, idx) => ({
      ...row,
      simulatedPos: idx + 1,
      delta: row.originalPos - (idx + 1), // > 0 subiu, < 0 desceu
    }));
  }, [initialStandings, matchesToSimulate, scores]);

  const simulatedCount = Object.values(scores).filter((s) => s.active).length;

  return (
    <View style={styles.container}>
      {/* Banner explicativo */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Ionicons name="calculator-outline" size={20} color={colors.accent} />
          <View>
            <Text style={styles.bannerTitle}>Simulador de Resultados</Text>
            <Text style={styles.bannerSubtitle}>
              {simulatedCount === 0
                ? 'Dê palpites nos jogos abaixo para ver o impacto na tabela.'
                : `${simulatedCount} jogo(s) simulado(s)`}
            </Text>
          </View>
        </View>

        {simulatedCount > 0 && (
          <Pressable onPress={clearSimulation} style={styles.resetButton}>
            <Ionicons name="refresh-outline" size={14} color={colors.warn} />
            <Text style={styles.resetButtonText}>Limpar</Text>
          </Pressable>
        )}
      </View>

      {/* Lista de jogos para simulação */}
      <Text style={styles.sectionTitle}>🎯 Palpitar na Próxima Rodada</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.matchesScroll}
      >
        {matchesToSimulate.map((m) => {
          const sim = scores[m.id];
          const homeScore = sim?.home ?? 0;
          const awayScore = sim?.away ?? 0;
          const isActive = sim?.active ?? false;

          return (
            <View key={m.id} style={[styles.matchSimCard, isActive && styles.matchSimCardActive]}>
              <View style={styles.matchTeamsRow}>
                <View style={styles.teamCol}>
                  <TeamCrest team={m.home} size={28} />
                  <Text style={styles.teamSimName} numberOfLines={1}>
                    {m.home.shortName}
                  </Text>
                  <View style={styles.stepperRow}>
                    <Pressable
                      onPress={() =>
                        setMatchScore(m.id, Math.max(0, homeScore - 1), awayScore)
                      }
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>-</Text>
                    </Pressable>
                    <Text style={styles.scoreText}>{homeScore}</Text>
                    <Pressable
                      onPress={() => setMatchScore(m.id, homeScore + 1, awayScore)}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.vsText}>×</Text>

                <View style={styles.teamCol}>
                  <TeamCrest team={m.away} size={28} />
                  <Text style={styles.teamSimName} numberOfLines={1}>
                    {m.away.shortName}
                  </Text>
                  <View style={styles.stepperRow}>
                    <Pressable
                      onPress={() =>
                        setMatchScore(m.id, homeScore, Math.max(0, awayScore - 1))
                      }
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>-</Text>
                    </Pressable>
                    <Text style={styles.scoreText}>{awayScore}</Text>
                    <Pressable
                      onPress={() => setMatchScore(m.id, homeScore, awayScore + 1)}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Botões rápidos */}
              <View style={styles.quickBtnsRow}>
                <Pressable
                  onPress={() => setMatchScore(m.id, 1, 0)}
                  style={[styles.quickBtn, isActive && homeScore > awayScore && styles.quickBtnSelected]}
                >
                  <Text style={styles.quickBtnText}>1x0</Text>
                </Pressable>
                <Pressable
                  onPress={() => setMatchScore(m.id, 1, 1)}
                  style={[styles.quickBtn, isActive && homeScore === awayScore && styles.quickBtnSelected]}
                >
                  <Text style={styles.quickBtnText}>1x1</Text>
                </Pressable>
                <Pressable
                  onPress={() => setMatchScore(m.id, 0, 1)}
                  style={[styles.quickBtn, isActive && awayScore > homeScore && styles.quickBtnSelected]}
                >
                  <Text style={styles.quickBtnText}>0x1</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Tabela Simulada */}
      <Text style={styles.sectionTitle}>📊 Classificação Simulada</Text>
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { width: 36 }]}>Pos</Text>
          <Text style={[styles.headerText, { width: 36 }]}>Var</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Clube</Text>
          <Text style={[styles.headerText, { width: 36, textAlign: 'center' }]}>PTS</Text>
          <Text style={[styles.headerText, { width: 32, textAlign: 'center' }]}>J</Text>
          <Text style={[styles.headerText, { width: 32, textAlign: 'center' }]}>V</Text>
          <Text style={[styles.headerText, { width: 36, textAlign: 'center' }]}>SG</Text>
        </View>

        {simulatedStandings.map((row) => {
          const isG4 = row.simulatedPos <= 4;
          const isG6 = row.simulatedPos > 4 && row.simulatedPos <= 6;
          const isSula = row.simulatedPos > 6 && row.simulatedPos <= 12;
          const isZ4 = row.simulatedPos >= 17;

          const indicatorColor = isG4
            ? colors.win
            : isG6
              ? colors.info
              : isSula
                ? colors.warn
                : isZ4
                  ? colors.danger
                  : 'transparent';

          return (
            <View
              key={row.team.id}
              style={[
                styles.tableRow,
                row.simulatedPos % 2 === 0 && styles.tableRowAlt,
              ]}
            >
              {/* Posição com barra de zona */}
              <View style={styles.posContainer}>
                <View style={[styles.zoneBar, { backgroundColor: indicatorColor }]} />
                <Text style={styles.posText}>{row.simulatedPos}º</Text>
              </View>

              {/* Variação */}
              <View style={styles.deltaContainer}>
                {row.delta > 0 ? (
                  <Text style={styles.deltaUp}>▲{row.delta}</Text>
                ) : row.delta < 0 ? (
                  <Text style={styles.deltaDown}>▼{Math.abs(row.delta)}</Text>
                ) : (
                  <Text style={styles.deltaSame}>-</Text>
                )}
              </View>

              {/* Time */}
              <View style={styles.teamContainer}>
                <TeamCrest team={row.team} size={20} />
                <Text style={styles.tableNameText} numberOfLines={1}>
                  {row.team.shortName || row.team.name}
                </Text>
              </View>

              <Text style={styles.pointsText}>{row.points}</Text>
              <Text style={styles.cellText}>{row.played}</Text>
              <Text style={styles.cellText}>{row.won}</Text>
              <Text style={styles.cellText}>{row.goalDiff}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    padding: spacing.md,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  bannerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  resetButtonText: {
    color: colors.warn,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  matchesScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  matchSimCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    width: 210,
  },
  matchSimCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.cardAlt,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: {
    alignItems: 'center',
    width: 80,
  },
  teamSimName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginVertical: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.cardAlt,
  },
  stepBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  scoreText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 8,
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  quickBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
  },
  quickBtnSelected: {
    backgroundColor: colors.accent,
  },
  quickBtnText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  tableCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cardAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  posContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 36,
  },
  zoneBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    marginRight: 4,
  },
  posText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  deltaContainer: {
    width: 36,
    alignItems: 'flex-start',
  },
  deltaUp: {
    color: colors.win,
    fontSize: 11,
    fontWeight: '800',
  },
  deltaDown: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },
  deltaSame: {
    color: colors.textMuted,
    fontSize: 12,
  },
  teamContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tableNameText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  pointsText: {
    width: 36,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  cellText: {
    width: 32,
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
  },
});
