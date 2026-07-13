/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Inter', 'Nunito', 'sans-serif'],
        inter:  ['Inter', 'sans-serif'],
      },
      colors: {
        // Brand accent (kept for interactive elements only)
        coral:     '#FF6B6B',
        tangerine: '#FF8E53',
        teal:      '#4ECDC4',
        mint:      '#A8E6CF',
        lavender:  '#C3B1E1',
        gold:      '#FFD700',
        // Verified tick green
        verified:  '#22C55E',
        // Soft neutrals — light theme
        light: {
          bg:     '#F5F6FA',
          card:   '#FFFFFF',
          border: '#EAECF0',
          text:   '#111827',
          muted:  '#6B7280',
          sub:    '#9CA3AF',
        },
        // Soft neutrals — dark theme (softer charcoal)
        dark: {
          bg:     '#111827',
          card:   '#1F2937',
          border: '#374151',
          text:   '#F9FAFB',
          muted:  '#9CA3AF',
          sub:    '#6B7280',
        },
      },
      backgroundImage: {
        'gradient-family': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #4ECDC4 100%)',
        'gradient-warm':   'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
        'gradient-cool':   'linear-gradient(135deg, #4ECDC4 0%, #C3B1E1 100%)',
        'gradient-soft':   'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 100%)',
        'gradient-card':   'linear-gradient(135deg, rgba(255,107,107,0.08) 0%, rgba(78,205,196,0.08) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'card':        '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover':  '0 4px 24px rgba(0,0,0,0.12)',
        'glow-coral':  '0 0 24px rgba(255,107,107,0.25)',
        'glow-teal':   '0 0 24px rgba(78,205,196,0.25)',
        'glass':       '0 8px 32px rgba(0,0,0,0.08)',
        'inset-sm':    'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'bounce-slow':  'bounce 3s infinite',
        'spin-slow':    'spin 8s linear infinite',
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
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
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%':   { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
