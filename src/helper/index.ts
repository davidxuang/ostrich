import { GM_xmlhttpRequest, GmXhrRequest } from '$';

function _throw(ex: any): never {
  throw ex;
}

type ResponseTypes = keyof {
  text: string;
  json: any;
  arraybuffer: ArrayBuffer;
  blob: Blob;
  document: Document;
  stream: ReadableStream<Uint8Array>;
};

function xmlHttpRequest<TContext, TResponse extends ResponseTypes = 'text'>(
  details: GmXhrRequest<TContext, TResponse>,
) {
  return new Promise<
    Parameters<
      Exclude<GmXhrRequest<TContext, TResponse>['onload'], undefined>
    >[0]
  >((resolve, reject) => {
    GM_xmlhttpRequest<TContext, TResponse>({
      ...details,
      onabort() {
        reject('aborted');
      },
      onload(event) {
        if (event.status !== 200) {
          reject(event.statusText);
        }
        resolve(event);
      },
      onerror(event) {
        reject(event);
      },
      ontimeout() {
        reject('timeout');
      },
    });
  });
}

export { _throw, xmlHttpRequest };
