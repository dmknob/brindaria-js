1/** @type {import('tailwindcss').Config} */
module.exports = {
  // AQUI ESTÁ O SEGREDO: Dizemos para ele ler todos os arquivos .ejs dentro de views
  content: [
    "./views/**/*.ejs",
    "./src/**/*.js" // Caso tenhamos classes dentro de strings no JS
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          800: '#92400e',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [
    // Removed '@tailwindcss/typography' to measure size impact
  ],
}