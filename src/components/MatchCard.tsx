import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Match, Team } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatTime } from '../utils/date';
import { FavoriteStar } from './TeamCrest';

interface Props {
  match: Match;
  onPress?: () => void;
  style?: ViewStyle;
  /** mostra a ★ de favoritar ao lado dos times (padrão: true) */
  favoritable?: boolean;
}

function PulsingDot() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.25, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return <Animated.View style={[styles.liveDot, { opacity: anim }]} />;
}

/** Escudo: logo real da API (Sofascore) ou fallback com sigla colorida */
function Crest({ team, size = 32 }: { team: Team; size?: number }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = !!team.logoUrl && !logoFailed;

  return (
    <View
      style={[
        styles.crest,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: team.color ?? '#475569',
        },
      ]}
    >
      {showLogo ? (
        <Image
          source={{ uri: team.logoUrl as string }}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <Text style={[styles.crestText, { fontSize: size * 0.32 }]}>
          {team.shortName}
        </Text>
      )}
    </View>
  );
}

/** Rótulo do status — fases da BrasaFut API (FIRST_HALF, SECOND_HALF…) */
const PHASE_LABEL: Record<string, string> = {
  FIRST_HALF: '1º TEMPO',
  SECOND_HALF: '2º TEMPO',
  EXTRA_TIME: 'PRORROGAÇÃO',
  PENALTIES: 'PÊNALTIS',
};

function StatusBadge({ match }: { match: Match }) {
  if (match.status === 'live') {
    const label = match.apiStatus
      ? `${PHASE_LABEL[match.apiStatus] ?? 'AO VIVO'}`
      : `${match.minute ?? 0}'`;
    return (
      <View style={[styles.badge, styles.badgeLive]}>
        <PulsingDot />
        <Text style={styles.badgeLiveText}>{label} AO VIVO</Text>
      </View>
    );
  }
  if (match.status === 'half_time') {
    return (
      <View style={[styles.badge, styles.badgeLive]}>
        <PulsingDot />
        <Text style={styles.badgeLiveText}>INTERVALO</Text>
      </View>
    );
  }
  if (match.status === 'finished') {
    return (
      <View style={[styles.badge, styles.badgeFinished]}>
        <Text style={styles.badgeFinishedText}>ENCERRADO</Text>
      </View>
    );
  }
  if (match.status === 'postponed' || match.status === 'cancelled') {
    return (
      <View style={[styles.badge, styles.badgeWarn]}>
        <Text style={styles.badgeWarnText}>
          {match.status === 'postponed' ? 'ADIADO' : 'CANCELADO'}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeScheduled]}>
      <Ionicons name="time-outline" size={12} color={colors.info} />
      <Text style={styles.badgeScheduledText}>{formatTime(match.startTime)}</Text>
    </View>
  );
}

function TeamRow({
  team,
  score,
  isLive,
  favoritable = true,
  onOpenTeam,
}: {
  team: Team;
  score?: number;
  isLive: boolean;
  favoritable?: boolean;
  onOpenTeam?: (id: string) => void;
}) {
  const router = useRouter();
  const handleOpenTeam = (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    if (onOpenTeam) onOpenTeam(team.id);
    else router.push(`/team/${team.id}`);
  };

  return (
    <View style={styles.teamRow}>
      <Pressable
        style={styles.teamPressable}
        onPress={handleOpenTeam}
        accessibilityRole="button"
        accessibilityLabel={`Ver time ${team.name}`}
        hitSlop={4}
      >
        <Crest team={team} />
        <Text style={styles.teamName} numberOfLines={1}>
          {team.name}
        </Text>
      </Pressable>
      {favoritable && (
        <FavoriteStar
          id={team.id}
          name={team.name}
          shortName={team.shortName}
          logoUrl={team.logoUrl}
          small
        />
      )}
      <Text style={[styles.score, isLive && styles.scoreLive]}>
        {score !== undefined ? score : '-'}
      </Text>
    </View>
  );
}

/** Card de jogo: times, placar/horário, status e competição */
export function MatchCard({ match, onPress, style }: Props) {
  const isLive = match.status === 'live' || match.status === 'half_time';
  const isFinished = match.status === 'finished';
  const showScore = isLive || isFinished;
  const metaLine = [match.competition, match.round]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
      accessible
      accessibilityRole={onPress ? undefined : 'summary'}
      accessibilityLabel={`${match.home.name} contra ${match.away.name}`}
    >
      <View style={styles.header}>
        <Text style={styles.competition} numberOfLines={1}>
          {metaLine}
        </Text>
        <StatusBadge match={match} />
      </View>

      <View style={styles.divider} />

      <TeamRow
        team={match.home}
        score={showScore ? match.homeScore : undefined}
        isLive={isLive}
      />
      <TeamRow
        team={match.away}
        score={showScore ? match.awayScore : undefined}
        isLive={isLive}
      />

      {!!match.venue && (
        <View style={styles.venueRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.venue}>{match.venue}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
    borderColor: colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  competition: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  teamPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  crest: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  teamName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  score: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'right',
  },
  scoreLive: {
    color: colors.live,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  venue: {
    color: colors.textMuted,
    fontSize: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeLive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.live,
  },
  badgeLiveText: {
    color: colors.live,
    fontSize: 11,
    fontWeight: '800',
  },
  badgeFinished: {
    backgroundColor: colors.cardAlt,
  },
  badgeFinishedText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeScheduled: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  badgeScheduledText: {
    color: colors.info,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  badgeWarnText: {
    color: colors.warn,
    fontSize: 11,
    fontWeight: '700',
  },
});
