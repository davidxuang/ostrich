import { GM_getResourceURL } from '$';
import { BrotliWasmType } from 'brotli-wasm';
import * as _brotli from 'brotli-wasm/pkg.web/brotli_wasm';
import { Base64 } from 'js-base64';

const brotli = await (async () => {
  const url = GM_getResourceURL('brotli_wasm_bg');
  await _brotli.default(
    Base64.toUint8Array(url.slice(url.indexOf(','))).buffer,
  );
  return _brotli as BrotliWasmType;
})();

export default brotli;
