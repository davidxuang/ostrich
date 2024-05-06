import typescript from 'rollup-plugin-typescript2';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import frameworks, { getFullSites } from './src/vendor/primitive';

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...typescript(),
    },
    (() => {
      const reExt = /\.(?:js|cjs|mjs)$/;
      const reBlk = /^[ \t]*\/\*(.*\n)*?[ \t]*\*\/[ \t]*\n/gm;
      return {
        name: 'strip-block-comments',
        transform(code, id, _options) {
          return {
            code: id.match(reExt) ? code.replace(reBlk, '') : code,
          };
        },
      };
    })(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji/assets/Musical%20score/3D/musical_score_3d.png',
        namespace: 'https://dvxg.de/',
        match: getFullSites(frameworks).flatMap(([fw, st, site]) =>
          Object.entries(site.matches).flatMap(([cat, path]) =>
            typeof path === 'string'
              ? `${new URL(path, `https://*.${site.hostname}`)}*`
              : path.map((p) => `${new URL(p, `https://*.${site.hostname}`)}*`),
          ),
        ),
        resource: {
          brotli_wasm_bg:
            'https://cdn.jsdelivr.net/npm/brotli-wasm@3/pkg.web/brotli_wasm_bg.wasm',
        },
      },
    }),
    {
      name: '',
      enforce: 'post',
      generateBundle(_options, bundle, _isWrite) {
        Object.entries(bundle).forEach(([f, file]) => {
          if (
            typeof file['code'] === 'string' &&
            file.fileName.endsWith('.user.js')
          ) {
            console.debug(file['code'].length);
            file['code'] = file['code'].replace('__import__', 'import');
            console.debug(file['code'].length);
          }
        });
      },
    },
  ],
});
