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
          bg: '#0f0f0f',
          card: '#1a1a1a',
          border: '#2a2a2a',
          amber: '#f59e0b',
          red: '#ef4444',
          text: '#e5e5e5',
          muted: '#737373',
        }
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}