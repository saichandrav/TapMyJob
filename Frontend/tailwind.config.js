export default {
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#111118',
        card: '#16161F',
        border: '#22222E',
        primary: '#6C63FF',
        secondary: '#00D9A3',
        text: {
          primary: '#F0F0F5',
          muted: '#6B6B80',
        },
        danger: '#FF4D6A',
        warning: '#FFB347',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card-glow': '0 0 0 1px rgba(108, 99, 255, 0.18), 0 18px 60px rgba(0, 0, 0, 0.45)',
        'accent-glow': '0 0 24px rgba(108, 99, 255, 0.35), 0 0 48px rgba(0, 217, 163, 0.14)',
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(108, 99, 255, 0.18), 0 0 0 rgba(108, 99, 255, 0)' },
          '50%': { boxShadow: '0 0 0 1px rgba(108, 99, 255, 0.3), 0 0 28px rgba(108, 99, 255, 0.2)' },
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