import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { HeadToHead, Match, TeamSummary } from '../../types';
import { getMatchH2H } from '../../services/api';
import { colors, radius, spacing } from '../../theme';
import { TeamCrest } from '../TeamCrest';
import { SkeletonBlock } from '../Skeleton';
import { formatDayShort } from '../../utils/date';

interface HeadToHeadSectionProps {
  match: Match;
}

export function HeadToHeadSection({ match }: HeadToHeadSectionProps) {
  const [h2h, setH2H] = useState<HeadToHead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const homeSum: TeamSummary = {
      id: match.home.id,
      name: match.home.name,
      shortName: match.home.shortName,
      logoUrl: match.home.logoUrl,
    };
    const awaySum: TeamSummary = {
      id: match.away.id,
      name: match.away.name,
      shortName: match.away.shortName,
      logoUrl: match.away.logoUrl,
    };

    getMatchH2H(match.id, homeSum, awaySum).then((data) => {
      if (mounted) {
        setH2H(data);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [match]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonBlock style={{ height: 100, borderRadius: radius.lg }} />
        <SkeletonBlock style={{ height: 180, borderRadius: radius.lg, marginTop: 12 }} />
      </View>
    );
  }

  if (!h2h) return null;

  const total = h2h.totalMatches || 1;
  const homePct = Math.round((h2h.homeWins / total) * 100);
  const drawPct = Math.round((h2h.draws / total) * 100);
  const awayPct = Math.max(0, 100 - homePct - drawPct);

  return (
    <View style={styles.container}>
      {/* Resumo visual do confronto */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          Histórico do Confronto ({h2h.totalMatches} jogos)
        </Text>

        <View style={styles.teamsRow}>
          <View style={styles.teamSide}>
            <TeamCrest team={match.home} size={36} />
            <Text style={styles.teamSideName} numberOfLines={1}>
              {match.home.shortName || match.home.name}
            </Text>
            <Text style={styles.winsText}>{h2h.homeWins} vitórias</Text>
          </View>

          <View style={styles.centerDraw}>
            <Text style={styles.drawCountText}>{h2h.draws}</Text>
            <Text style={styles.drawLabel}>Empates</Text>
          </View>

          <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
            <TeamCrest team={match.away} size={36} />
            <Text style={styles.teamSideName} numberOfLines={1}>
              {match.away.shortName || match.away.name}
            </Text>
            <Text style={styles.winsText}>{h2h.awayWins} vitórias</Text>
          </View>
        </View>

        {/* Barra proporcional de vitórias */}
        <View style={styles.barContainer}>
          <View style={[styles.barSegment, styles.barHome, { width: `${Math.max(8, homePct)}%` }]}>
            <Text style={styles.barText}>{homePct}%</Text>
          </View>
          <View style={[styles.barSegment, styles.barDraw, { width: `${Math.max(8, drawPct)}%` }]}>
            <Text style={styles.barText}>{drawPct}%</Text>
          </View>
          <View style={[styles.barSegment, styles.barAway, { width: `${Math.max(8, awayPct)}%` }]}>
            <Text style={styles.barText}>{awayPct}%</Text>
          </View>
        </View>
      </View>

      {/* Estatísticas acumuladas */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionHeaderTitle}>⚽ Gols no Confronto</Text>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>{h2h.homeGoals}</Text>
          <Text style={styles.statLabel}>Gols Marcados</Text>
          <Text style={styles.statNumber}>{h2h.awayGoals}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>
            {(h2h.homeGoals / total).toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Média por Partida</Text>
          <Text style={styles.statNumber}>
            {(h2h.awayGoals / total).toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Últimos jogos entre os dois */}
      <Text style={styles.sectionHeaderTitle}>📅 Últimos Duelos</Text>
      {h2h.recentMatches.map((item) => {
        const isHomeWinner = item.homeScore > item.awayScore;
        const isAwayWinner = item.awayScore > item.homeScore;

        return (
          <View key={item.id} style={styles.matchRowCard}>
            <View style={styles.matchMetaRow}>
              <Text style={styles.matchComp}>{item.competition}</Text>
              <Text style={styles.matchDate}>
                {formatDayShort(new Date(item.date))}
              </Text>
            </View>

            <View style={styles.matchBodyRow}>
              <View style={styles.matchTeam}>
                <TeamCrest team={item.homeTeam} size={20} />
                <Text
                  style={[
                    styles.matchTeamName,
                    isHomeWinner && styles.matchWinnerName,
                  ]}
                  numberOfLines={1}
                >
                  {item.homeTeam.shortName || item.homeTeam.name}
                </Text>
              </View>

              <View style={styles.matchScoreBadge}>
                <Text style={styles.matchScoreText}>
                  {item.homeScore} × {item.awayScore}
                </Text>
              </View>

              <View style={[styles.matchTeam, { justifyContent: 'flex-end' }]}>
                <Text
                  style={[
                    styles.matchTeamName,
                    isAwayWinner && styles.matchWinnerName,
                  ]}
                  numberOfLines={1}
                >
                  {item.awayTeam.shortName || item.awayTeam.name}
                </Text>
                <TeamCrest team={item.awayTeam} size={20} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  loadingContainer: {
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  teamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamSide: {
    alignItems: 'flex-start',
    width: 110,
    gap: 4,
  },
  teamSideName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  winsText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  centerDraw: {
    alignItems: 'center',
  },
  drawCountText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  drawLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  barContainer: {
    flexDirection: 'row',
    height: 22,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.md,
    backgroundColor: colors.cardAlt,
  },
  barSegment: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  barHome: {
    backgroundColor: colors.accent,
  },
  barDraw: {
    backgroundColor: '#64748B',
  },
  barAway: {
    backgroundColor: colors.info,
  },
  barText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionHeaderTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statNumber: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    width: 50,
    textAlign: 'center',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  matchRowCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  matchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  matchComp: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  matchDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  matchBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  matchTeamName: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  matchWinnerName: {
    color: colors.text,
    fontWeight: '800',
  },
  matchScoreBadge: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginHorizontal: spacing.sm,
  },
  matchScoreText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
});
