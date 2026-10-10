import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TopScorer } from '../types';
import { colors, radius, spacing } from '../theme';
import { TeamCrest } from './TeamCrest';

interface TopScorersTableProps {
  scorers: TopScorer[];
}

function getRankBadge(rank: number) {
  if (rank === 1) return { label: '🥇 1º', color: '#EAB308' };
  if (rank === 2) return { label: '🥈 2º', color: '#94A3B8' };
  if (rank === 3) return { label: '🥉 3º', color: '#D97706' };
  return { label: `${rank}º`, color: colors.textMuted };
}

export function TopScorersTable({ scorers }: TopScorersTableProps) {
  const router = useRouter();

  if (!scorers || scorers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header das colunas */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCol, styles.colRank]}>#</Text>
        <Text style={[styles.headerCol, styles.colPlayer]}>Jogador / Clube</Text>
        <Text style={[styles.headerCol, styles.colStat, styles.colGoals]}>Gols</Text>
        <Text style={[styles.headerCol, styles.colStat]}>Assists</Text>
        <Text style={[styles.headerCol, styles.colStat]}>Jogos</Text>
      </View>

      {/* Linhas de artilheiros */}
      {scorers.map((scorer, idx) => {
        const rankInfo = getRankBadge(scorer.rank ?? idx + 1);
        const isTop3 = (scorer.rank ?? idx + 1) <= 3;

        return (
          <View
            key={`${scorer.playerId}-${idx}`}
            style={[
              styles.row,
              idx % 2 === 1 && styles.rowAlt,
              isTop3 && styles.rowTop3,
            ]}
          >
            <View style={styles.colRank}>
              <Text style={[styles.rankText, { color: rankInfo.color }]}>
                {rankInfo.label}
              </Text>
            </View>

            <View style={styles.colPlayer}>
              <Text style={styles.playerName} numberOfLines={1}>
                {scorer.playerName}
              </Text>
              <Pressable
                onPress={() => scorer.team?.id && router.push(`/team/${scorer.team.id}`)}
                style={styles.teamSubRow}
              >
                <TeamCrest team={scorer.team} size={16} />
                <Text style={styles.teamName} numberOfLines={1}>
                  {scorer.team?.name || scorer.team?.shortName}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.colStat, styles.colGoals]}>
              <Text style={styles.goalsText}>{scorer.goals}</Text>
              {!!scorer.penalties && scorer.penalties > 0 && (
                <Text style={styles.penaltiesText}>({scorer.penalties} pen)</Text>
              )}
            </View>

            <View style={styles.colStat}>
              <Text style={styles.statText}>{scorer.assists ?? 0}</Text>
            </View>

            <View style={styles.colStat}>
              <Text style={styles.statText}>{scorer.matchesPlayed ?? '-'}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  headerCol: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colRank: {
    width: 48,
    alignItems: 'flex-start',
  },
  colPlayer: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  colStat: {
    width: 48,
    alignItems: 'center',
    textAlign: 'center',
  },
  colGoals: {
    width: 54,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  rowTop3: {
    backgroundColor: 'rgba(34, 197, 94, 0.03)',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
  },
  playerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  teamSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamName: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  goalsText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  penaltiesText: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  statText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
