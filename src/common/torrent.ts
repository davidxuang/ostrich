import parseTorrent, { toTorrentFile } from 'parse-torrent';

export async function patch(torrent: ArrayBufferView, source: string) {
  const record = (await parseTorrent(torrent)) as {
    announce?: string[];
    comment?: string;
    info: {
      private?: boolean;
      source?: string | Uint8Array;
    };
  };
  record.announce = [];
  record.comment = '';
  record.info.private = true;
  record.info.source = source;
  return toTorrentFile(record);
}
