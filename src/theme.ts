import { Platform } from 'react-native';

export const colors = {
  primary: '#6C5CE7',
  primaryLight: '#8B7CF6',
  primarySoft: '#F0EEFF',
  match: '#FF6685',
  success: '#2DD4A8',
  background: '#F8F9FC',
  surface: '#FFFFFF',
  text: '#171A2B',
  textSecondary: '#6B7080',
  textMuted: '#9A9EAC',
  border: '#E8E9F0',
  danger: '#FF5A67',
  warning: '#F4A340',
  warningSoft: '#FFF6E8',
  warningText: '#A26B13',
  successSoft: '#E9FAF5',
  successText: '#238963',
  matchSoft: '#FFF0F3',
  matchText: '#B14B60',
  matchBorder: '#F8DCE5',
  matchIconSoft: '#FFE2EA',
  infoSoft: '#EFF7FF',
  infoBorder: '#DCEBFA',
  discoveryStart: '#F8F7FF',
  discoveryMiddle: '#EFEDFF',
  discoveryEnd: '#EAF2FF',
  discoveryRipple: 'rgba(108,92,231,0.08)',
  discoveryRippleStrong: 'rgba(108,92,231,0.13)',
  surfaceMuted: '#F4F5F9',
  surfaceStrong: '#EEF0F5',
  white: '#FFFFFF',
  overlay: 'rgba(23,26,43,0.62)',
  overlaySubtle: 'rgba(23,26,43,0.02)',
  overlayLight: 'rgba(23,26,43,0.12)',
  overlayMedium: 'rgba(23,26,43,0.48)',
  overlayStrong: 'rgba(23,26,43,0.76)',
  overlayHeavy: 'rgba(23,26,43,0.92)',
  whiteFaint: 'rgba(255,255,255,0.11)',
  whiteGlass: 'rgba(255,255,255,0.18)',
  whiteMuted: 'rgba(255,255,255,0.82)',
  google: '#4285F4',
  categoryFood: '#FF7A32',
  categorySport: '#6585F6',
  categoryGaming: '#745AEF',
  sheetOverlay: 'rgba(23,26,43,0.20)',
  whiteStrong: 'rgba(255,255,255,0.94)',

  // Backward-compatible aliases while legacy screens are migrated.
  ink: '#171A2B',
  body: '#6B7080',
  muted: '#9A9EAC',
  canvas: '#F8F9FC',
  purple: '#6C5CE7',
  blue: '#6C5CE7',
  cyan: '#2DD4A8',
  soft: '#F0EEFF',
} as const;

export const radii = {
  input: 14,
  button: 18,
  card: 22,
  largeCard: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const shadows = {
  card: {
    elevation: 3,
    shadowColor: '#171A2B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
  },
  floating: {
    elevation: 8,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
} as const;

export const layout = {
  pagePadding: 16,
  maxWidth: Platform.OS === 'web' ? 1040 : 540,
  radius: radii.largeCard,
};

export const typography = {
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -1, lineHeight: 40 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 32 },
  heading: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
} as const;

export const control = {
  buttonHeight: 56,
  inputHeight: 52,
  iconButton: 44,
} as const;
