import { execSync } from 'child_process';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const gitCommitHash = process.env.GIT_COMMIT_HASH
  || execSync('git rev-parse HEAD').toString().trim();

export default {
  define: {
    'process.env.GIT_COMMIT_HASH': JSON.stringify(gitCommitHash),
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/jquery/dist/jquery.slim.min.js',
          dest: 'vendor/jquery',
        },
      ],
    }),
  ],
};
