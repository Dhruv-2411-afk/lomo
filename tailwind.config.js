/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lomo: {
          bg: '#F7F3EE',
          secondary: '#EFE8DE',
          text: '#111111',
          muted: '#6F6A64',
          gold: '#E09B2D',
          brown: '#B76E3A',
          border: 'rgba(17,17,17,0.08)',
          success: '#52734D',
        }
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.05)',
        card: '0 12px 40px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}