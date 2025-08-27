import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#1f2937',
        beige: {
          50: '#faf7f2',
          100: '#f3ece1',
          200: '#e7dcc8',
          300: '#d9c7a9',
          400: '#cbb289',
          500: '#bd9d6a',
          600: '#9a7e53',
          700: '#765f3e',
          800: '#52412a',
          900: '#2f2417',
        },
        neon: {
          pink: '#ff3df0',
          blue: '#00e5ff',
          green: '#39ff14',
          purple: '#9d4edd',
        },
      },
      boxShadow: {
        neon: '0 0 10px rgba(0,229,255,0.6), 0 0 20px rgba(157,78,221,0.5)'
      },
      backgroundImage: {
        'beige-gradient': 'linear-gradient(135deg, #ffffff 0%, #faf7f2 100%)'
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

