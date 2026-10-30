/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#f7f4ef',
        ink: {
          900: '#1f1b16',
          700: '#4a4339',
          500: '#776d5f',
          400: '#978c7d',
          300: '#cfc6b8',
          200: '#e5ded2',
          100: '#f0ebe2',
        },
        brand: {
          50: '#effaf8',
          100: '#d4f0ea',
          200: '#a9e0d4',
          300: '#73c9b8',
          400: '#3fab98',
          500: '#22897a',
          600: '#176e63',
          700: '#135850',
          800: '#114640',
          900: '#0f3a35',
        },
        gold: {
          50: '#fdf8ee',
          100: '#f8ecd2',
          200: '#f0d8a2',
          300: '#e6bf6c',
          400: '#d9a447',
          500: '#b98326',
          600: '#94661c',
          700: '#724e18',
        },
        success: { 50: '#ecfdf3', 600: '#15733a', 700: '#0f5c2e' },
        warning: { 50: '#fff7e6', 600: '#9a5b00', 700: '#7a4700' },
        danger: { 50: '#fef2f2', 600: '#b42318', 700: '#912018' },
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 27, 22, 0.04), 0 1px 3px rgba(31, 27, 22, 0.06)',
        pop: '0 12px 32px -8px rgba(31, 27, 22, 0.18)',
      },
    },
  },
  plugins: [],
};
