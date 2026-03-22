// 위시맵 디자인 시스템

const lightColors = {
  // Primary
  primary: '#E8590C',
  primaryLight: '#FF8F66',
  primaryDark: '#C4470A',
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
  background: '#FAFAFA',
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

  // Component-specific
  searchBg: '#F0F0F0',
  cardBg: '#FFFFFF',
  tabBarBg: 'rgba(255,255,255,0.92)',
  sheetBg: '#FFFFFF',
  inputBg: '#FAFAFA',
  chipBg: '#F0F0F0',
  chipActiveBg: '#333333',
  chipText: '#888888',
  chipActiveText: '#FFFFFF',
  categoryBadgeBg: '#F0F0F0',
  categoryBadgeText: '#666666',
  skeletonBg: '#E0E0E0',
  imagePlaceholderBg: '#FFF5F0',
  loadingOverlay: 'rgba(255,255,255,0.8)',
  selectedCardBg: '#F0FFF5',
  selectedCardBorder: '#D4EDDA',
  reviewBtnBg: '#FFF8F5',
  reviewBtnBorder: '#FFE0D0',
  badgeBorder: '#FFFFFF',
  closeButtonBg: '#F5F5F5',
  headerBg: '#FFFFFF',
} as const;

const darkColors = {
  // Primary (same across themes)
  primary: '#E8590C',
  primaryLight: '#FF8F66',
  primaryDark: '#C4470A',
  primaryBg: '#2A1A10',
  primaryPressed: '#D94E20',

  // Gray Scale (inverted)
  gray950: '#F2F4F6',
  gray900: '#E5E8EB',
  gray800: '#D1D6DB',
  gray700: '#B0B8C1',
  gray600: '#8B95A1',
  gray500: '#6B7684',
  gray400: '#4E5968',
  gray300: '#333D4B',
  gray200: '#282E38',
  gray100: '#1E2430',
  gray50: '#171C26',

  // Semantic
  success: '#66BB6A',
  successBg: '#1A2E1A',
  error: '#FF6B6B',
  errorBg: '#2E1A1A',
  warning: '#FFB74D',
  warningBg: '#2E261A',
  info: '#64B5F6',
  infoBg: '#1A2230',

  // Background
  background: '#121212',
  surface: '#1E1E1E',
  surfaceSecondary: '#252525',

  // Text
  textPrimary: '#E8EAED',
  textSecondary: '#9AA0A6',
  textTertiary: '#6B7684',
  textDisabled: '#444444',
  textWhite: '#FFFFFF',

  // Border
  border: '#333333',
  borderLight: '#2A2A2A',
  divider: '#2A2A2A',

  // Overlay
  dimmed: 'rgba(0, 0, 0, 0.6)',

  // Component-specific
  searchBg: '#2A2A2A',
  cardBg: '#1E1E1E',
  tabBarBg: 'rgba(30,30,30,0.92)',
  sheetBg: '#1E1E1E',
  inputBg: '#252525',
  chipBg: '#2A2A2A',
  chipActiveBg: '#E8EAED',
  chipText: '#9AA0A6',
  chipActiveText: '#121212',
  categoryBadgeBg: '#2A2A2A',
  categoryBadgeText: '#9AA0A6',
  skeletonBg: '#333333',
  imagePlaceholderBg: '#2A1A10',
  loadingOverlay: 'rgba(18,18,18,0.8)',
  selectedCardBg: '#1A2E1A',
  selectedCardBorder: '#2D4A2D',
  reviewBtnBg: '#2A1A10',
  reviewBtnBorder: '#4A2A10',
  badgeBorder: '#1E1E1E',
  closeButtonBg: '#2A2A2A',
  headerBg: '#1E1E1E',
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };

export const themes = {
  light: lightColors as ThemeColors,
  dark: darkColors as ThemeColors,
} as const;

// Keep backward compatibility
export const colors = lightColors;

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },

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
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  full: 9999,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
