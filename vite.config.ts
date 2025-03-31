import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  
  plugins: [react()],
  base: '/', // Adicione esta linha para desenvolvimento local
  server: {
    open: true, // Abre o navegador automaticamente
  },
});