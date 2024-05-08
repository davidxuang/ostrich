import { GM_xmlhttpRequest, GmXhrRequest } from '$';

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
        reject('Aborted');
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
        reject('Timeout');
      },
    });
  });
}

function parseHeaders(value: string) {
  return Object.fromEntries(
    value.split('\r\n').map((line) => {
      var c = line.indexOf(':');
      return [line.substring(0, c), line.substring(c + 1).trimStart()];
    }),
  );
}

function toDataTransfer(file: File | File[]) {
  const data = new DataTransfer();
  if (file instanceof Array) {
    file.forEach((f) => {
      data.items.add(f);
    });
  } else {
    data.items.add(file);
  }
  return data;
}

function unescapeHtml(value: string) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

async function nextMutation(
  target: Node,
  type: MutationRecordType,
  subtree?: boolean,
  timeout?: number,
  sender?: HTMLElement,
) {
  try {
    console.debug(
      `Waiting for mutations with timeout of ${(timeout ??= 30000)}.`,
    );
    return await Promise.race([
      new Promise<never>((_, reject) => {
        setTimeout(() => reject('Timeout'), timeout);
      }),
      new Promise<void>((resolve) => {
        const observer = new MutationObserver((mutations) => {
          if (mutations.some((m) => m.type === type)) {
            observer.disconnect();
            resolve();
          }
        });

        observer.observe(target, { [type]: true, subtree: subtree });
        sender?.dispatchEvent(new Event('change'));
      }),
    ]);
  } catch (reason) {
    console.warn(reason);
  }
}

function onDescendantAdded(
  target: Node,
  subtree: boolean,
  callback: (descendant: Node) => void,
) {
  new MutationObserver((mutations) => {
    mutations
      .filter((m) => m.type === 'childList' && m.addedNodes.length)
      .flatMap((m) => [...m.addedNodes])
      .forEach(callback);
  }).observe(target, { childList: true, subtree: subtree });
}

const _reSplit = /^((?:\p{L}|\p{P}|\s)+)\s+[（()]((?:\p{L}|\p{P}|\s)+)[)）]$/u;

function trySelect(select: HTMLSelectElement, name: string) {
  name = name.toLowerCase();
  let options = [...select.options]
    .map((option) => ({
      name: option.textContent?.toLowerCase(),
      key: option.value,
    }))
    .filter((p) => p.name);
  let seq = options.filter((p) => p.name === name);
  if (seq.length) {
    return seq.length === 1 && (select.value = seq.at(0)!.key);
  }
  seq = options.filter(
    (p) =>
      (p.name?.indexOf(name) ?? NaN) >= 0 ||
      (p.name && (name?.indexOf(p.name) ?? NaN) >= 0),
  );
  if (seq.length) {
    return seq.length === 1 && (select.value = seq.at(0)!.key);
  }
  const match = name.match(_reSplit);
  const names = match ? [match[1], match[2]] : [name];
  options = options
    .flatMap((p) => {
      const m = p.name!.match(_reSplit);
      return m
        ? [
            { name: m[1], key: p.key },
            { name: m[2], key: p.key },
          ]
        : p;
    })
    .filter((p) => p.name);
  seq = options.filter((p) =>
    names.some(
      (n) =>
        (p.name?.indexOf(n) ?? NaN) >= 0 ||
        (p.name && (n?.indexOf(p.name) ?? NaN) >= 0),
    ),
  );
  return seq.length === 1 && (select.value = seq.at(0)!.key);
}

export {
  xmlHttpRequest,
  parseHeaders,
  toDataTransfer,
  unescapeHtml,
  nextMutation,
  onDescendantAdded,
  trySelect,
};
