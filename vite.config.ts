import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Pakai versi bundled xlsx agar esbuild tidak crash saat parse xlsx.mjs
        'xlsx': path.resolve(__dirname, 'node_modules/xlsx/dist/xlsx.full.min.js'),
      },
    },
    // Paksa Vite pra-bundle xlsx lewat file min.js, bukan ESM (xlsx.mjs incompatible dengan esbuild)
    optimizeDeps: {
      include: ['xlsx'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
