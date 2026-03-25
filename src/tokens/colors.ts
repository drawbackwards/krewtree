/**
 * Krewtree brand color primitives.
 * Source: Krewtree Brand Guidelines (Feb 2026)
 */
export const colors = {
  navy: {
    950: '#060f13',
    900: '#0a232d', // brand Navy — 60% usage
    800: '#0d2d3a',
    700: '#113648',
    600: '#164355',
    500: '#1d5669',
    400: '#2e7a94',
    300: '#4da0bd',
    200: '#8dcada',
    100: '#c5e5ef',
    50: '#eaf5f9',
  },
  sand: {
    950: '#3a2d19',
    900: '#7a5c32',
    800: '#a07a4a',
    700: '#c49a60',
    600: '#d4b48a',
    500: '#ddc9a8',
    400: '#e5dac3', // brand Sand Dune — 30% usage
    300: '#ede5d3',
    200: '#f3ede3',
    100: '#f8f4ef',
    50: '#fdfcfa',
  },
  olive: {
    950: '#1e2109',
    900: '#343d0f',
    800: '#4d5a16',
    700: '#6d7531', // brand Olive — 10% usage
    600: '#869142',
    500: '#9fac55',
    400: '#b8c572',
    300: '#cedb95',
    200: '#e2ecb8',
    100: '#f1f6da',
    50: '#f8fbee',
  },
  grey: {
    900: '#111218', // Ink
    800: '#1f2028',
    700: '#3d3e4a', // Charcoal
    600: '#56576a',
    500: '#6b6b80',
    400: '#9191a8',
    300: '#b8b8cc', // Silver
    200: '#e0e0ea',
    100: '#f0f0f6',
    50: '#f8f8fa',
  },
  white: '#ffffff',
  black: '#000000',
} as const

export type ColorScale = typeof colors

/** Semantic token map for light mode */
export const lightTokens = {
  bg: colors.white,
  bgSubtle: colors.grey[50],
  surface: colors.white,
  surfaceRaised: colors.grey[50],
  border: colors.grey[200],
  borderStrong: colors.grey[300],
  text: colors.grey[900],
  textMuted: colors.grey[500],
  textPlaceholder: colors.grey[400],
  textInverse: colors.white,
  primary: colors.navy[900],
  primaryHover: colors.navy[700],
  primaryFg: colors.white,
  secondary: colors.grey[100],
  secondaryHover: colors.grey[200],
  secondaryFg: colors.grey[900],
  accent: colors.olive[700],
  accentHover: colors.olive[800],
  accentFg: colors.white,
  success: '#1e7a4a',
  successSubtle: '#edf7f2',
  warning: '#b96a0a',
  warningSubtle: '#fef6e8',
  danger: '#c0392b',
  dangerSubtle: '#fdf0ef',
  info: colors.navy[500],
  infoSubtle: colors.navy[50],
} as const

/** Semantic token map for dark mode */
export const darkTokens = {
  bg: '#0f1117',
  bgSubtle: '#161820',
  surface: '#1a1c25',
  surfaceRaised: '#21232e',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#f0f0f6',
  textMuted: colors.grey[400],
  textPlaceholder: colors.grey[600],
  textInverse: colors.grey[900],
  primary: colors.sand[400],
  primaryHover: colors.sand[300],
  primaryFg: colors.navy[900],
  secondary: 'rgba(255,255,255,0.06)',
  secondaryHover: 'rgba(255,255,255,0.10)',
  secondaryFg: '#f0f0f6',
  accent: colors.olive[500],
  accentHover: colors.olive[400],
  accentFg: colors.white,
  success: '#3da666',
  successSubtle: 'rgba(61,166,102,0.12)',
  warning: '#e08d28',
  warningSubtle: 'rgba(224,141,40,0.12)',
  danger: '#e05252',
  dangerSubtle: 'rgba(224,82,82,0.12)',
  info: colors.navy[300],
  infoSubtle: 'rgba(77,160,189,0.12)',
} as const
