import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { zipPlugin } from './scripts/plugins/vite-plugin-zip';
import { manifestPlugin } from './scripts/plugins/vite-plugin-manifest';

function mv3SafeSetImmediatePlugin(): Plugin {
  const unsafeSetImmediateCallbackPattern =
    /typeof ([A-Za-z_$][\w$]*)!=`function`&&\(\1=Function\(``\+\1\)\);/g;
  const safeSetImmediateCallbackCheck =
    'typeof $1!=`function`&&(()=>{throw new TypeError(`setImmediate callback must be a function`)})();';

  return {
    name: 'mv3-safe-setimmediate',
    renderChunk(code) {
      const sanitized = code.replace(
        unsafeSetImmediateCallbackPattern,
        safeSetImmediateCallbackCheck,
      );

      return sanitized === code ? null : { code: sanitized, map: null };
    },
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        chunk.code = chunk.code.replace(
          unsafeSetImmediateCallbackPattern,
          safeSetImmediateCallbackCheck,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    mv3SafeSetImmediatePlugin(),
    manifestPlugin(),
    zipPlugin(),
  ],
  base: './',
  resolve: {
    alias: {
      setimmediate: resolve(__dirname, 'src/shims/setimmediate.ts'),
    },
  },
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
