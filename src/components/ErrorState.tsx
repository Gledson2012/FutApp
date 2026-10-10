import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

/** Estado de erro com botão "Tentar de novo" (retry limpa o cache) */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.emoji}>😕</Text>
      <Text style={styles.title}>Não foi possível carregar</Text>
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.buttonText}>Tentar de novo</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Indicador de loading centralizado */
export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <View style={styles.box}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.message, { marginTop: spacing.md }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emoji: { fontSize: 40 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  message: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: { color: '#06281F', fontWeight: '800', fontSize: 14 },
});
