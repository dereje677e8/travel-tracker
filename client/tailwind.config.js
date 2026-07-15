/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Control tower" palette: deep teal as the operational primary,
        // amber as the departure/runway accent. Status colors are semantic
        // and map 1:1 to the five spec'd athlete statuses.
        canvas: { DEFAULT: '#F6F8F9', dark: '#0B1220' },
        surface: { DEFAULT: '#FFFFFF', dark: '#111A2B' },
        ink: { DEFAULT: '#0F172A', dark: '#E2E8F0' },
        primary: {
          50: '#EBFAF9', 100: '#CFF3F0', 300: '#6FCFC7', 500: '#0E7C86',
          600: '#0B646C', 700: '#0A555C', 900: '#062F33',
        },
        accent: { DEFAULT: '#F2A93B', dark: '#C7841F' },
        status: {
          new: '#94A3B8',
          preparing: '#F59E0B',
          progress: '#3B82F6',
          almost: '#8B5CF6',
          ready: '#10B981',
          action: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
