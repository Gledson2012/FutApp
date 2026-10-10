import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { CompetitionFilter } from '../../src/components/CompetitionFilter';
import { getMatchesByDay, invalidateCache } from '../../src/services/api';
import { Match } from '../../src/types';
import { BRA_COMPETITION_NAME } from '../../src/config';
import { colors, radius, spacing } from '../../src/theme';
import { addDays, formatDayShort, startOfDay } from '../../src/utils/date';

function filterMatchByComp(match: Match, compId: string): boolean {
  if (compId === 'ALL') return true;
  const comp = (match.competition || '').toLowerCase();
  if (compId === 'BRA') return comp.includes('brasileir') || comp.includes('série a');
  if (compId === 'CDB') return comp.includes('copa do brasil') || comp.includes('copa br');
  if (compId === 'LIB') return comp.includes('libertadores');
  if (compId === 'SUD') return comp.includes('sul-americana') || comp.includes('sudamericana');
  if (compId === 'EST') {
    return (
      comp.includes('paulista') ||
      comp.includes('carioca') ||
      comp.includes('mineiro') ||
      comp.includes('gaúcho') ||
      comp.includes('estadual')
    );
  }
  return true;
}

/**
 * Aba "Calendário" — fixtures do Brasileirão (GET /matches?status=SCHEDULED)
 * com faixa de 14 dias e filtro por competição.
 */
export default function CalendarScreen() {
  const router = useRouter();
  const [selectedComp, setSelectedComp] = useState('ALL');
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

  const filteredMatches = useMemo(
    () => matches.filter((m) => filterMatchByComp(m, selectedComp)),
    [matches, selectedComp],
  );

  if (loading) {
    return <LoadingView label="Carregando calendário..." />;
  }

  const openMatch = (id: string) => router.push(`/match/${id}`);

  return (
    <View style={styles.container}>
      {/* Filtro de Competições */}
      <View style={styles.filterWrapper}>
        <CompetitionFilter
          selectedId={selectedComp}
          onSelect={setSelectedComp}
        />
      </View>

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
          subtitle={`${BRA_COMPETITION_NAME} · ${filteredMatches.length} jogo(s)`}
        />
        {filteredMatches.length === 0 ? (
          <EmptyView
            icon="calendar-outline"
            title="Nenhum jogo neste filtro"
            message="Selecione outro dia ou competição acima."
          />
        ) : (
          filteredMatches.map((m) => (
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
  filterWrapper: {
    paddingTop: spacing.xs,
  },
  dayStrip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
    paddingBottom: spacing.xl * 2,
  },
});

