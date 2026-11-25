/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        slate: {
          850: '#1a2235',
          900: '#0f172a',
          950: '#0a0f1e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'score-fill': 'scoreFill 1.5s ease-out forwards',
      },
      keyframes: {
        scoreFill: {
          from: { strokeDashoffset: '283' },
          to: { strokeDashoffset: 'var(--target-offset)' },
        },
      },
    },
  },
  plugins: [],
}
