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
        // Brand accent: warm ochre ("Harvest & Ink" identity) — 600 is the
        // light-mode accent, 400 the dark-mode accent, matching how every
        // consumer already references this ramp (light uses the darker/more
        // saturated end for contrast on white, dark uses the lighter end for
        // contrast on a near-black ground).
        primary: {
          50: '#fdf6ec',
          100: '#faead1',
          200: '#f0dcc0',
          300: '#f0be7c',
          400: '#e0a252',
          500: '#c8801e',
          600: '#b8660f',
          700: '#8f4e0a',
          800: '#6e3c08',
          900: '#4a2806',
        },
        // Dark-mode neutrals: a bottle-green-black rather than navy, tying
        // the palette to the app's reuse/sustainability angle instead of a
        // generic dark-mode blue.
        navy: {
          50: '#f6f7f2',
          100: '#eef0e6',
          200: '#dcdfd4',
          300: '#9fad9f',
          400: '#7a8a79',
          500: '#586657',
          600: '#3f4b3f',
          700: '#2b382e',
          800: '#1a251e',
          900: '#131d17',
          950: '#0d140f',
        },
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold', 'Georgia', 'serif'],
        'display-medium': ['Fraunces_500Medium_Italic', 'Georgia', 'serif'],
        sans: ['PlusJakartaSans_400Regular', 'system-ui', 'sans-serif'],
        'sans-medium': ['PlusJakartaSans_500Medium', 'system-ui', 'sans-serif'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold', 'system-ui', 'sans-serif'],
        'sans-bold': ['PlusJakartaSans_700Bold', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
