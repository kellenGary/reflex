/** @type {import('tailwindcss').Config} */
module.exports = {
  // Light theme only for now. 'class' (not the default 'media') also stops NativeWind's web color-scheme observer from throwing.
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Keep in sync with src/theme/colors.ts (used by SVG, which can't take classNames)
      colors: {
        cream: '#F8F3E6',
        ink: '#2A2A24',
        muted: '#77735F',
        body: '#4A4A3E',
        line: '#E3DAC3',
        track: '#E9E1CC',
        depression: '#9A8660',
        anxiety: '#D98E45',
        meaning: '#6F9449',
      },
    },
  },
  plugins: [],
};
