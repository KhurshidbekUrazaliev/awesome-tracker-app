/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './modules/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Brand accent: violet, used for buttons/links/focus in both themes.
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Dark-mode neutrals: navy rather than plain gray, so surfaces read
        // as intentionally "navy + violet" instead of a generic gray theme.
        navy: {
          50: '#f4f5f9',
          100: '#e2e4ee',
          200: '#c2c7d9',
          300: '#9aa1bb',
          400: '#6b7494',
          500: '#4b5583',
          600: '#37406b',
          700: '#262e52',
          800: '#1a2140',
          900: '#11162a',
          950: '#0a0e1a',
        },
      },
    },
  },
  plugins: [],
};
