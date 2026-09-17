/// <reference types="vitest/config" />
import { resolve } from 'path';
import { execSync } from 'child_process';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const gitCommitHash = process.env.GIT_COMMIT_HASH
  || execSync('git rev-parse HEAD').toString().trim();

// Query string appended to the dev server URLs. Override for a single run with
// e.g. `HQ_DEV_QUERY='hdSim=true&story=evacuate' npm run dev`, or disable it
// with `HQ_DEV_QUERY=`.
const devQuery = process.env.HQ_DEV_QUERY ?? 'log=debug&hdSim=true&lang=en&strict=true';

/**
 * Append a query string to the URLs the dev server prints, so the link shown on
 * startup (and the one `o + enter` opens) is ready for development.
 *
 * @param {string} query  Query string, without the leading `?`
 * @return {import('vite').Plugin}
 */
function devQueryString(query) {
  const withQuery = (url) => url + (url.includes('?') ? '&' : '?') + query;

  return {
    name: 'holo-quest:dev-query-string',
    apply: 'serve',
    configureServer(server) {
      if (!query) return;
      const { printUrls } = server;
      // Vite builds a fresh `resolvedUrls` on every listen, but prints from the
      // same one whenever `u + enter` is pressed, so only rewrite it once.
      let rewritten = null;
      // eslint-disable-next-line no-param-reassign
      server.printUrls = () => {
        const urls = server.resolvedUrls;
        if (urls && urls !== rewritten) {
          rewritten = urls;
          urls.local = urls.local.map(withQuery);
          urls.network = urls.network.map(withQuery);
        }
        printUrls.call(server);
      };
    },
  };
}

export default defineConfig({
  base: './',
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
    devQueryString(devQuery),
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: 'config/*.yml',
          dest: 'config',
        },
        {
          src: 'stories/*',
          dest: 'stories',
        },
      ],
    }),
  ],
});
