import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ApiEventType, Match, MatchEvent } from '../../types';
import { colors, radius, spacing } from '../../theme';

const EVENT_ICON: Record<ApiEventType, string> = {
  GOAL: '⚽️',
  OWN_GOAL: '⚽️ (GC)',
  PENALTY_SCORED: '⚽️ (P)',
  PENALTY_MISSED: '❌ (P)',
  YELLOW_CARD: '🟨',
  RED_CARD: '🟥',
  SECOND_YELLOW: '🟨➡️🟥',
  SUBSTITUTION: '🔁',
};

export function fmtMinute(min: number, extra?: number): string {
  return extra ? `${min}+${extra}'` : `${min}'`;
}

/** Linha do tempo de gols, cartões e substituições */
export function EventsTimeline({ match, events }: { match: Match; events: MatchEvent[] }) {
  if (events.length === 0) {
    return <Text style={styles.empty}>Nenhum evento registrado.</Text>;
  }
  return (
    <View style={styles.card}>
      {events.map((event, index) => {
        const isHome = event.teamId === match.home.id;
        const team = isHome ? match.home : match.away;
        return (
          <View key={`${event.minute}-${index}`} style={[styles.row, !isHome && styles.rowAway]}>
            <Text style={styles.minute}>{fmtMinute(event.minute)}</Text>
            <Text style={styles.icon}>{EVENT_ICON[event.type]}</Text>
            <View style={styles.body}>
              <Text style={styles.player} numberOfLines={1}>{event.player}</Text>
              {!!event.description && (
                <Text style={styles.desc} numberOfLines={2}>{event.description}</Text>
              )}
            </View>
            <Text style={styles.team}>{team.shortName}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg },
  empty: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowAway: { flexDirection: 'row-reverse' },
  minute: { color: colors.textMuted, fontSize: 13, fontWeight: '700', width: 40 },
  icon: { fontSize: 14 },
  body: { flex: 1 },
  player: { color: colors.text, fontSize: 14, fontWeight: '600' },
  desc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  team: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
});
