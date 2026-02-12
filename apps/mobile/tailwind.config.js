// Tailwind config for twrnc - Warm, family-friendly theme
module.exports = {
  theme: {
    extend: {
      colors: {
        // Warm beige/brown theme for family app
        background: '#2d2520', // warm dark chocolate brown - main background
        card: '#3d332d80', // warm brown/50 - card backgrounds with opacity

        // Border colors - warm tones
        border: '#4a3f3880', // warm brown/50
        'border-light': '#5c4f4680', // lighter warm brown/50

        // Text colors - warm cream tones
        text: {
          DEFAULT: '#f5f1ed', // warm cream/white
          muted: '#d4c5b9', // warm beige
          light: '#a89985', // warm tan
        },

        // Primary colors (sage/olive green for person1 - natural, calming)
        primary: {
          DEFAULT: '#6b8e6f', // sage green
          light: '#7fa884', // lighter sage
          dark: '#5a7a5e', // darker sage
          teal: '#5d8a7f', // warm teal
        },

        // Secondary colors (warm golden yellow for person2 - friendly, warm)
        secondary: {
          DEFAULT: '#e8c96f', // warm golden yellow
          light: '#f0d689', // lighter golden
          dark: '#d4b560', // deeper golden
          orange: '#c4a564', // warm amber
        },

        // Status colors - warmer versions
        success: '#7ba872', // warm green
        warning: '#e8b855', // warm golden yellow
        error: '#d17166', // warm red/coral
        info: '#c17b5c', // terracotta (replacing cold blue)

        // Muted backgrounds for empty slots - warm tones
        muted: {
          DEFAULT: '#4a3f3880', // warm brown/50
          light: '#5c4f4680', // lighter warm brown/50
        },

        // Warm brown variants for consistent styling
        slate: {
          300: '#d4c5b9', // warm light beige
          400: '#a89985', // warm tan
          500: '#8b7a6a', // warm brown-gray
          600: '#6e5e4f', // medium warm brown
          700: '#4a3f38', // dark warm brown
          800: '#3d332d', // darker warm brown
          900: '#2d2520', // darkest chocolate brown
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
