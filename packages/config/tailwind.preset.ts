import type { Config } from 'tailwindcss';
import { colors, radius, spacing, typography } from './src/tokens';

/**
 * Tailwind preset reflecting our design tokens.
 * Web apps add their own `content` glob; mobile does not use Tailwind.
 */
const preset: Omit<Config, 'content'> = {
  theme: {
    extend: {
      colors: {
        brand: colors.brand,
        neutral: colors.neutral,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
      },
      spacing: Object.fromEntries(
        Object.entries(spacing).map(([k, v]) => [k, `${v}px`]),
      ),
      borderRadius: Object.fromEntries(
        Object.entries(radius).map(([k, v]) => [k, typeof v === 'number' ? `${v}px` : v]),
      ),
      fontFamily: typography.fontFamily,
    },
  },
};

export default preset;
