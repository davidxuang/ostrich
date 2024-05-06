import { _throw, xmlHttpRequest } from './helper';
import { marshal, unmarshal } from './io/base64url';
import file from './io/file';
import vendor from './vendor';
import { Payload } from './vendor/types';

const [fw, st, site, cat] = vendor.parse(location);

declare global {
  interface JQuery<TElement = HTMLElement> {
    single(): TElement;
  }

  function __import__(url: string): Promise<any>;
}

if ($?.fn?.jquery == undefined) {
  /* @ts-ignore */
  $ = jQuery?.fn?.jquery
    ? jQuery
    : await __import__(
        'https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.slim.min.js',
      );
}

$.fn.extend({
  single<T>(this: JQuery<T>) {
    return this.length === 1 ? this[0] : _throw(this);
  },
});

if (cat === 'source') {
  if (site.extract) {
    await site.extract([st, site], (container, payload) => {
      const params = new URLSearchParams();
      Object.entries(payload).forEach(([k, v]) => {
        params.set(k, marshal(v));
      });
      console.debug(payload);

      vendor.sites
        .filter(
          ([_fw, _st, site]) =>
            site.adapt && !location.hostname.endsWith(site.hostname),
        )
        .forEach(([_fw, st, site], s) => {
          if (s !== 0) {
            container.append(document.createTextNode(' · '));
          }
          $(`<a>`)
            .appendTo(container)
            .text(st)
            .attr('target', '_blank')
            .attr(
              'href',
              `https://${site.hostname}${
                site.entries.upload
              }#ostrich?${params.toString()}`,
            );
        });
    });
  }
} else if (cat === 'target') {
  const psuedo_url = new URL(
    new URL(location.href).hash.substring(1),
    location.origin,
  );

  if (psuedo_url.pathname === '/ostrich') {
    const payload = Object.fromEntries(
      [...psuedo_url.searchParams.entries()].map(([k, v]) => [k, unmarshal(v)]),
    ) as Payload;
    const record = payload.record;
    console.debug(payload);

    const torrent_task = xmlHttpRequest({
      method: 'GET',
      url: payload.torrent,
      responseType: 'arraybuffer',
    }).then((event) => {
      return file.toDataTransfer(
        new File(
          [event.response],
          `${encodeURIComponent(record.group.name)}.torrent`,
          { type: 'application/x-bittorrent' },
        ),
      );
    });

    if (site.adapt) {
      await site.adapt(payload);

      switch (fw) {
        case 'gazelle':
          await torrent_task.then((data) => {
            $<HTMLInputElement>('#file[name=file_input]').single().files =
              data.files;
          });
          break;
        case 'nexusphp':
          await torrent_task.then((data) => {
            $<HTMLInputElement>('#torrent').single().files = data.files;
          });
          break;
      }
    }
  }
}
