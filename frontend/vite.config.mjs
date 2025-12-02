import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the React application.  This plugin enables
// automatic JSX transformation and fast refresh during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
