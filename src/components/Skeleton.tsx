import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

/**
 * Bloco "shimmer" para skeletons de carregamento.
 * Usa animação de opacidade (nativa, barata).
 */
export function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

/** Skeleton de um card de jogo (3 linhas) */
export function MatchCardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Carregando jogo">
      <SkeletonBlock style={{ width: '40%', height: 12 }} />
      <SkeletonBlock style={{ width: '85%', height: 18 }} />
      <SkeletonBlock style={{ width: '70%', height: 18 }} />
    </View>
  );
}

/** Skeleton da tabela (cabeçalho + 8 linhas) */
export function TableSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Carregando tabela">
      <SkeletonBlock style={{ width: '50%', height: 14 }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonBlock key={i} style={{ width: '100%', height: 20 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.border, borderRadius: radius.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
});
