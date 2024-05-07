import { Base64 } from 'js-base64';
import brotli from './brotli';

// class DecoderStream implements TransformStream<string, Uint8Array> {
//   writable: WritableStream<string>;
//   readable: ReadableStream<Uint8Array>;

//   constructor() {
//     let tail = '';

//     function regulate(chunk: string) {
//       const merged = [tail, chunk].join('');
//       const t = merged.length % 4;

//       if (t > 0) {
//         tail = merged.slice(-t);
//         return merged.slice(0, -t);
//       } else {
//         tail = '';
//         return merged;
//       }
//     }

//     function tramsform(
//       chunk: string,
//       controller: TransformStreamDefaultController
//     ) {
//       try {
//         controller.enqueue(Base64.toUint8Array(regulate(chunk)));
//       } catch (ex) {
//         controller.error(ex);
//       }
//     }

//     function flush(controller: TransformStreamDefaultController) {
//       try {
//         controller.enqueue(Base64.toUint8Array(tail));
//       } catch (ex) {
//         controller.error(ex);
//       }
//     }

//     const s = new TransformStream<string, Uint8Array>({
//       transform: tramsform,
//       flush: flush,
//     });
//     this.writable = s.writable;
//     this.readable = s.readable;
//   }
// }

// class EncoderStream implements TransformStream<Uint8Array, string> {
//   writable: WritableStream<Uint8Array>;
//   readable: ReadableStream<string>;

//   constructor() {
//     let tail: Uint8Array | undefined = undefined;

//     function regulate(chunk: Uint8Array) {
//       const total = tail.length + chunk.length;
//       const t = total % 3;

//       const merged = new Uint8Array(total);
//       if (tail) merged.set(tail);
//       merged.set(chunk, tail.length);
//       if (t > 0) {
//         tail = merged.slice(-t);
//         return merged.slice(0, -t);
//       } else {
//         tail = undefined;
//         return merged;
//       }
//     }

//     function tramsform(
//       chunk: Uint8Array,
//       controller: TransformStreamDefaultController
//     ) {
//       try {
//         controller.enqueue(Base64.fromUint8Array(regulate(chunk), true));
//       } catch (ex) {
//         controller.error(ex);
//       }
//     }

//     function flush(controller: TransformStreamDefaultController) {
//       try {
//         controller.enqueue(Base64.fromUint8Array(tail, true));
//       } catch (ex) {
//         controller.error(ex);
//       }
//     }

//     const s = new TransformStream<Uint8Array, string>({
//       transform: tramsform,
//       flush: flush,
//     });
//     this.writable = s.writable;
//     this.readable = s.readable;
//   }
// }

const base64url = {
  // DecoderStream,
  // EncoderStream,
  decode: Base64.decode,
  encode: (v: string) => Base64.encode(v, true),
  decodeBytes: Base64.toUint8Array,
  encodeBytes: (v: Uint8Array) => Base64.fromUint8Array(v, true),
};

function marshal<T>(object: T) {
  return base64url.encodeBytes(
    brotli.compress(new TextEncoder().encode(JSON.stringify(object))),
  );
}

function unmarshal<T = Object>(str: string) {
  return JSON.parse(
    new TextDecoder().decode(brotli.decompress(base64url.decodeBytes(str))),
  ) as T;
}

export default base64url;
export { marshal, unmarshal };
