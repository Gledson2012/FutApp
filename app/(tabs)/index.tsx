import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
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
import { EmptyView } from '../../src/components/Feedback';
import { SkeletonBlock } from '../../src/components/Skeleton';
import { TeamCrest } from '../../src/components/TeamCrest';
import { getLiveMatches, getTodayMatches, invalidateCache } from '../../src/services/api';
import { Match } from '../../src/types';
import { colors, radius, spacing } from '../../src/theme';
import { formatLongDate } from '../../src/utils/date';
import { useFavorites } from '../../src/hooks/useFavorites';

/** Auto-refresh dos jogos ao vivo (30s) */
const AUTO_REFRESH_MS = 30_000;

/**
 * Aba principal — jogos de HOJE:
 *  - Seção de favoritos (se houver times favoritados);
 *  - Seção vermelha: /matches/live (partidas em andamento);
 *  - Resto do dia: /matches?date=… (encerrados e a seguir).
 */
export default function TodayScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const [today, setToday] = useState<Match[]>([]);
  const [live, setLive] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [todayData, liveData] = await Promise.all([
      getTodayMatches(),
      getLiveMatches(),
    ]);
    setToday(todayData);
    setLive(liveData);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    invalidateCache();
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonBlock style={{ height: 120, borderRadius: radius.lg, marginBottom: spacing.md }} />
        <SkeletonBlock style={{ height: 120, borderRadius: radius.lg, marginBottom: spacing.md }} />
        <SkeletonBlock style={{ height: 120, borderRadius: radius.lg }} />
      </View>
    );
  }

  const liveIds = new Set(live.map((m) => m.id));
  const finished = today.filter(
    (m) => m.status === 'finished' && !liveIds.has(m.id),
  );
  const scheduled = today.filter(
    (m) => m.status !== 'finished' && m.status !== 'live' && !liveIds.has(m.id),
  );

  // Jogos dos times favoritos hoje
  const favIds = new Set(favorites.map((f) => f.id));
  const favMatches = today.filter(
    (m) => favIds.has(m.home.id) || favIds.has(m.away.id),
  );

  const openMatch = (id: string) => router.push(`/match/${id}`);

  return (
    <FlatList
      data={scheduled}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
      ListHeaderComponent={
        <View>
          {/* Seção de Times Favoritos */}
          {favorites.length > 0 && (
            <View style={styles.favoritesBlock}>
              <SectionHeader
                title="⭐ Meus Times"
                subtitle={`${favorites.length} clube(s) acompanhado(s)`}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favRow}
              >
                {favorites.map((team) => (
                  <Pressable
                    key={team.id}
                    onPress={() => router.push(`/team/${team.id}`)}
                    style={({ pressed }) => [
                      styles.favChip,
                      pressed && styles.favChipPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver perfil do ${team.name}`}
                  >
                    <TeamCrest team={team} size={28} />
                    <Text style={styles.favChipText} numberOfLines={1}>
                      {team.shortName || team.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Jogos de favoritos hoje */}
              {favMatches.length > 0 && (
                <View style={styles.favMatchesSection}>
                  <Text style={styles.favMatchesTitle}>Jogando hoje:</Text>
                  {favMatches.map((m) => (
                    <MatchCard key={`fav-${m.id}`} match={m} onPress={() => openMatch(m.id)} />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Ao vivo agora */}
          <SectionHeader
            title={`${live.length > 0 ? '🔴 ' : ''}Ao vivo agora`}
            subtitle={formatLongDate(new Date())}
            accent={live.length > 0}
          />
          {live.length === 0 ? (
            <EmptyView
              icon="football-outline"
              title="Nenhum jogo ao vivo"
              message="No momento não há partidas em andamento."
            />
          ) : (
            live.map((m) => (
              <MatchCard key={m.id} match={m} onPress={() => openMatch(m.id)} />
            ))
          )}

          {/* Encerrados hoje */}
          {finished.length > 0 && (
            <>
              <SectionHeader title="Encerrados hoje" />
              {finished.map((m) => (
                <MatchCard key={m.id} match={m} onPress={() => openMatch(m.id)} />
              ))}
            </>
          )}

          {/* A seguir hoje */}
          <SectionHeader title="A seguir hoje" />
        </View>
      }
      renderItem={({ item }) => (
        <MatchCard match={item} onPress={() => openMatch(item.id)} />
      )}
      ListEmptyComponent={
        <EmptyView
          icon="time-outline"
          title="Sem jogos restantes hoje"
          message="Volte amanhã para novas partidas!"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    padding: spacing.lg,
  },
  favoritesBlock: {
    marginBottom: spacing.md,
  },
  favRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  favChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  favChipPressed: {
    borderColor: colors.accent,
    backgroundColor: colors.cardAlt,
  },
  favChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  favMatchesSection: {
    marginTop: spacing.md,
  },
  favMatchesTitle: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
});
