import { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
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

type Tab = 'resumo' | 'stats' | 'palpites' | 'narr';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'stats', label: 'Estatísticas' },
  { id: 'palpites', label: 'Palpites' },
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

  const handleShare = async () => {
    if (!match) return;
    const scoreText =
      match.homeScore !== undefined && match.awayScore !== undefined
        ? `${match.homeScore} × ${match.awayScore}`
        : 'vs';
    const statusText =
      match.status === 'live'
        ? '🔴 AO VIVO'
        : match.status === 'finished'
          ? 'Finalizado'
          : 'Acompanhe no FutApp';

    const message = `⚽ ${match.home.name} ${scoreText} ${match.away.name} (${statusText})\n${match.competition ?? 'Futebol'} · Veja no FutApp!`;

    try {
      await Share.share({ message });
    } catch {
      // cancelado ou não suportado
    }
  };

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
        {tab === 'resumo' && (
          <>
            <MatchCard match={match} />
            <Text style={styles.sectionTitle}>Eventos da partida</Text>
            <EventsTimeline match={match} events={events} />
          </>
        )}

        {tab === 'stats' && <StatsSection match={match} stats={stats} />}

        {tab === 'palpites' && <PredictionSection match={match} pred={pred} />}

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
