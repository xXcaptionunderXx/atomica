import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5317,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
