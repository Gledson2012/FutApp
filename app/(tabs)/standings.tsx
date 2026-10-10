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
import { SectionHeader } from '../../src/components/SectionHeader';
import { StandingTable } from '../../src/components/StandingTable';
import { TopScorersTable } from '../../src/components/TopScorersTable';
import { StandingsSimulator } from '../../src/components/StandingsSimulator';
import { LoadingView } from '../../src/components/Feedback';
import {
  getFixtures,
  getLiveStandings,
  getTopScorers,
  invalidateCache,
} from '../../src/services/api';
import { LiveStandingRow, Match, TopScorer } from '../../src/types';
import { BRA_COMPETITION_NAME } from '../../src/config';
import { colors, radius, spacing } from '../../src/theme';

type StandingsTab = 'tabela' | 'artilharia' | 'simulador';

/**
 * Aba "Classificação" — GET /api/v1/standings/live?seasonId=1 (Brasileirão).
 * Atualizada em tempo real com movimentações de posição (▲▼), Artilharia e Simulador interativo.
 */
export default function StandingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StandingsTab>('tabela');
  const [rows, setRows] = useState<LiveStandingRow[]>([]);
  const [scorers, setScorers] = useState<TopScorer[]>([]);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [standingsData, scorersData, fixturesData] = await Promise.all([
      getLiveStandings(),
      getTopScorers().catch(() => [] as TopScorer[]),
      getFixtures().catch(() => [] as Match[]),
    ]);
    setRows(standingsData);
    setScorers(scorersData);
    setFixtures(fixturesData);
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
    return <LoadingView label="Carregando dados do campeonato..." />;
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

      {/* Seletor de visualização */}
      <View style={styles.tabSelector}>
        <Pressable
          onPress={() => setActiveTab('tabela')}
          style={[styles.tabBtn, activeTab === 'tabela' && styles.tabBtnActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'tabela' }}
        >
          <Text
            style={[styles.tabBtnText, activeTab === 'tabela' && styles.tabBtnTextActive]}
          >
            📊 Classificação
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('artilharia')}
          style={[styles.tabBtn, activeTab === 'artilharia' && styles.tabBtnActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'artilharia' }}
        >
          <Text
            style={[styles.tabBtnText, activeTab === 'artilharia' && styles.tabBtnTextActive]}
          >
            🎯 Artilharia
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('simulador')}
          style={[styles.tabBtn, activeTab === 'simulador' && styles.tabBtnActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'simulador' }}
        >
          <Text
            style={[styles.tabBtnText, activeTab === 'simulador' && styles.tabBtnTextActive]}
          >
            🧮 Simulador
          </Text>
        </Pressable>
      </View>

      {/* Conteúdo da aba selecionada */}
      {activeTab === 'tabela' && (
        <StandingTable
          rows={rows}
          showMovement={true}
          onTeamPress={(teamId) => router.push(`/team/${teamId}`)}
        />
      )}

      {activeTab === 'artilharia' && <TopScorersTable scorers={scorers} />}

      {activeTab === 'simulador' && (
        <StandingsSimulator initialStandings={rows} upcomingMatches={fixtures} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  tabSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabBtnText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#06281F',
  },
});

