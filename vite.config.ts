import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { zipPlugin } from './scripts/plugins/vite-plugin-zip';
import { manifestPlugin } from './scripts/plugins/vite-plugin-manifest';

export default defineConfig({
  plugins: [
    react(),
    manifestPlugin(),
    zipPlugin(),
  ],
  base: './',
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/entry/content.tsx'),
        background: resolve(__dirname, 'src/entry/background.ts'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    emptyOutDir: true,
  },
});
