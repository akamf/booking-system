import type { Config } from 'tailwindcss';
import preset from '@booking/config/tailwind';

export default {
  presets: [preset],
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
} satisfies Config;
