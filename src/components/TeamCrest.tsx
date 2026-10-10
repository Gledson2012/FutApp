import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Team } from '../types';
import { colors } from '../theme';
import { useFavorites } from '../hooks/useFavorites';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

/** Escudo do time: logo real, sigla colorida de fallback */
export function TeamCrest({ team, size = 30 }: { team: Team; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (team.logoUrl && !failed) {
    return (
      <Image
        source={{ uri: team.logoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setFailed(true)}
        accessibilityLabel={`Escudo ${team.name}`}
      />
    );
  }
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: team.color },
      ]}
      accessibilityLabel={team.name}
    >
      <Text style={[styles.fallbackText, { fontSize: size * 0.32 }]}>
        {team.shortName?.slice(0, 3) ?? initialsOf(team.name)}
      </Text>
    </View>
  );
}

/** Estrela de favorito (persiste no AsyncStorage) */
export function FavoriteStar({
  id,
  name,
  shortName,
  logoUrl,
  small = false,
}: {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
  small?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(id);
  return (
    <Pressable
      onPress={(e) => {
        // Evita que o toque "vaze" para o card do jogo (web + mobile)
        e.stopPropagation?.();
        toggleFavorite({ id, name, shortName, logoUrl: logoUrl ?? null });
      }}
      accessibilityLabel={fav ? `Remover ${name} dos favoritos` : `Favoritar ${name}`}
      hitSlop={8}
    >
      <Text style={[styles.star, small && styles.starSmall, fav && styles.starActive]}>
        {fav ? '★' : '☆'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: '#fff', fontWeight: '800' },
  star: { fontSize: 22, color: colors.textMuted },
  starSmall: { fontSize: 16 },
  starActive: { color: '#FBBF24' },
});
