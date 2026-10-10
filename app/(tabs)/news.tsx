import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getNews, invalidateCache, searchAll } from '../../src/services/api';
import { NewsArticle, TeamSummary } from '../../src/types';
import { colors, radius, spacing } from '../../src/theme';
import { NewsCard } from '../../src/components/NewsCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { EmptyView } from '../../src/components/Feedback';
import { SkeletonBlock } from '../../src/components/Skeleton';
import { TeamCrest } from '../../src/components/TeamCrest';

export default function NewsScreen() {
  const router = useRouter();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Busca
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedTeams, setSearchedTeams] = useState<TeamSummary[]>([]);
  const [searchedNews, setSearchedNews] = useState<NewsArticle[]>([]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const articles = await getNews(25);
    setNews(articles);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    invalidateCache();
    if (query.trim()) {
      const res = await searchAll(query);
      setSearchedTeams(res.teams);
      setSearchedNews(res.news);
    } else {
      await loadFeed();
    }
    setRefreshing(false);
  }, [loadFeed, query]);

  // Executa a busca ao digitar
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchedTeams([]);
      setSearchedNews([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchAll(q);
        setSearchedTeams(res.teams);
        setSearchedNews(res.news);
      } catch {
        setSearchedTeams([]);
        setSearchedNews([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const isSearchActive = query.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Barra de Busca */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar times, notícias e jogos..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="Limpar busca"
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Loading inicial do feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonBlock style={{ height: 200, borderRadius: radius.lg, marginBottom: spacing.md }} />
          <SkeletonBlock style={{ height: 200, borderRadius: radius.lg, marginBottom: spacing.md }} />
          <SkeletonBlock style={{ height: 200, borderRadius: radius.lg }} />
        </View>
      ) : isSearchActive ? (
        /* Resultados da Busca */
        <FlatList
          data={searchedNews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            <View>
              {searching && (
                <Text style={styles.searchingText}>Buscando por "{query}"...</Text>
              )}

              {/* Seção de Times Encontrados */}
              {searchedTeams.length > 0 && (
                <View style={styles.teamsSection}>
                  <SectionHeader
                    title={`Times encontrados (${searchedTeams.length})`}
                    subtitle="Toque para ver a ficha completa do clube"
                  />
                  <View style={styles.teamsGrid}>
                    {searchedTeams.map((team) => (
                      <Pressable
                        key={team.id}
                        onPress={() => router.push(`/team/${team.id}`)}
                        style={({ pressed }) => [
                          styles.teamCard,
                          pressed && styles.teamCardPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver time ${team.name}`}
                      >
                        <TeamCrest team={team} size={36} />
                        <View style={styles.teamInfo}>
                          <Text style={styles.teamName} numberOfLines={1}>
                            {team.name}
                          </Text>
                          <Text style={styles.teamCountry}>
                            {team.country ?? 'Brasil'}
                            {team.acronym ? ` · ${team.acronym}` : ''}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Título de Notícias Relacionadas */}
              {searchedNews.length > 0 && (
                <SectionHeader
                  title="Notícias relacionadas"
                  subtitle={`${searchedNews.length} artigo(s) encontrado(s)`}
                />
              )}
            </View>
          }
          renderItem={({ item }) => <NewsCard article={item} />}
          ListEmptyComponent={
            !searching && searchedTeams.length === 0 ? (
              <EmptyView
                icon="search-outline"
                title="Nenhum resultado"
                message={`Não encontramos resultados para "${query}".`}
              />
            ) : null
          }
        />
      ) : (
        /* Feed Principal de Notícias */
        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            <SectionHeader
              title="Últimas do Futebol"
              subtitle="Feed oficial ESPN Brasil · Atualizado em tempo real"
            />
          }
          renderItem={({ item }) => <NewsCard article={item} />}
          ListEmptyComponent={
            <EmptyView
              icon="newspaper-outline"
              title="Nenhuma notícia no momento"
              message="Puxe para atualizar o feed de notícias."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  loadingContainer: {
    padding: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  searchingText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  teamsSection: {
    marginBottom: spacing.md,
  },
  teamsGrid: {
    gap: spacing.sm,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  teamCardPressed: {
    borderColor: colors.accent,
    backgroundColor: colors.cardAlt,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  teamCountry: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
