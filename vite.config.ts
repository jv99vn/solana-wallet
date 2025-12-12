import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        inpage: resolve(__dirname, 'src/content/inpage.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (['background', 'content', 'inpage'].includes(chunkInfo.name)) {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Keep background, content, and inpage as separate files
          if (id.includes('background/index') ||
              id.includes('content/index') ||
              id.includes('content/inpage')) {
            return undefined;
          }
          // Bundle common dependencies
          if (id.includes('node_modules')) {
            if (id.includes('@solana')) {
              return 'vendor-solana';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    copyPublicDir: true,
  },
  publicDir: 'public',
});
