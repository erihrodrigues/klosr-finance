import scrollbarHide from 'tailwind-scrollbar-hide'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        purple: {
          950: '#0e0b1a',
          900: '#1a1130',
          800: '#2d1f5e',
          700: '#4c3888',
          500: '#7c3aed',
          400: '#a78bfa',
          100: '#ede9fe',
          50:  '#f8f5ff',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [scrollbarHide],
}