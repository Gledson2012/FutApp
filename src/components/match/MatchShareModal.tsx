import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match } from '../../types';
import { colors, radius, spacing } from '../../theme';
import { TeamCrest } from '../TeamCrest';
import { formatDayShort, formatTime } from '../../utils/date';

interface MatchShareModalProps {
  visible: boolean;
  match: Match;
  onClose: () => void;
}

export function MatchShareModal({
  visible,
  match,
  onClose,
}: MatchShareModalProps) {
  const [copied, setCopied] = useState(false);

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const showScore =
    (isLive || isFinished) &&
    match.homeScore !== undefined &&
    match.awayScore !== undefined;

  const scoreText = showScore
    ? `${match.homeScore} × ${match.awayScore}`
    : 'vs';

  const statusLabel = isLive
    ? '🔴 AO VIVO'
    : isFinished
      ? 'Finalizado'
      : `${formatDayShort(new Date(match.startTime))} · ${formatTime(match.startTime)}`;

  const shareText = `⚽ ${match.home.name} ${scoreText} ${match.away.name} (${statusLabel})\n🏆 ${match.competition ?? 'Futebol'}${match.venue ? ` · 📍 ${match.venue}` : ''}\n\n📲 Acompanhe tudo pelo FutApp!`;

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: shareText,
        title: `${match.home.name} x ${match.away.name} - FutApp`,
      });
    } catch {}
  };

  const handleCopy = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        handleNativeShare();
      }
    } else {
      handleNativeShare();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header do modal */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="share-social" size={20} color={colors.accent} />
              <Text style={styles.modalTitle}>Compartilhar Partida</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Card Visual Estilizado (Social / Stories Card) */}
          <View style={styles.visualCard}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>⚽ FutApp</Text>
              <View style={styles.badgeStatus}>
                <Text style={styles.badgeStatusText}>{statusLabel}</Text>
              </View>
            </View>

            <Text style={styles.compText} numberOfLines={1}>
              {[match.competition, match.round].filter(Boolean).join(' · ')}
            </Text>

            {/* Placar & Escudos */}
            <View style={styles.scoreRow}>
              <View style={styles.teamSide}>
                <TeamCrest team={match.home} size={48} />
                <Text style={styles.teamName} numberOfLines={2}>
                  {match.home.name}
                </Text>
              </View>

              <View style={styles.centerScore}>
                {showScore ? (
                  <Text style={styles.scoreNumber}>
                    {match.homeScore} × {match.awayScore}
                  </Text>
                ) : (
                  <Text style={styles.vsNumber}>VS</Text>
                )}
                {!!match.venue && (
                  <Text style={styles.venueText} numberOfLines={1}>
                    📍 {match.venue}
                  </Text>
                )}
              </View>

              <View style={styles.teamSide}>
                <TeamCrest team={match.away} size={48} />
                <Text style={styles.teamName} numberOfLines={2}>
                  {match.away.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleNativeShare}
              style={[styles.actionBtn, styles.actionPrimary]}
            >
              <Ionicons name="share-social-outline" size={18} color="#06281F" />
              <Text style={styles.actionPrimaryText}>Compartilhar Agora</Text>
            </Pressable>

            <Pressable
              onPress={handleCopy}
              style={[styles.actionBtn, styles.actionSecondary]}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color={copied ? colors.win : colors.text}
              />
              <Text
                style={[
                  styles.actionSecondaryText,
                  copied && { color: colors.win },
                ]}
              >
                {copied ? 'Texto Copiado!' : 'Copiar Texto'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  visualCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  brandText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badgeStatus: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeStatusText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  compText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs,
  },
  teamSide: {
    alignItems: 'center',
    width: 90,
    gap: spacing.xs,
  },
  teamName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  centerScore: {
    alignItems: 'center',
    flex: 1,
  },
  scoreNumber: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },
  vsNumber: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '800',
  },
  venueText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  actionPrimary: {
    backgroundColor: colors.accent,
  },
  actionPrimaryText: {
    color: '#06281F',
    fontSize: 14,
    fontWeight: '800',
  },
  actionSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionSecondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
