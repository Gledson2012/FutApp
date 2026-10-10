import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { radius, spacing } from '../../src/theme';

function ThemeToggleButton() {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      style={[styles.themeBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={18}
        color={isDark ? '#FACC15' : colors.text}
      />
    </Pressable>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => <ThemeToggleButton />,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ao Vivo',
          headerTitle: 'Jogos de hoje',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Resultados',
          headerTitle: 'Resultados',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="podium" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          title: 'Classificação',
          headerTitle: 'Classificação',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendário',
          headerTitle: 'Calendário',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'Notícias',
          headerTitle: 'Notícias & Busca',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  themeBtn: {
    marginRight: spacing.lg,
    padding: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
