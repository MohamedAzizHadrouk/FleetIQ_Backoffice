import tunavTheme from './src/theme/tailwind-theme.js';

/** TUNAV design tokens (card FleetIQ 02/03) – see src/theme/tailwind-theme.js */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: tunavTheme
  }
};
