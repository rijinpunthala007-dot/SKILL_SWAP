/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        surface: {
          DEFAULT: '#070714',
          card:     '#0f0f28',
          elevated: '#16163a',
          border:   '#1f1f4a',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        }
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',      opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #06b6d4 100%)',
      },
      boxShadow: {
        'glow-brand': '0 0 30px rgba(99,102,241,0.35), 0 0 60px rgba(99,102,241,0.15)',
        'glow-sm':    '0 0 15px rgba(99,102,241,0.25)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 48px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1)',
      },
    },
  },
  plugins: [],
};
