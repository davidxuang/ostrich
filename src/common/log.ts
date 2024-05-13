import { LogCollection } from '../sites/types';
import base64url from './base64url';

const _isBigEndian = (() => {
  const u32 = new Uint32Array([0x574f5244]);
  const u8 = new Uint8Array(u32.buffer);

  switch (u8[0]) {
    case 0x57:
      return true;
    case 0x44:
      return false;
    default:
      throw u8;
  }
})();

const _bomUtf16LE = new Uint8Array([0xff, 0xfe]);

function toFile(logs: LogCollection, title: string) {
  if (logs.recovered) {
    console.warn(logs);
  }
  return logs.encoded
    ? logs.encoded.map(
        (log, l) =>
          new File(
            [base64url.decodeBytes(log)],
            logs.encoded.length > 1 ? `${title}.${l + 1}.log` : `${title}.log`,
            {
              type: 'text/plain',
            },
          ),
      )
    : logs.plain.map((log, l) => {
        log = log.trim();
        const name =
          logs.plain.length > 1 ? `${title}.${l + 1}.log` : `${title}.log`;

        if (log.startsWith('Exact Audio Copy')) {
          const array = new Uint16Array(log.length);
          let c = log.length;
          while (c >= 0) {
            const ch = log.charCodeAt(--c);
            array[c] = ch;
          }
          if (_isBigEndian) {
            c = array.length;
            while (c >= 0) {
              const ch = array[--c];
              array[c] = (ch >> 8) + ((ch & 0xff) << 8);
            }
          }
          return new File([_bomUtf16LE, array.buffer], name, {
            type: 'text/plain',
          });
        } else if (log.startsWith('X Lossless Decoder')) {
          return new File([new TextEncoder().encode(`${log}\n`).buffer], name, {
            type: 'text/plain',
          });
        } else {
          throw log;
        }
      });
}

const utf8 = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
const utf16BE = new TextDecoder('utf-16be', { ignoreBOM: true, fatal: true });
const utf16LE = new TextDecoder('utf-16le', { ignoreBOM: true, fatal: true });

function toString(logs: LogCollection) {
  return logs.encoded
    ? logs.encoded.map((log) => {
        const array = base64url.decodeBytes(log);
        if (array[0] === 0xff && array[1] === 0xfe) {
          return utf16LE.decode(array);
        } else if (array[0] === 0xff && array[1] === 0xfe) {
          return utf16BE.decode(array);
        } else {
          return utf8.decode(array);
        }
      })
    : logs.plain;
}

export default { toFile, toString };
