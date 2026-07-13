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
        // Brand accent — Indigo/Purple + Emerald green
        primary:   '#6366F1',   // Indigo
        secondary: '#8B5CF6',   // Purple
        accent:    '#10B981',   // Emerald green
        // Keep teal/mint as decorative
        teal:      '#14B8A6',
        mint:      '#A8E6CF',
        lavender:  '#C3B1E1',
        gold:      '#F59E0B',
        // For compatibility
        coral:     '#6366F1',   // Map coral → primary indigo so existing uses get purple
        tangerine: '#8B5CF6',
        // Verified tick
        verified:  '#10B981',
        // Light theme
        light: {
          bg:     '#F5F6FA',
          card:   '#FFFFFF',
          border: '#E5E7EB',
          text:   '#111827',
          muted:  '#6B7280',
          sub:    '#9CA3AF',
        },
        // Dark theme
        dark: {
          bg:     '#0F1117',
          card:   '#1A1D27',
          border: '#2D3148',
          text:   '#F1F5F9',
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
        'card':          '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover':    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glow-coral':    'none',
        'glow-teal':     'none',
        'glow-green':    'none',
        'glass':         'none',
        'inset-sm':      'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '0.5rem',
        '3xl': '0.75rem',
        '4xl': '1rem',
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
