import { viteStaticCopy } from 'vite-plugin-static-copy';

export default {
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
