/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sp: {
          bg: '#f3f5fc',  // Tambahkan ini
          blue: {
            900: '#0f2f9e',
            800: '#13389e',
            700: '#1541c9',
            600: '#1d4fe0',
            500: '#3b63f0',
            50: '#eef1ff',
          },
          lav: {
            50: '#eef1fb',
            100: '#e6eaf9',
          },
          ink: {
            900: '#0b1220',
            700: '#2a3242',
            500: '#6b7383',
            400: '#9aa1b0',
          },
          line: '#e7e9f2',
          green: {
            bg: '#e4f8ec',
            fg: '#1a9a53',
          },
          red: {
            bg: '#fde9ea',
            fg: '#e0384c',
          },
          amber: {
            bg: '#fdf3dc',
            fg: '#c78a12',
          },
          purple: {
            500: '#6d4cf0',
          },
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sp-lg': '26px',
        'sp-md': '18px',
        'sp-sm': '12px',
      },
      boxShadow: {
        'sp-card': '0 10px 30px -12px rgba(20,40,120,0.14)',
        'sp-btn': '0 12px 24px -10px rgba(20,60,220,0.45)',
      },
    },
  },
  plugins: [],
}