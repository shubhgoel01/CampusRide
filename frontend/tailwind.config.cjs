module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0056b3', // Academic Blue
          light: '#3378c2',
          dark: '#003d80'
        },
        secondary: '#64748b', // Slate 500
        background: '#f8fafc', // Slate 50
        surface: '#ffffff'
      }
    },
  },
  plugins: [],
}
