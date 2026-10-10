import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MatchCard } from '../../src/components/MatchCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { EmptyView, LoadingView } from '../../src/components/Feedback';
import { getMatchesByDay, invalidateCache } from '../../src/services/api';
import { Match } from '../../src/types';
import { BRA_COMPETITION_NAME } from '../../src/config';
import { colors, radius, spacing } from '../../src/theme';
import { addDays, formatDayShort, startOfDay } from '../../src/utils/date';

/**
 * Aba "Calendário" — fixtures do Brasileirão (GET /matches?status=SCHEDULED)
 * com faixa de 14 dias; os fixtures ficam em cache, então trocar de dia não
 * gera novas chamadas à API.
 */
export default function CalendarScreen() {
  const router = useRouter();
  const [days, setDays] = useState<Date[]>([]);
  const [selected, setSelected] = useState<Date>(startOfDay(new Date()));
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Próximos 14 dias na faixa (hoje primeiro)
  useEffect(() => {
    const today = startOfDay(new Date());
    setDays(Array.from({ length: 14 }, (_, i) => addDays(today, i)));
  }, []);

  const load = useCallback(async (day: Date) => {
    const dayMatches = await getMatchesByDay(day);
    setMatches(dayMatches);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(selected);
  }, [selected, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    invalidateCache();
    await load(selected);
    setRefreshing(false);
  }, [selected, load]);

  if (loading) {
    return <LoadingView label="Carregando calendário..." />;
  }

  const openMatch = (id: string) => router.push(`/match/${id}`);

  return (
    <View style={styles.container}>
      {/* Faixa de dias */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayStrip}
      >
        {days.map((day) => {
          const active = day.toDateString() === selected.toDateString();
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => setSelected(day)}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                {formatDayShort(day)}
              </Text>
              {day.toDateString() === new Date().toDateString() && (
                <Text style={[styles.todayTag, active && styles.dayLabelActive]}>
                  hoje
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <SectionHeader
          title={`Jogos de ${formatDayShort(selected)}`}
          subtitle={`${BRA_COMPETITION_NAME} · ${matches.length} jogo(s)`}
        />
        {matches.length === 0 ? (
          <EmptyView
            icon="calendar-outline"
            title="Nenhum jogo neste dia"
            message="Selecione outro dia na faixa acima."
          />
        ) : (
          matches.map((m) => (
            <MatchCard key={m.id} match={m} onPress={() => openMatch(m.id)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayStrip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: '#04220F',
  },
  todayTag: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
