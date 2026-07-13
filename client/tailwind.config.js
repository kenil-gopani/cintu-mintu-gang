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
        // Premium SaaS Theme (Stripe/Linear inspired)
        primary:   '#2563EB',   // Primary Blue
        secondary: '#3B82F6',   // Secondary Blue
        accent:    '#60A5FA',   // Accent Blue
        // Legacy colors mapped to maintain compatibility but match new theme
        teal:      '#3B82F6',
        mint:      '#93C5FD',
        lavender:  '#BFDBFE',
        gold:      '#F59E0B',
        coral:     '#2563EB',
        tangerine: '#3B82F6',
        verified:  '#22C55E',
        // Light theme
        light: {
          bg:     '#F8FAFC',    // Slate 50
          card:   '#FFFFFF',    // Surface
          border: '#E2E8F0',    // Slate 200
          text:   '#0F172A',    // Slate 900
          muted:  '#64748B',    // Slate 500
          sub:    '#94A3B8',    // Slate 400
        },
        // Dark theme (adapted for SaaS look)
        dark: {
          bg:     '#0F172A',
          card:   '#1E293B',
          border: '#334155',
          text:   '#F8FAFC',
          muted:  '#94A3B8',
          sub:    '#64748B',
        },
      },
      backgroundImage: {
        'gradient-family':  'none',
        'gradient-warm':    'none',
        'gradient-cool':    'none',
        'gradient-green':   'none',
        'gradient-soft':    'none',
        'gradient-card':    'none',
        'gradient-hero':    'none',
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'card':          '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover':    '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'glow-coral':    'none',
        'glow-teal':     'none',
        'glow-green':    'none',
        'glass':         'none',
        'inset-sm':      'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '16px', // 16px as requested
        '3xl': '20px', // 20px for cards
        '4xl': '24px', // 24px as requested
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow':   'spin 8s linear infinite',
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-18px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn:  { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
