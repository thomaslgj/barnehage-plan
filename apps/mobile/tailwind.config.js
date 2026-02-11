// Tailwind config for twrnc - Dark slate theme matching web
module.exports = {
  theme: {
    extend: {
      colors: {
        // Dark slate theme colors matching web
        background: '#0f172a', // slate-900 - main background
        card: '#1e293b80', // slate-800/50 - card backgrounds with opacity

        // Border colors
        border: '#33415580', // slate-700/50
        'border-light': '#47556980', // slate-600/50

        // Text colors
        text: {
          DEFAULT: '#ffffff', // white
          muted: '#cbd5e1', // slate-300
          light: '#94a3b8', // slate-400
        },

        // Primary colors (emerald/teal for person1 buttons)
        primary: {
          DEFAULT: '#059669', // emerald-600
          light: '#10b981', // emerald-500
          dark: '#047857', // emerald-700
          teal: '#0f766e', // teal-700
        },

        // Secondary colors (amber/orange for person2 buttons)
        secondary: {
          DEFAULT: '#f59e0b', // amber-500
          light: '#fbbf24', // amber-400
          dark: '#d97706', // amber-600
          orange: '#ea580c', // orange-600
        },

        // Status colors for equipment badge
        success: '#22c55e', // green-500
        warning: '#eab308', // yellow-500
        error: '#ef4444', // red-500
        info: '#3b82f6', // blue-500

        // Muted backgrounds for empty slots
        muted: {
          DEFAULT: '#33415580', // slate-700/50
          light: '#4b556380', // slate-600/50
        },

        // Slate variants for consistent styling
        slate: {
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      animation: {
        'pulse-slow': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 1.2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
    },
  },
};
