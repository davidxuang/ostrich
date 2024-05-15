import base64url, { marshal, unmarshal } from './common/base64url';
import { toDataTransfer, xmlHttpRequest } from './common/html';
import { _throw } from './common/throw';
import sites, { parseSites } from './sites';
import { Payload } from './sites/types';

const [fw, st, site, cat] = parseSites(location);

declare global {
  interface JQuery<TElement = HTMLElement> {
    single(): TElement;
  }

  function __import__(url: string): Promise<any>;
}

if (cat === 'validate') {
  const psuedo_url = new URL(
    new URL(location.href).hash.substring(1),
    location.origin,
  );

  if (psuedo_url.pathname === '/ostrich') {
    const input = document.querySelector<HTMLInputElement>('#cursorfiles');
    if (input) {
      input.files = toDataTransfer(
        new File(
          [base64url.decodeBytes(psuedo_url.hash.slice(1))],
          'text.log',
          {
            type: 'text/plain',
          },
        ),
      ).files;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      input.dispatchEvent(new Event('change'));
    }
  }
} else {
  // jQuery
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
      await site.extract([st, site], async (container, payload) => {
        console.debug(payload);

        const params = new URLSearchParams();
        Object.entries(payload).forEach(([k, v]) => {
          params.set(k, marshal(v));
        });
        const p = params.toString();

        Object.entries(sites)
          .flatMap(([_fw, framework]) => Object.entries(framework))
          .filter(
            ([_st, site]) =>
              site.adapt && !location.hostname.endsWith(site.hostname),
          )
          .forEach(([st, site], s) => {
            if (s !== 0) {
              container.append(document.createTextNode(' · '));
            }
            $(`<a>`)
              .appendTo(container)
              .text(st)
              .attr('target', '_blank')
              .attr(
                'href',
                `https://${site.hostname}${site.include.target}#ostrich?${p}`,
              );
          });
      });
    }
  } else if (cat === 'target') {
    const psuedo_url = new URL(
      new URL(location.href).hash.substring(1),
      location.origin,
    );

    if (site.validate) {
      await site.validate(async (container, selector) => {
        const anchor = $('<a>')
          .appendTo(container.append($('<br>')))
          .text('Validate')
          .attr('href', '#_ostrich')
          .single();
        anchor.onclick = async () => {
          await Promise.all(
            $<HTMLInputElement>(selector)
              .toArray()
              .filter((input) => input.files)
              .flatMap((input) => [...input.files!])
              .map(async (file) => {
                window.open(
                  `https://logs.musichoarders.xyz#ostrich#${base64url.encodeBytes(new Uint8Array(await file.arrayBuffer()))}`,
                  '_blank',
                );
              }),
          );
        };
      });
    }

    if (psuedo_url.pathname === '/ostrich') {
      const payload = Object.fromEntries(
        [...psuedo_url.searchParams.entries()].map(([k, v]) => [
          k,
          unmarshal(v),
        ]),
      ) as Payload;
      const record = payload.record;
      console.debug(payload);

      const torrent_task = xmlHttpRequest({
        method: 'GET',
        url: payload.torrent,
        responseType: 'arraybuffer',
      }).then((event) => {
        return toDataTransfer(
          new File(
            [event.response],
            `${encodeURIComponent(record.group.name)}.torrent`,
            { type: 'application/x-bittorrent' },
          ),
        );
      });

      if (site.adapt) {
        await site.adapt(payload, async (container, input, selections) => {
          selections = selections.filter((s) => s);
          if (selections.length >= 1) {
            input.single().value = selections[0];
            if (selections.length > 1) {
              const anchor = $('<a>')
                .appendTo(container.append($('<br>')))
                .text('Toggle')
                .attr('href', '#_ostrich')
                .single();
              anchor.onclick = () => {
                selections.push(selections.shift()!);
                input.single().value = selections[0];
              };
            }
          }
        });

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
}
