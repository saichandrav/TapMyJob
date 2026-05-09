export default {
  theme: {
    extend: {
      colors: {
        background: '#F8F9FB',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        border: '#E4E7EE',
        primary: '#5B4CF5',
        secondary: '#0BAF7E',
        text: {
          primary: '#111827',
          muted: '#6B7280',
        },
        danger: '#E53E3E',
        warning: '#D97706',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card-glow': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
        'accent-glow': '0 0 20px rgba(91,76,245,0.15)',
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(91,76,245,0.12)' },
          '50%': { boxShadow: '0 0 0 1px rgba(91,76,245,0.25), 0 0 20px rgba(91,76,245,0.1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 0.5s ease-out both',
        'pulse-glow': 'pulseGlow 2.2s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
}