/// <reference types="vitest/config" />
import { resolve } from 'path';
import { execSync } from 'child_process';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const gitCommitHash = process.env.GIT_COMMIT_HASH
  || execSync('git rev-parse HEAD').toString().trim();

export default defineConfig({
  appType: 'mpa', // disable history fallback
  define: {
    'process.env.GIT_COMMIT_HASH': JSON.stringify(gitCommitHash),
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/jquery/dist/jquery.slim.min.js',
          dest: 'vendor/jquery',
        },
        {
          src: 'config/*.yml',
          dest: 'config',
        }
      ],
    }),
  ],
});
