/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        pulseRing: {
          '0%':   { boxShadow: '0 0 0 0 rgba(74,222,128,0.6)' },
          '70%':  { boxShadow: '0 0 0 8px rgba(74,222,128,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(74,222,128,0)' },
        },
      },
      animation: {
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'pulse-ring':     'pulseRing 2s infinite',
      },
    },
  },
  plugins: [],
};
