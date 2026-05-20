/**
 * Design tokens shared between web and mobile.
 *
 * Mobile imports these directly. Web consumes them via the tailwind preset.
 * Keep values opaque (no platform-specific assumptions) — they are raw scalars
 * and color hex strings, no `rem`/`em`/`dp`.
 */

export const colors = {
  brand: {
    50: '#eef6ff',
    100: '#d9eaff',
    200: '#bcd9ff',
    300: '#8ec0ff',
    400: '#599cff',
    500: '#2f7aff',
    600: '#1860f0',
    700: '#1450c8',
    800: '#1745a0',
    900: '#193d7e',
    950: '#10254d',
  },
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#0a0a0c',
  },
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export type ColorScale = keyof typeof colors.brand;
export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
