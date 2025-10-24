/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#405DE6',
        secondary: '#5851DB',
        accent: '#833AB4',
        danger: '#ED4956',
        success: '#4CAF50',
        warning: '#FFC107',
        info: '#2196F3',
      },
    },
  },
  plugins: [],
};

