/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        kapori: {
          50:  '#f0f7f3',
          100: '#dcede4',
          200: '#bbdbcc',
          300: '#8ec2a8',
          400: '#5da37f',
          500: '#3a8761',
          600: '#2D6A4F', // PRIMARY
          700: '#245540',
          800: '#1B4332', // DARK
          900: '#163529',
        },
        gold: {
          400: '#e8b84b',
          500: '#D4A017', // aksen emas logo
          600: '#b8870f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
