import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match, UserPrediction } from '../../types';
import { colors, radius, spacing } from '../../theme';
import { TeamCrest } from '../TeamCrest';

interface PredictionModalProps {
  visible: boolean;
  match: Match;
  currentPrediction?: UserPrediction;
  onSave: (homeScore: number, awayScore: number) => void;
  onClose: () => void;
}

export function PredictionModal({
  visible,
  match,
  currentPrediction,
  onSave,
  onClose,
}: PredictionModalProps) {
  const [homeScore, setHomeScore] = useState(
    currentPrediction?.homeScore ?? 1,
  );
  const [awayScore, setAwayScore] = useState(
    currentPrediction?.awayScore ?? 0,
  );

  const handleSave = () => {
    onSave(homeScore, awayScore);
    onClose();
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="dice-outline" size={22} color={colors.accent} />
              <Text style={styles.title}>Registrar Palpite</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Stepper de placar */}
          <View style={styles.matchCard}>
            <View style={styles.teamCol}>
              <TeamCrest team={match.home} size={40} />
              <Text style={styles.teamName} numberOfLines={1}>
                {match.home.shortName || match.home.name}
              </Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => setHomeScore((v) => Math.max(0, v - 1))}
                  style={styles.stepBtn}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </Pressable>
                <Text style={styles.scoreText}>{homeScore}</Text>
                <Pressable
                  onPress={() => setHomeScore((v) => v + 1)}
                  style={styles.stepBtn}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.vsText}>×</Text>

            <View style={styles.teamCol}>
              <TeamCrest team={match.away} size={40} />
              <Text style={styles.teamName} numberOfLines={1}>
                {match.away.shortName || match.away.name}
              </Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => setAwayScore((v) => Math.max(0, v - 1))}
                  style={styles.stepBtn}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </Pressable>
                <Text style={styles.scoreText}>{awayScore}</Text>
                <Pressable
                  onPress={() => setAwayScore((v) => v + 1)}
                  style={styles.stepBtn}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Atalhos rápidos */}
          <View style={styles.quickScoresRow}>
            {[
              [1, 0],
              [2, 0],
              [2, 1],
              [1, 1],
              [0, 1],
              [1, 2],
            ].map(([h, a]) => (
              <Pressable
                key={`${h}-${a}`}
                onPress={() => {
                  setHomeScore(h);
                  setAwayScore(a);
                }}
                style={[
                  styles.quickScoreBtn,
                  homeScore === h && awayScore === a && styles.quickScoreBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.quickScoreText,
                    homeScore === h && awayScore === a && styles.quickScoreTextActive,
                  ]}
                >
                  {h}x{a}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Sistema de Pontos */}
          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>Regras de Pontuação:</Text>
            <Text style={styles.ruleItem}>🎯 Placar exato: +10 pontos</Text>
            <Text style={styles.ruleItem}>👏 Vencedor e saldo de gols: +7 pontos</Text>
            <Text style={styles.ruleItem}>⚽ Acertou o vencedor ou empate: +5 pontos</Text>
          </View>

          {/* Botão de confirmação */}
          <Pressable onPress={handleSave} style={styles.saveBtn}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#06281F" />
            <Text style={styles.saveBtnText}>Confirmar Palpite ({homeScore} × {awayScore})</Text>
          </Pressable>
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
    maxWidth: 380,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  teamCol: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 100,
  },
  teamName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  stepBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  scoreText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 12,
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '800',
  },
  quickScoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  quickScoreBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  quickScoreBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  quickScoreText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  quickScoreTextActive: {
    color: '#06281F',
  },
  rulesCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  rulesTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  ruleItem: {
    color: colors.textMuted,
    fontSize: 11,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  saveBtnText: {
    color: '#06281F',
    fontSize: 14,
    fontWeight: '800',
  },
});
