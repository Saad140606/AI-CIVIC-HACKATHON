/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A1628',
          secondary: '#0D1E38',
        },
        card: {
          DEFAULT: '#0F2040',
          hover: '#162950',
          border: '#1E3A5F',
        },
        accent: {
          DEFAULT: '#00D4FF',
          hover: '#00B8D9',
          dim: '#00D4FF22',
        },
        success: '#00E676',
        danger: '#FF5252',
        warning: '#FFB300',
        text: {
          primary: '#FFFFFF',
          secondary: '#8892A4',
          muted: '#4A5568',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        urdu: ['Noto Nastaliq Urdu', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse at 50% 0%, #00D4FF22 0%, transparent 60%)',
        'card-gradient': 'linear-gradient(135deg, #0F2040 0%, #162950 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        glow: { '0%': { boxShadow: '0 0 5px #00D4FF44' }, '100%': { boxShadow: '0 0 20px #00D4FF88, 0 0 40px #00D4FF22' } },
        countUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'accent': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow': '0 0 40px rgba(0, 212, 255, 0.15)',
      },
    },
  },
  plugins: [],
}
