function parseHeaders(value: string) {
  return Object.fromEntries(
    value.split('\r\n').map((line) => {
      var c = line.indexOf(':');
      return [line.substring(0, c), line.substring(c + 1).trimStart()];
    }),
  );
}

function unescape(value: string) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

async function changed(
  node: Node,
  type: MutationRecordType,
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

        observer.observe(node, { [type]: true });
        sender?.dispatchEvent(new Event('change'));
      }),
    ]);
  } catch (reason) {
    console.warn(reason);
  }
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

export default {
  parseHeaders,
  unescape,
  changed,
  trySelect,
};
