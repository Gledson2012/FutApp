export interface ThemeColors {
  bg: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  surface: string;
  accent: string;
  live: string;
  warn: string;
  danger: string;
  info: string;
  win: string;
  draw: string;
  loss: string;
}

export const darkColors: ThemeColors = {
  bg: '#0B0F14',
  card: '#151A21',
  cardAlt: '#1B232D',
  border: '#242D39',
  text: '#F2F5F8',
  textMuted: '#8A94A6',
  textSecondary: '#8A94A6',
  surface: '#151A21',
  accent: '#22C55E',
  live: '#EF4444',
  warn: '#F59E0B',
  danger: '#EF4444',
  info: '#38BDF8',
  win: '#22C55E',
  draw: '#94A3B8',
  loss: '#F87171',
};

export const lightColors: ThemeColors = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textSecondary: '#64748B',
  surface: '#FFFFFF',
  accent: '#16A34A',
  live: '#DC2626',
  warn: '#D97706',
  danger: '#DC2626',
  info: '#0284C7',
  win: '#16A34A',
  draw: '#64748B',
  loss: '#EF4444',
};

export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
