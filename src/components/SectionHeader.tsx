import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  accent?: boolean;
}

/** Cabeçalho de seção: "🔴 Ao vivo", "Resultados de ontem" etc. */
export function SectionHeader({ title, subtitle, accent }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, accent && styles.titleAccent]}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  titleAccent: {
    color: colors.live,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});
