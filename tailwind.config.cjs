export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'text-blue-600',    // Clase del color del texto
    'hover:text-blue-800',  // Clase del hover
    'underline',        // Clase del subrayado
  ],
};