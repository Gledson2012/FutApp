import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Match, MatchStatRow } from '../../types';
import { colors, radius, spacing } from '../../theme';
import { TeamCrest } from '../TeamCrest';

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away;
  const pct = total > 0 ? (home / total) * 100 : 50;
  return (
    <View style={styles.row}>
      <Text style={styles.val}>{home}</Text>
      <View style={styles.mid}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
      </View>
      <Text style={styles.val}>{away}</Text>
    </View>
  );
}

/** Comparativo casa × fora (posse, chutes, passes…) */
export function StatsSection({ match, stats }: { match: Match; stats: MatchStatRow[] }) {
  if (stats.length === 0) {
    return <Text style={styles.empty}>Estatísticas ainda não disponíveis.</Text>;
  }
  const home = stats.find((s) => s.teamId === match.home.id) ?? stats[0];
  const away = stats.find((s) => s.teamId === match.away.id) ?? stats[1] ?? stats[0];
  return (
    <View style={styles.card}>
      <StatBar label="Posse de bola %" home={home.possessionPct ?? 0} away={away.possessionPct ?? 0} />
      <StatBar label="Chutes" home={home.shotsTotal ?? 0} away={away.shotsTotal ?? 0} />
      <StatBar label="Chutes no gol" home={home.shotsOnTarget ?? 0} away={away.shotsOnTarget ?? 0} />
      <StatBar label="Escanteios" home={home.corners ?? 0} away={away.corners ?? 0} />
      <StatBar label="Faltas" home={home.fouls ?? 0} away={away.fouls ?? 0} />
      <StatBar label="Defesas" home={home.saves ?? 0} away={away.saves ?? 0} />
      <StatBar label="Passes certos" home={home.passesAccurate ?? 0} away={away.passesAccurate ?? 0} />
      <View style={styles.teams}>
        <View style={styles.team}>
          <TeamCrest team={match.home} size={20} />
          <Text style={styles.teamName} numberOfLines={1}>{match.home.shortName}</Text>
        </View>
        <View style={styles.team}>
          <Text style={styles.teamName} numberOfLines={1}>{match.away.shortName}</Text>
          <TeamCrest team={match.away} size={20} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  empty: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  val: { color: colors.text, fontSize: 15, fontWeight: '800', width: 36, textAlign: 'center' },
  mid: { flex: 1, gap: 4 },
  label: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.info, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  teams: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  team: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamName: { color: colors.text, fontSize: 12, fontWeight: '700', maxWidth: 110 },
});
