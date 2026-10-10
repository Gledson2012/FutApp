import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SectionHeader } from '../../src/components/SectionHeader';
import { StandingTable } from '../../src/components/StandingTable';
import { LoadingView } from '../../src/components/Feedback';
import { getLiveStandings, invalidateCache } from '../../src/services/api';
import { LiveStandingRow } from '../../src/types';
import { BRA_COMPETITION_NAME } from '../../src/config';
import { colors, spacing } from '../../src/theme';

/**
 * Aba "Classificação" — GET /api/v1/standings/live?seasonId=1 (Brasileirão).
 * Atualizada em tempo real com movimentações de posição (▲▼) e jogos ao vivo.
 */
export default function StandingsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<LiveStandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getLiveStandings();
    setRows(data);
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
    return <LoadingView label="Carregando classificação..." />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
      <SectionHeader
        title={BRA_COMPETITION_NAME}
        subtitle="Tabela em tempo real · BrasaFut API"
      />
      <StandingTable
        rows={rows}
        showMovement={true}
        onTeamPress={(teamId) => router.push(`/team/${teamId}`)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
