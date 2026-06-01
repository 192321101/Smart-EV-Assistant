/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#e0f2fe',
          primary: '#0ea5e9', // Cyber cyan
          secondary: '#d946ef', // Neon magenta
          accent: '#10b981', // Lime electric green
          warning: '#f59e0b', // Solar gold
          danger: '#f43f5e', // Flare red
          dark: '#0f172a',
          glass: 'rgba(255, 255, 255, 0.7)'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'wave': 'wave 1.2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        }
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(14, 165, 233, 0.4)',
        'glow-secondary': '0 0 15px rgba(217, 70, 239, 0.4)',
        'glow-accent': '0 0 15px rgba(16, 185, 129, 0.4)',
        'cyber': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
