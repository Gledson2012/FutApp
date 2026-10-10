import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Match, MatchPrediction } from '../../types';
import { colors, radius, spacing } from '../../theme';

function ProbabilityBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View style={styles.probRow}>
      <Text style={styles.probLabel}>{label}</Text>
      <View style={styles.probTrack}>
        <View style={[styles.probFill, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.probPct}>{pct}%</Text>
    </View>
  );
}

/** Quem vence, gols, placares prováveis, odds justas e análise */
export function PredictionSection({ match, pred }: { match: Match; pred: MatchPrediction | null }) {
  if (!pred) {
    return <Text style={styles.empty}>Palpites ainda não disponíveis.</Text>;
  }
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quem vence?</Text>
        <ProbabilityBar label={match.home.shortName} pct={pred.homeWinPct} color={colors.accent} />
        <ProbabilityBar label="Empate" pct={pred.drawPct} color={colors.textMuted} />
        <ProbabilityBar label={match.away.shortName} pct={pred.awayWinPct} color={colors.info} />
        {!!pred.fairOdds && (
          <Text style={styles.odds}>
            Odds justas: {match.home.shortName} {pred.fairOdds.home.toFixed(2)} · Empate {pred.fairOdds.draw.toFixed(2)} · {match.away.shortName} {pred.fairOdds.away.toFixed(2)}
          </Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gols</Text>
        {pred.avgGoals !== undefined && <Text style={styles.fact}>⚽ Média esperada: {pred.avgGoals.toFixed(2)}</Text>}
        {pred.over25Pct !== undefined && <Text style={styles.fact}>📈 Mais de 2.5 gols: {pred.over25Pct}%</Text>}
        {pred.bttsYesPct !== undefined && <Text style={styles.fact}>🤝 Ambas marcam: {pred.bttsYesPct}%</Text>}
      </View>
      {pred.likelyScores.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Placares prováveis</Text>
          {pred.likelyScores.map((s, i) => (
            <View key={`${s.score}-${i}`} style={styles.scoreRow}>
              <Text style={styles.scoreValue}>{s.score.replace(' - ', ' × ')}</Text>
              <Text style={styles.scoreProb}>{s.probability}%</Text>
            </View>
          ))}
        </View>
      )}
      {pred.insights.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Análise do modelo</Text>
          {pred.insights.map((ins, i) => (
            <Text key={i} style={styles.insight}>💡 {ins}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  empty: { color: colors.textMuted, fontSize: 14 },
  probRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  probLabel: { color: colors.text, fontSize: 13, fontWeight: '600', width: 52 },
  probTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  probFill: { height: 8, borderRadius: 4 },
  probPct: { color: colors.text, fontSize: 13, fontWeight: '800', width: 42, textAlign: 'right' },
  odds: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  fact: { color: colors.text, fontSize: 14 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  scoreValue: { color: colors.text, fontSize: 16, fontWeight: '800' },
  scoreProb: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  insight: { color: colors.text, fontSize: 13, lineHeight: 19 },
});
