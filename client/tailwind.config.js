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
        // Dynamic Theme Variables
        primary:   'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent:    'rgb(var(--color-accent) / <alpha-value>)',
        // Semantic
        success: '#22C55E',
        warning: '#F59E0B',
        danger:  '#EF4444',
        info:    '#3B82F6',
        // Legacy colors scoped strictly for Login/Landing page preservation
        teal:      '#4ECDC4',
        mint:      '#93C5FD',
        lavender:  '#C3B1E1',
        gold:      '#F59E0B',
        coral:     '#FF6B6B',
        tangerine: '#FF8E53',
        verified:  '#3B82F6',
        // Light theme mapped to variables
        light: {
          bg:     'rgb(var(--color-light-bg) / <alpha-value>)',
          card:   'rgb(var(--color-light-card) / <alpha-value>)',
          border: 'rgb(var(--color-light-border) / <alpha-value>)',
          text:   'rgb(var(--color-light-text) / <alpha-value>)',
          muted:  'rgb(var(--color-light-muted) / <alpha-value>)',
          sub:    'rgb(var(--color-light-sub) / <alpha-value>)',
        },
        // Dark theme mapped to variables
        dark: {
          bg:     'rgb(var(--color-dark-bg) / <alpha-value>)',
          card:   'rgb(var(--color-dark-card) / <alpha-value>)',
          border: 'rgb(var(--color-dark-border) / <alpha-value>)',
          text:   'rgb(var(--color-dark-text) / <alpha-value>)',
          muted:  'rgb(var(--color-dark-muted) / <alpha-value>)',
          sub:    'rgb(var(--color-dark-sub) / <alpha-value>)',
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
