// 위시맵 디자인 시스템 (토스 스타일)

export const colors = {
  // Primary
  primary: '#FF6B35',
  primaryLight: '#FF8F66',
  primaryDark: '#E55A2B',
  primaryBg: '#FFF5F0',
  primaryPressed: '#D94E20',

  // Gray Scale
  gray950: '#191F28',
  gray900: '#333D4B',
  gray800: '#4E5968',
  gray700: '#6B7684',
  gray600: '#8B95A1',
  gray500: '#A0A8B4',
  gray400: '#B0B8C1',
  gray300: '#D1D6DB',
  gray200: '#E5E8EB',
  gray100: '#F2F4F6',
  gray50: '#F9FAFB',

  // Semantic
  success: '#4CAF50',
  successBg: '#F0FFF5',
  error: '#FF4444',
  errorBg: '#FFF0F0',
  warning: '#FF9800',
  warningBg: '#FFF8F0',
  info: '#2196F3',
  infoBg: '#F0F5FF',

  // Background
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#F9FAFB',

  // Text
  textPrimary: '#191F28',
  textSecondary: '#6B7684',
  textTertiary: '#A0A8B4',
  textDisabled: '#D1D6DB',
  textWhite: '#FFFFFF',

  // Border
  border: '#E5E8EB',
  borderLight: '#F2F4F6',
  divider: '#F2F4F6',

  // Overlay
  dimmed: 'rgba(0, 0, 0, 0.4)',
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: '800' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 26 },

  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body1Bold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  body2: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  body2Bold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  body3: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  body3Bold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },

  caption1: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption1Bold: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  caption2: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  caption3: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
