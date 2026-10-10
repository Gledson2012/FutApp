import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MatchCard } from '../../src/components/MatchCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { EmptyView, LoadingView } from '../../src/components/Feedback';
import { CompetitionFilter } from '../../src/components/CompetitionFilter';
import { getResults, invalidateCache } from '../../src/services/api';
import { Match } from '../../src/types';
import { colors, spacing } from '../../src/theme';
import { formatDayLabel } from '../../src/utils/date';

interface DaySection {
  title: string;
  data: Match[];
}

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
 * Aba "Resultados" — jogos encerrados (GET /matches?status=FINISHED)
 * agrupados por dia, com filtro por competição.
 */
export default function ResultsScreen() {
  const router = useRouter();
  const [selectedComp, setSelectedComp] = useState('ALL');
  const [allResults, setAllResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const results = await getResults();
    setAllResults(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    invalidateCache();
    await load();
    setRefreshing(false);
  }, [load]);

  const sections = useMemo(() => {
    const filtered = allResults.filter((m) => filterMatchByComp(m, selectedComp));
    const groups = new Map<string, Match[]>();

    filtered.forEach((m) => {
      const key = new Date(m.startTime).toDateString();
      const list = groups.get(key) ?? [];
      list.push(m);
      groups.set(key, list);
    });

    const next: DaySection[] = Array.from(groups.entries()).map(
      ([key, data]) => ({
        title: formatDayLabel(new Date(key)),
        data,
      }),
    );
    return next;
  }, [allResults, selectedComp]);

  if (loading) {
    return <LoadingView label="Carregando resultados..." />;
  }

  const openMatch = (id: string) => router.push(`/match/${id}`);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <CompetitionFilter
            selectedId={selectedComp}
            onSelect={setSelectedComp}
          />
        </View>
      }
      renderSectionHeader={({ section }) => (
        <SectionHeader title={section.title} />
      )}
      renderItem={({ item }) => (
        <MatchCard match={item} onPress={() => openMatch(item.id)} />
      )}
      ListEmptyComponent={
        <EmptyView
          icon="podium-outline"
          title="Nenhum resultado encontrado"
          message="Não encontramos resultados com o filtro selecionado."
        />
      }
      ListFooterComponent={
        sections.length > 0 ? (
          <Text style={styles.footer}>Fonte: BrasaFut API</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  headerContainer: {
    marginBottom: spacing.sm,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

