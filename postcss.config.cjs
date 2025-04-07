module.exports = {
  plugins: [
    require('@tailwindcss/postcss7-compat'), // Usar o pacote compatível com PostCSS7
    require('autoprefixer'), // Autoprefixer para garantir a compatibilidade com navegadores
  ],
}
