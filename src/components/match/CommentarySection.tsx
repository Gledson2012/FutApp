import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CommentaryItem } from '../../types';
import { colors, radius, spacing } from '../../theme';

function fmtMinute(min: number, extra?: number): string {
  return extra ? `${min}+${extra}'` : `${min}'`;
}

/** Narração lance a lance, mais recente primeiro */
export function CommentarySection({ items }: { items: CommentaryItem[] }) {
  if (items.length === 0) {
    return <Text style={styles.empty}>Narração ainda não disponível.</Text>;
  }
  return (
    <View style={styles.card}>
      {items.map((c) => (
        <View key={c.id} style={styles.row}>
          <View style={styles.minute}>
            <Text style={styles.minuteText}>{fmtMinute(c.minute, c.extraMinute)}</Text>
            {!!c.period && <Text style={styles.period}>{c.period}</Text>}
          </View>
          <View style={styles.body}>
            <Text style={styles.headline}>{c.headline}</Text>
            <Text style={styles.text}>{c.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  empty: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  minute: { width: 52, alignItems: 'center' },
  minuteText: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  period: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  body: { flex: 1, gap: 3 },
  headline: { color: colors.text, fontSize: 14, fontWeight: '700' },
  text: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
});
