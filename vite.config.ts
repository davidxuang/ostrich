import UnpluginTypia from '@typia/unplugin/vite';
import { build, defineConfig, Plugin } from 'vite';
import monkey from 'vite-plugin-monkey';
import _brotli_wasm from './node_modules/brotli-wasm/package.json' with { type: 'json' };
import sites from './src/sites/data';

const polyfill: Plugin = {
  name: 'polyfill',
  enforce: 'pre',
  resolveId(source) {
    if (source === 'path' || source === 'node:path')
      return { id: 'path', external: false };
  },
  load(id) {
    if (id === 'path') {
      return `
        export const sep = '/';
        export function join(...args) {
          return args.filter(Boolean).join('/').replace(/\\/+/g, '/');
        }
        export default { sep, join };
      `;
    }
  },
};

export default defineConfig({
  build: {
    target: 'es2022',
  },
  plugins: [
    {
      name: 'build-parse-torrent', // pre-bundle `parse-torrent`
      enforce: 'pre',
      resolveId(id) {
        if (id === 'parse-torrent') {
          return '\0virtual:parse-torrent';
        }
      },
      async load(id) {
        if (id === '\0virtual:parse-torrent') {
          let result = await build({
            configFile: false,
            build: {
              target: 'es2022',
              minify: false,
              write: false,
              lib: {
                entry: 'node_modules/parse-torrent/index.js',
                formats: ['es'],
                name: 'parse-torrent',
                fileName: () => 'parse-torrent.js',
              },
            },
            plugins: [polyfill],
          });
          result = Array.isArray(result) ? result[0] : result;
          if ('output' in result) {
            const chunk = result.output.find(
              (o) => o.type === 'chunk' && o.isEntry,
            );
            if (chunk && 'code' in chunk) {
              return chunk.code;
            }
          }
        }
      },
    },
    UnpluginTypia(),
    monkey({
      entry: 'src/main.ts',
      build: {
        metaFileName: true,
      },
      userscript: {
        icon: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji/assets/Musical%20score/3D/musical_score_3d.png',
        description: {
          'zh-CN': '适用于Gazelle等架构站点的音乐转种工具',
        },
        namespace: 'https://dvxg.de/',
        match: [
          'https://logs.musichoarders.xyz/',
          ...Object.entries(sites).flatMap(([_fw, framework]) =>
            Object.entries(framework).flatMap(([_st, site]) =>
              Object.entries(site.include).flatMap(([_cat, path]) =>
                typeof path === 'string'
                  ? `${new URL(path, `https://*.${site.hostname}`)}*`
                  : path.map(
                      (p) => `${new URL(p, `https://*.${site.hostname}`)}*`,
                    ),
              ),
            ),
          ),
        ],
        resource: {
          brotli_wasm_bg: `https://cdn.jsdelivr.net/npm/brotli-wasm@${_brotli_wasm.version}/pkg.web/brotli_wasm_bg.wasm`,
        },
        updateURL:
          'https://github.com/davidxuang/ostrich/releases/latest/download/ostrich.meta.js',
        downloadURL:
          'https://github.com/davidxuang/ostrich/releases/latest/download/ostrich.user.js',
      },
    }),
    {
      name: 'hack',
      enforce: 'post',
      transform(code, id, _options) {
        return {
          // strip brotli-wasm comments
          code: id.match(/\.(?:js|cjs|mjs)$/)
            ? code.replace(/^[ \t]*\/\*(.*\n)*?[ \t]*\*\/[ \t]*\n/gm, '')
            : code,
        };
      },
      generateBundle(_options, bundle, _isWrite) {
        Object.entries(bundle).forEach(([f, file]) => {
          if (
            'code' in file &&
            typeof file.code === 'string' &&
            file.fileName.endsWith('.user.js')
          ) {
            // magic __import__
            file.code = file.code.replace('__import__', 'import');
            // clean up mangled names
            const names = [...file.code.matchAll(/__\w+\$1/g)].map((m) => m[0]);
            names
              .filter((v, i, a) => a.indexOf(v) === i)
              .filter(
                (n) =>
                  file.code.match(new RegExp(`${n.slice(0, -2)}(?!\\$)`)) ===
                  null,
              )
              .forEach((n) => {
                file.code = file.code.replaceAll(n, n.slice(0, -2));
              });
          }
        });
      },
    },
  ],
});
