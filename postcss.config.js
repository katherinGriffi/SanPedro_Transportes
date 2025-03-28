// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {
      config: './tailwind.config.cjs' // ou './tailwind.config.js' se for ES module
    },
    autoprefixer: {},
  }
}