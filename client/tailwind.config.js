/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          teal: '#0f766e',
          navy: '#0c4a6e',
          purple: '#5b21b6',
          blue: '#1d4ed8',
          green: '#166534',
        },
      },
    },
  },
  plugins: [],
};