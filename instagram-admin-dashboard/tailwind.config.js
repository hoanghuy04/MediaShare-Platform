/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          high: '#ac4abbff',
          deep: '#6f1f8f',
          dark: '#431b56',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 25px rgba(67,27,86,0.12)',
      },
      borderRadius: {
        xl: '1.25rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #ac4abbff 0%, #6f1f8f 60%, #431b56 100%)',
      },
    },
  },
  plugins: [],
}

