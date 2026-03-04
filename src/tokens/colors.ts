/**
 * Krewtree brand color primitives.
 * Source: Krewtree Brand Guidelines (Feb 2026)
 */
export const colors = {
  navy: {
    950: '#060f13',
    900: '#0a232d',   // brand Navy — 60% usage
    800: '#0d2d3a',
    700: '#113648',
    600: '#164355',
    500: '#1d5669',
    400: '#2e7a94',
    300: '#4da0bd',
    200: '#8dcada',
    100: '#c5e5ef',
    50:  '#eaf5f9',
  },
  sand: {
    950: '#3a2d19',
    900: '#7a5c32',
    800: '#a07a4a',
    700: '#c49a60',
    600: '#d4b48a',
    500: '#ddc9a8',
    400: '#e5dac3',   // brand Sand Dune — 30% usage
    300: '#ede5d3',
    200: '#f3ede3',
    100: '#f8f4ef',
    50:  '#fdfcfa',
  },
  olive: {
    950: '#1e2109',
    900: '#343d0f',
    800: '#4d5a16',
    700: '#6d7531',   // brand Olive — 10% usage
    600: '#869142',
    500: '#9fac55',
    400: '#b8c572',
    300: '#cedb95',
    200: '#e2ecb8',
    100: '#f1f6da',
    50:  '#f8fbee',
  },
  grey: {
    900: '#161616',   // Ink
    700: '#454545',   // Charcoal
    500: '#737373',
    400: '#9b9b9b',
    300: '#c7c7c7',   // Silver
    200: '#dbdbdb',
    100: '#f0f0f0',
    50:  '#fafafa',
  },
  white: '#ffffff',
  black: '#000000',
} as const

export type ColorScale = typeof colors

/** Semantic token map for light mode */
export const lightTokens = {
  bg:                 colors.white,
  bgSubtle:           colors.sand[50],
  surface:            colors.white,
  surfaceRaised:      colors.sand[100],
  border:             colors.grey[200],
  borderStrong:       colors.grey[300],
  text:               colors.grey[900],
  textMuted:          colors.grey[700],
  textPlaceholder:    colors.grey[400],
  textInverse:        colors.white,
  primary:            colors.navy[900],
  primaryHover:       colors.navy[800],
  primaryFg:          colors.sand[400],
  secondary:          colors.sand[400],
  secondaryHover:     colors.sand[500],
  secondaryFg:        colors.navy[900],
  accent:             colors.olive[700],
  accentHover:        colors.olive[800],
  accentFg:           colors.white,
  success:            '#2d7a4f',
  successSubtle:      '#edf7f1',
  warning:            '#c97c1a',
  warningSubtle:      '#fef7ec',
  danger:             '#c0392b',
  dangerSubtle:       '#fdf0ef',
  info:               colors.navy[600],
  infoSubtle:         colors.navy[50],
} as const

/** Semantic token map for dark mode */
export const darkTokens = {
  bg:                 colors.navy[900],
  bgSubtle:           colors.navy[800],
  surface:            colors.navy[800],
  surfaceRaised:      colors.navy[700],
  border:             colors.navy[700],
  borderStrong:       colors.navy[600],
  text:               colors.sand[300],
  textMuted:          colors.sand[500],
  textPlaceholder:    colors.navy[400],
  textInverse:        colors.navy[900],
  primary:            colors.sand[400],
  primaryHover:       colors.sand[300],
  primaryFg:          colors.navy[900],
  secondary:          colors.navy[700],
  secondaryHover:     colors.navy[600],
  secondaryFg:        colors.sand[300],
  accent:             colors.olive[600],
  accentHover:        colors.olive[500],
  accentFg:           colors.white,
  success:            '#3da666',
  successSubtle:      'rgba(61,166,102,0.12)',
  warning:            '#e08d28',
  warningSubtle:      'rgba(224,141,40,0.12)',
  danger:             '#e05252',
  dangerSubtle:       'rgba(224,82,82,0.12)',
  info:               colors.navy[300],
  infoSubtle:         'rgba(77,160,189,0.12)',
} as const
