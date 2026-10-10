import { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MatchCard } from '../../src/components/MatchCard';
import { ErrorState } from '../../src/components/ErrorState';
import { SkeletonBlock } from '../../src/components/Skeleton';
import { StatsSection } from '../../src/components/match/StatsSection';
import { PredictionSection } from '../../src/components/match/PredictionSection';
import { CommentarySection } from '../../src/components/match/CommentarySection';
import { EventsTimeline } from '../../src/components/match/EventsTimeline';
import { HeadToHeadSection } from '../../src/components/match/HeadToHeadSection';
import { MatchShareModal } from '../../src/components/match/MatchShareModal';
import { PredictionModal } from '../../src/components/match/PredictionModal';
import {
  getMatchCommentary,
  getMatchDetail,
  getMatchPrediction,
  getMatchStatistics,
  invalidateCache,
} from '../../src/services/api';
import {
  CommentaryItem,
  Match,
  MatchEvent,
  MatchPrediction,
  MatchStatRow,
} from '../../src/types';
import { colors, radius, spacing } from '../../src/theme';
import { calculatePredictionPoints, useUserPredictions } from '../../src/hooks/useUserPredictions';

type Tab = 'resumo' | 'stats' | 'palpites' | 'h2h' | 'narr';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'stats', label: 'Estatísticas' },
  { id: 'palpites', label: 'Palpites' },
  { id: 'h2h', label: 'H2H' },
  { id: 'narr', label: 'Narração' },
];

/**
 * Detalhes do jogo — BrasaFut API:
 *  GET /matches/:id + /events · /statistics · /predictions + /odds · /commentary
 */
export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('resumo');
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [stats, setStats] = useState<MatchStatRow[]>([]);
  const [pred, setPred] = useState<MatchPrediction | null>(null);
  const [comm, setComm] = useState<CommentaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [predModalVisible, setPredModalVisible] = useState(false);

  const { getPrediction, savePrediction } = useUserPredictions();

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const detail = await getMatchDetail(id);
    setMatch(detail?.match ?? null);
    setEvents(detail?.events ?? []);
    setLoading(false);

    const [s, p, c] = await Promise.all([
      getMatchStatistics(id).catch(() => [] as MatchStatRow[]),
      getMatchPrediction(id).catch(() => null),
      getMatchCommentary(id).catch(() => [] as CommentaryItem[]),
    ]);
    setStats(s);
    setPred(p);
    setComm(c);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    invalidateCache();
    await load();
    setRefreshing(false);
  }, [load]);

  const handleShare = () => {
    setShareModalVisible(true);
  };

  const currentPrediction = match ? getPrediction(match.id) : undefined;
  const isFinished = match?.status === 'finished';
  const scoreResult =
    currentPrediction && match
      ? calculatePredictionPoints(
          currentPrediction.homeScore,
          currentPrediction.awayScore,
          match.homeScore,
          match.awayScore,
          isFinished,
        )
      : null;

  if (loading) {
    return (
      <View style={styles.content}>
        <SkeletonBlock style={{ height: 150, borderRadius: radius.lg }} />
        <SkeletonBlock style={{ height: 16, width: '45%', marginTop: 16 }} />
        <SkeletonBlock style={{ height: 220, borderRadius: radius.lg, marginTop: 8 }} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.content}>
        <ErrorState message="Não foi possível carregar a partida." onRetry={load} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Abas */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

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
        {/* Banner do Bolão / Palpite do Usuário */}
        <Pressable
          onPress={() => setPredModalVisible(true)}
          style={styles.predictionBanner}
          accessibilityRole="button"
          accessibilityLabel="Registrar ou editar palpite"
        >
          <View style={styles.predictionBannerLeft}>
            <Ionicons name="dice-outline" size={20} color={colors.accent} />
            <View>
              <Text style={styles.predictionBannerTitle}>
                {currentPrediction ? 'Seu Palpite Registrado' : 'Bolão: Dê o seu palpite!'}
              </Text>
              <Text style={styles.predictionBannerSubtitle}>
                {currentPrediction
                  ? `${currentPrediction.homeScore} × ${currentPrediction.awayScore}${scoreResult ? ` · ${scoreResult.label}` : ' (Aguardando resultado)'}`
                  : 'Toque aqui para registrar seu placar e pontuar.'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>

        {tab === 'resumo' && (
          <>
            <MatchCard match={match} />
            <Text style={styles.sectionTitle}>Eventos da partida</Text>
            <EventsTimeline match={match} events={events} />
          </>
        )}

        {tab === 'stats' && <StatsSection match={match} stats={stats} />}

        {tab === 'palpites' && <PredictionSection match={match} pred={pred} />}

        {tab === 'h2h' && <HeadToHeadSection match={match} />}

        {tab === 'narr' && <CommentarySection items={comm} />}

        {/* Botão de Compartilhar */}
        <Pressable
          onPress={handleShare}
          style={styles.shareButton}
          accessibilityRole="button"
          accessibilityLabel="Compartilhar partida"
        >
          <Ionicons name="share-social-outline" size={18} color={colors.accent} />
          <Text style={styles.shareButtonText}>Compartilhar partida</Text>
        </Pressable>

        {/* Link para escalação externa */}
        <Pressable
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/search?q=${encodeURIComponent(
                `${match.home.name} x ${match.away.name} escalação`,
              )}`,
            )
          }
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>🔎 Ver escalações e notícias na web ↗</Text>
        </Pressable>
      </ScrollView>

      {/* Modal de Compartilhamento Social */}
      {match && (
        <MatchShareModal
          visible={shareModalVisible}
          match={match}
          onClose={() => setShareModalVisible(false)}
        />
      )}

      {/* Modal de Palpite */}
      {match && (
        <PredictionModal
          visible={predModalVisible}
          match={match}
          currentPrediction={currentPrediction}
          onSave={(h, a) => savePrediction(match.id, h, a)}
          onClose={() => setPredModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#06281F',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  shareButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  predictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  predictionBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  predictionBannerTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  predictionBannerSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  linkRow: {
    marginTop: spacing.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colors.info,
    fontSize: 13,
    fontWeight: '600',
  },
});
