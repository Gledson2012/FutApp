import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MatchCard } from '../../src/components/MatchCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { EmptyView, LoadingView } from '../../src/components/Feedback';
import { getResults, invalidateCache } from '../../src/services/api';
import { Match } from '../../src/types';
import { colors, spacing } from '../../src/theme';
import { formatDayLabel } from '../../src/utils/date';

interface DaySection {
  title: string;
  data: Match[];
}

/**
 * Aba "Resultados" — jogos encerrados do Brasileirão (GET /matches?status=FINISHED)
 * agrupados por dia, do mais recente para o mais antigo.
 */
export default function ResultsScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<DaySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const results = await getResults();
    const groups = new Map<string, Match[]>();

    results.forEach((m) => {
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
    setSections(next);
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
          message="Os placares dos jogos encerrados aparecerão aqui."
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
    paddingBottom: spacing.xl,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
