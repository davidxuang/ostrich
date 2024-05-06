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

const _bomUtf16Le = new Uint8Array([0xff, 0xfe]);

function fromLogs(logs: string[], title: string) {
  return logs.map((log, l) => {
    log = log.trim();
    const name = logs.length > 1 ? `${title}.${l + 1}.log` : `${title}.log`;
    if (log.startsWith('Exact Audio Copy')) {
      log = log.replace(/(?<!\r)\n/g, '\r\n');
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
      return new File([_bomUtf16Le.buffer, array.buffer], name, {
        type: 'text/plain',
      });
    } else if (log.startsWith('X Lossless Decoder')) {
      log = log.replace('\r\n', '\n');
      return new File([new TextEncoder().encode(log).buffer], name, {
        type: 'text/plain',
      });
    } else {
      throw log;
    }
  });
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

export default {
  fromLogs,
  toDataTransfer,
};
