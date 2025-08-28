/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Nunito', 'Poppins', 'system-ui', 'sans-serif'],
        'spiritual': ['"Noto Serif Devanagari"', '"Tiro Devanagari"', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'spiritual-gradient': 'linear-gradient(135deg, #FFF4E6 0%, #FFF9F1 100%)',
        'spiritual-diagonal': 'linear-gradient(135deg, #FFF4E6 0%, #FFECD1 50%, #FFF9F1 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 4s ease-in-out infinite alternate',
        'ripple': 'ripple 0.6s linear',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { opacity: '0.7', textShadow: '0 0 5px rgba(130, 46, 46, 0.3)' },
          '100%': { opacity: '0.9', textShadow: '0 0 20px rgba(130, 46, 46, 0.6), 0 0 30px rgba(130, 46, 46, 0.4)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      colors: {
        // Spiritual Color Palette
        'spiritual': {
          50: '#FFF9F1',   // Cream light
          100: '#FFF4E6',  // Soft saffron
          200: '#FFECD1',  // Light saffron
          300: '#FFD6A5',  // Medium saffron
          400: '#F4B400',  // Deep saffron
          500: '#E09900',  // Darker saffron
          600: '#CC8800',  // Gold
          700: '#B87700',  // Deep gold
          800: '#A46600',  // Bronze
          900: '#822E2E',  // Deep maroon
        },
        'accent': {
          50: '#F0FDF4',   // Light green
          100: '#DCFCE7',  // Pastel green
          200: '#BBF7D0',  // Light teal
          300: '#86EFAC',  // Medium teal
          400: '#4ADE80',  // Bright green
          500: '#22C55E',  // Forest green
          600: '#16A34A',  // Deep green
          700: '#15803D',  // Darker green
          800: '#166534',  // Very dark green
          900: '#14532D',  // Forest dark
        },
        'cream': {
          50: '#FFFEF7',
          100: '#FFF9F1',
          200: '#FFF4E6',
          300: '#FFECD1',
          400: '#FFE4BC',
          500: '#FFDCA7',
        }
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
      borderRadius: {
        'spiritual': '16px',
        'card': '20px',
        'button': '16px',
      },
      boxShadow: {
        'spiritual': '0 4px 20px rgba(130, 46, 46, 0.1)',
        'spiritual-lg': '0 8px 30px rgba(130, 46, 46, 0.15)',
        'glow': '0 0 20px rgba(244, 180, 0, 0.3)',
        'glow-lg': '0 0 30px rgba(244, 180, 0, 0.4)',
      },
      letterSpacing: {
        'spiritual': '0.025em',
        'wide-spiritual': '0.05em',
      },
      lineHeight: {
        'spiritual': '1.3',
        'spiritual-relaxed': '1.4',
      }
    },
  },
  plugins: [],
};