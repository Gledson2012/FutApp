import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

export interface CompetitionOption {
  id: string;
  name: string;
  shortName: string;
  icon?: string;
}

export const POPULAR_COMPETITIONS: CompetitionOption[] = [
  { id: 'ALL', name: 'Todas as Competições', shortName: 'Todas', icon: '🏆' },
  { id: 'BRA', name: 'Brasileirão Série A', shortName: 'Brasileirão', icon: '🇧🇷' },
  { id: 'CDB', name: 'Copa do Brasil', shortName: 'Copa BR', icon: '🏆' },
  { id: 'LIB', name: 'Copa Libertadores', shortName: 'Libertadores', icon: '⭐' },
  { id: 'SUD', name: 'Copa Sul-Americana', shortName: 'Sul-Americana', icon: '🌎' },
  { id: 'EST', name: 'Campeonatos Estaduais', shortName: 'Estaduais', icon: '⚽' },
];

interface CompetitionFilterProps {
  selectedId: string;
  onSelect: (id: string) => void;
  options?: CompetitionOption[];
}

export function CompetitionFilter({
  selectedId,
  onSelect,
  options = POPULAR_COMPETITIONS,
}: CompetitionFilterProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((comp) => {
          const active = selectedId === comp.id;
          return (
            <Pressable
              key={comp.id}
              onPress={() => onSelect(comp.id)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por ${comp.name}`}
            >
              {!!comp.icon && <Text style={styles.chipIcon}>{comp.icon}</Text>}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {comp.shortName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipIcon: {
    fontSize: 13,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#06281F',
  },
});
