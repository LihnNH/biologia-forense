import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rolldownOptions: {
      input: {
        index: fromRoot('./index.html'),
        trabalho: fromRoot('./trabalho.html'),
        debug: fromRoot('./debug/index.html'),
        positions: fromRoot('./debug/positions.html'),
        answers: fromRoot('./debug/gabarito.html'),
      },
    },
  },
});
