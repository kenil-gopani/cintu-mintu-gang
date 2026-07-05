/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#fff1f0',
          100: '#ffe4e0',
          200: '#ffccc6',
          300: '#ffa89e',
          400: '#ff7b6b',
          500: '#ff6b6b',
          600: '#ed3a3a',
          700: '#c81e1e',
          800: '#a61c1c',
          900: '#891e1e',
        },
        coral: '#FF6B6B',
        tangerine: '#FF8E53',
        teal: '#4ECDC4',
        mint: '#A8E6CF',
        lavender: '#C3B1E1',
        gold: '#FFD700',
        dark: {
          bg:     '#0F0F1A',
          card:   '#1A1A2E',
          border: '#2A2A4A',
          text:   '#E2E8F0',
          muted:  '#94A3B8',
        },
        light: {
          bg:     '#F8F9FF',
          card:   '#FFFFFF',
          border: '#E2E8F0',
          text:   '#1E293B',
          muted:  '#64748B',
        }
      },
      backgroundImage: {
        'gradient-family':   'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #4ECDC4 100%)',
        'gradient-warm':     'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
        'gradient-cool':     'linear-gradient(135deg, #4ECDC4 0%, #C3B1E1 100%)',
        'gradient-dark':     'linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 100%)',
        'gradient-card':     'linear-gradient(135deg, rgba(255,107,107,0.1) 0%, rgba(78,205,196,0.1) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-coral': '0 0 30px rgba(255, 107, 107, 0.4)',
        'glow-teal':  '0 0 30px rgba(78, 205, 196, 0.4)',
        'glass':      '0 8px 32px rgba(0, 0, 0, 0.2)',
        'card':       '0 4px 24px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'bounce-slow':  'bounce 3s infinite',
        'spin-slow':    'spin 8s linear infinite',
        'wiggle':       'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':      { transform: 'rotate(3deg)' },
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
