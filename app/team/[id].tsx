import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getTeamDetail,
  getTeamFixtures,
  getTeamTrophies,
  invalidateCache,
} from '../../src/services/api';
import {
  TeamDetail,
  TeamFixtureEntry,
  TeamFixtures,
  TeamFormLetter,
  TeamSummary,
  TeamTrophies,
  TrophyItem,
} from '../../src/types';
import { colors, radius, spacing } from '../../src/theme';
import { formatDayShort, formatTime } from '../../src/utils/date';
import { FavoriteStar, TeamCrest } from '../../src/components/TeamCrest';
import { ErrorState } from '../../src/components/ErrorState';
import { SkeletonBlock } from '../../src/components/Skeleton';
import { EmptyView } from '../../src/components/Feedback';
import { SectionHeader } from '../../src/components/SectionHeader';

function TrophyCard({ item }: { item: TrophyItem }) {
  return (
    <View style={styles.trophyCard}>
      <View style={styles.trophyCardHeader}>
        <View style={styles.trophyIconContainer}>
          <Text style={styles.trophyIcon}>🏆</Text>
        </View>
        <View style={styles.trophyInfo}>
          <Text style={styles.trophyName}>{item.name}</Text>
          {!!item.lastYear && (
            <Text style={styles.trophyLastYear}>
              Última conquista em {item.lastYear}
            </Text>
          )}
        </View>
        <View style={styles.trophyCountBadge}>
          <Text style={styles.trophyCountText}>{item.count}x</Text>
        </View>
      </View>

      {item.years && item.years.length > 0 && (
        <View style={styles.yearsRow}>
          {item.years.map((year, idx) => (
            <View key={`${year}-${idx}`} style={styles.yearPill}>
              <Text style={styles.yearText}>{year}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function TrophySection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: TrophyItem[];
}) {
  if (!items || items.length === 0) return null;
  const totalCount = items.reduce((acc, curr) => acc + (curr.count || 1), 0);

  return (
    <View style={styles.trophySection}>
      <View style={styles.trophySectionHeader}>
        <Text style={styles.trophySectionTitle}>
          {icon} {title}
        </Text>
        <Text style={styles.trophySectionTotal}>
          {totalCount} {totalCount === 1 ? 'título' : 'títulos'}
        </Text>
      </View>
      {items.map((trophy, idx) => (
        <TrophyCard key={`${trophy.name}-${idx}`} item={trophy} />
      ))}
    </View>
  );
}

function FormBadge({ letter }: { letter: TeamFormLetter }) {
  const map: Record<TeamFormLetter, { label: string; bg: string }> = {
    W: { label: 'V', bg: colors.win },
    D: { label: 'E', bg: colors.draw },
    L: { label: 'D', bg: colors.loss },
  };
  const item = map[letter] ?? { label: letter, bg: colors.cardAlt };

  return (
    <View style={[styles.formBadge, { backgroundColor: item.bg }]}>
      <Text style={styles.formBadgeText}>{item.label}</Text>
    </View>
  );
}

function FixtureCard({
  fixture,
  onPress,
}: {
  fixture: TeamFixtureEntry;
  onPress: () => void;
}) {
  const isFinished = fixture.status === 'FINISHED';
  const showScore =
    isFinished && fixture.homeScore !== undefined && fixture.awayScore !== undefined;

  const homeScore = fixture.isHome ? fixture.homeScore : fixture.awayScore;
  const awayScore = fixture.isHome ? fixture.awayScore : fixture.homeScore;

  const kickoff = new Date(fixture.kickoffTime);
  const dateLabel = formatDayShort(kickoff);
  const timeLabel = formatTime(fixture.kickoffTime);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fixtureCard, pressed && styles.fixtureCardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Jogo contra ${fixture.opponent.name}`}
    >
      <View style={styles.fixtureHeader}>
        <Text style={styles.fixtureMeta} numberOfLines={1}>
          {[fixture.competition, fixture.round].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.fixtureDate}>
          {dateLabel} · {timeLabel}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.fixtureBody}>
        <View style={styles.fixtureTeam}>
          <Text style={styles.fixtureHomeTag}>
            {fixture.isHome ? 'MANDANTE' : 'VISITANTE'}
          </Text>
          <View style={styles.opponentRow}>
            <Text style={styles.vsText}>vs</Text>
            <TeamCrest team={fixture.opponent} size={24} />
            <Text style={styles.opponentName} numberOfLines={1}>
              {fixture.opponent.name}
            </Text>
          </View>
        </View>

        <View style={styles.fixtureScoreContainer}>
          {showScore ? (
            <Text style={styles.fixtureScore}>
              {homeScore} × {awayScore}
            </Text>
          ) : (
            <View style={styles.fixtureBadgeScheduled}>
              <Ionicons name="time-outline" size={12} color={colors.info} />
              <Text style={styles.fixtureBadgeScheduledText}>{timeLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [fixtures, setFixtures] = useState<TeamFixtures | null>(null);
  const [trophies, setTrophies] = useState<TeamTrophies | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'next' | 'past' | 'trophies'>('next');

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const [detailData, fixturesData, trophiesData] = await Promise.all([
      getTeamDetail(id),
      getTeamFixtures(id),
      getTeamTrophies(id),
    ]);
    setTeam(detailData);
    setFixtures(fixturesData);
    setTrophies(trophiesData);
    setLoading(false);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingHeader}>
          <SkeletonBlock style={{ width: 80, height: 80, borderRadius: 40 }} />
          <SkeletonBlock style={{ width: '60%', height: 24, marginTop: 16 }} />
          <SkeletonBlock style={{ width: '40%', height: 16, marginTop: 8 }} />
        </View>
        <View style={{ padding: spacing.lg }}>
          <SkeletonBlock style={{ height: 100, borderRadius: radius.lg }} />
          <SkeletonBlock style={{ height: 100, borderRadius: radius.lg, marginTop: 16 }} />
        </View>
      </View>
    );
  }

  const teamData: TeamSummary | null = team ?? fixtures?.team ?? null;

  if (!teamData) {
    return (
      <View style={styles.container}>
        <ErrorState
          message="Não encontramos as informações deste clube."
          onRetry={load}
        />
      </View>
    );
  }

  const pastList = fixtures?.past ?? [];
  const nextList = fixtures?.next ?? [];
  const formList = fixtures?.form ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header do Time */}
      <View style={styles.headerCard}>
        <View style={styles.crestWrapper}>
          <TeamCrest team={teamData} size={72} />
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.teamName}>{teamData.name}</Text>
          <FavoriteStar
            id={teamData.id}
            name={teamData.name}
            shortName={teamData.shortName}
            logoUrl={teamData.logoUrl}
          />
        </View>

        <View style={styles.metaRow}>
          {!!teamData.country && (
            <Text style={styles.metaBadge}>{teamData.country}</Text>
          )}
          {!!team?.foundedYear && (
            <Text style={styles.metaBadge}>Fundado em {team.foundedYear}</Text>
          )}
          {!!teamData.acronym && (
            <Text style={styles.metaBadge}>{teamData.acronym}</Text>
          )}
        </View>

        {!!team?.venue && (
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.venueText}>
              {team.venue.name}
              {team.venue.city ? ` · ${team.venue.city}` : ''}
              {team.venue.capacity
                ? ` (${team.venue.capacity.toLocaleString('pt-BR')} pessoas)`
                : ''}
            </Text>
          </View>
        )}

        {/* Forma recente */}
        {formList.length > 0 && (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Forma recente:</Text>
            <View style={styles.formList}>
              {formList.map((l, i) => (
                <FormBadge key={i} letter={l} />
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Seletor Próximos / Resultados / Sala de Troféus */}
      <View style={styles.tabSelector}>
        <Pressable
          onPress={() => setActiveTab('next')}
          style={[styles.tabButton, activeTab === 'next' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'next' }}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'next' && styles.tabButtonTextActive]}
          >
            Próximos ({nextList.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('past')}
          style={[styles.tabButton, activeTab === 'past' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'past' }}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'past' && styles.tabButtonTextActive]}
          >
            Resultados ({pastList.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('trophies')}
          style={[styles.tabButton, activeTab === 'trophies' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'trophies' }}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'trophies' && styles.tabButtonTextActive]}
          >
            Troféus 🏆
          </Text>
        </Pressable>
      </View>

      {/* Conteúdo da Aba */}
      {activeTab === 'next' &&
        (nextList.length === 0 ? (
          <EmptyView
            icon="calendar-outline"
            title="Nenhum próximo jogo"
            message="Não há partidas agendadas no momento."
          />
        ) : (
          nextList.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              onPress={() => router.push(`/match/${fixture.id}`)}
            />
          ))
        ))}

      {activeTab === 'past' &&
        (pastList.length === 0 ? (
          <EmptyView
            icon="podium-outline"
            title="Nenhum resultado recente"
            message="Os resultados anteriores aparecerão aqui."
          />
        ) : (
          pastList.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              onPress={() => router.push(`/match/${fixture.id}`)}
            />
          ))
        ))}

      {activeTab === 'trophies' && (
        <View style={styles.trophiesContainer}>
          {trophies ? (
            <>
              {/* Banner de total de troféus */}
              <View style={styles.trophiesHero}>
                <View style={styles.trophiesHeroBadge}>
                  <Ionicons name="trophy" size={24} color={colors.accent} />
                  <Text style={styles.trophiesHeroCount}>
                    {trophies.totalCount}
                  </Text>
                </View>
                <View style={styles.trophiesHeroTextContainer}>
                  <Text style={styles.trophiesHeroTitle}>Galeria de Conquistas</Text>
                  <Text style={styles.trophiesHeroSubtitle}>
                    {trophies.totalCount}{' '}
                    {trophies.totalCount === 1
                      ? 'título oficial registrado'
                      : 'títulos oficiais registrados'}
                  </Text>
                </View>
              </View>

              {/* Categorias */}
              <TrophySection
                title="Títulos Internacionais"
                icon="🌎"
                items={trophies.international}
              />
              <TrophySection
                title="Títulos Nacionais"
                icon="🇧🇷"
                items={trophies.national}
              />
              <TrophySection
                title="Títulos Estaduais e Regionais"
                icon="🏛️"
                items={trophies.state}
              />

              {trophies.international.length === 0 &&
                trophies.national.length === 0 &&
                trophies.state.length === 0 && (
                  <EmptyView
                    icon="trophy-outline"
                    title="Nenhum troféu catalogado"
                    message="Os dados da sala de troféus deste clube ainda estão sendo compilados."
                  />
                )}
            </>
          ) : (
            <EmptyView
              icon="trophy-outline"
              title="Sem dados de troféus"
              message="Não foi possível obter a galeria de troféus deste clube."
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  loadingHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  crestWrapper: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  teamName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  metaBadge: {
    color: colors.textMuted,
    fontSize: 12,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
  },
  venueText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  formSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
    justifyContent: 'center',
  },
  formTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  formList: {
    flexDirection: 'row',
    gap: 4,
  },
  formBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  tabSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#06281F',
  },
  fixtureCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fixtureCardPressed: {
    opacity: 0.85,
    borderColor: colors.accent,
  },
  fixtureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fixtureMeta: {
    color: colors.textMuted,
    fontSize: 11,
    flex: 1,
  },
  fixtureDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  fixtureBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fixtureTeam: {
    flex: 1,
    gap: 4,
  },
  fixtureHomeTag: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  opponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  opponentName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  fixtureScoreContainer: {
    paddingLeft: spacing.md,
  },
  fixtureScore: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  fixtureBadgeScheduled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  fixtureBadgeScheduledText: {
    color: colors.info,
    fontSize: 11,
    fontWeight: '700',
  },
  trophiesContainer: {
    gap: spacing.md,
  },
  trophiesHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  trophiesHeroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophiesHeroCount: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
    marginTop: -2,
  },
  trophiesHeroTextContainer: {
    flex: 1,
  },
  trophiesHeroTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  trophiesHeroSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  trophiesSection: {
    marginBottom: spacing.sm,
  },
  trophiesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  trophiesSectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trophiesSectionTotal: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  trophySection: {
    marginBottom: spacing.md,
  },
  trophySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  trophySectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trophySectionTotal: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  trophyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  trophyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trophyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyIcon: {
    fontSize: 18,
  },
  trophyInfo: {
    flex: 1,
  },
  trophyName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  trophyLastYear: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  trophyCountBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    minWidth: 32,
    alignItems: 'center',
  },
  trophyCountText: {
    color: '#06281F',
    fontSize: 12,
    fontWeight: '800',
  },
  yearsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  yearPill: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  yearText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
