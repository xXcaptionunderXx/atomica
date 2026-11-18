import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './', // relative asset paths so the Electron app can load dist/ from disk
  server: {
    port: 5317,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
