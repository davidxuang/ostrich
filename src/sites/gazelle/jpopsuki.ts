import { trySelect } from '../../common/html';
import { PartialSite } from '../types';
import { adaptUniversalCore, getGazelle } from '.';
import bbcode from './bbcode';

export default function (def: PartialSite) {
  def.lang = 'native';
  def.validate = undefined;

  def.extract = async (site, callback) => {
    $('.group_torrent:not(.edition)').each((_, header) => {
      let initialised = false;
      let busy = false;

      const details = header.nextElementSibling;
      if (details?.classList?.contains('pad') !== true) return;

      const header_buttons = $(header).find<HTMLSpanElement>('> td > span');
      const repost_button = $('<a>RE</a>').attr('href', '#repost')[0];

      header_buttons
        .find<HTMLAnchorElement>('> a')
        .last()
        .after(document.createTextNode(' | '), repost_button);

      repost_button.onclick = async () => {
        const torrent_url = header_buttons
          .children()
          .filter((_, e) => e instanceof HTMLAnchorElement)
          .map((_, e) => new URL((e as HTMLAnchorElement).href, location.href))
          .filter((_, url) => url.searchParams.get('action') === 'download')[0];

        const links_container = $(details)
          .removeClass('hide')
          .find('blockquote + blockquote')
          .first();

        if (!links_container.hasClass('ostrich')) {
          links_container.addClass('ostrich').append($('<br>'), $('<br>'));
        }

        if (initialised || busy) return;
        busy = true;

        try {
          const links = $(`<span>`)
            .text('Repost to...')
            .appendTo(links_container);

          const h2 = $('h2').single();
          const h3 = $('h3').get(0)!;
          const header_info = header_buttons[0].nextElementSibling;

          const type =
            h2.firstChild?.textContent?.match(/\[([^\]]+)\]/)?.[1] ?? '';
          const latin_artist = h2.querySelector('a')?.textContent?.trim() ?? '';
          const [, latin_title = '', date = ''] =
            h2.lastChild?.textContent
              ?.trim()
              ?.match(/^-\s*(.+?)\s*\[([\d.]+)\]$/) ?? [];

          let native_artist = h3.querySelector('a')?.textContent?.trim();
          let [, native_title = undefined] =
            h3.lastChild?.textContent?.trim().match(/^-\s*(.+?)\s*\)$/) ?? [];

          if (native_artist == latin_artist) native_artist = undefined;
          if (native_title == latin_title) native_title = undefined;

          const [, format = '', encoding = '', media = ''] =
            header_info?.textContent?.match(
              /(\w.+?)\s*\/\s*(\w.+?)\s*\/\s*(\w.+?)\s*$/,
            ) ?? [];

          const record = {
            site: site.name,
            group: {
              type: type,
              name: native_title
                ? {
                    latin: latin_title,
                    native: native_title,
                  }
                : latin_title,
              artists: [
                native_artist
                  ? {
                      latin: latin_artist,
                      native: native_artist,
                    }
                  : latin_artist,
              ],
              guests: $<HTMLUListElement>(
                '.box:has(.head:contains("Contributing Artists")) .stats.nobullet',
              )
                .first()
                .find<HTMLAnchorElement>('li a:first-of-type')
                .toArray()
                .map((a) => a.textContent)
                .filter((t) => t !== undefined),
              composers: [],
              conductor: [],
              producer: [],
              dj: [],
              remixer: [],
              label: '',
              catalogue: '',
              year: parseInt(date.slice(0, 4)),
              image:
                $<HTMLAnchorElement>('.sidebar a:has(img)').get(0)?.href ?? '',
              description_tree: bbcode.fromHTML(
                $('.torrent_table + .box .body').single(),
                new URL(location.href),
              ),
            },
            item: {
              media: media,
              encoding: encoding,
              format: format,
              scene: false,
              uploaded_by: '',
              description_tree:
                $(details)
                  .find('blockquote + blockquote + blockquote')
                  .first()
                  .map((_, bq) => bbcode.fromHTML(bq, new URL(location.href)))
                  .toArray() ?? [],
            },
          };
          await callback(links, {
            torrent: torrent_url.toString(),
            record: record,
          });
          initialised = true;
        } finally {
          busy = false;
        }
      };
    });
  };

  def.adapt = async (site, payload, callback) => {
    const record = payload.record;
    const gazelle = await getGazelle(site, payload);

    trySelect($<HTMLSelectElement>('#categories').single(), record.group.type);

    const artist = record.group.artists[0];
    if (typeof artist === 'string') {
      $<HTMLInputElement>('#artist').single().value = artist;
    } else {
      $<HTMLInputElement>('#artist').single().value = artist.latin;
      $<HTMLInputElement>('#artistjp').single().value = artist.native;
    }
    if (typeof record.group.name === 'string') {
      $<HTMLInputElement>('#title').single().value = record.group.name;
    } else {
      $<HTMLInputElement>('#title').single().value = record.group.name.latin;
      $<HTMLInputElement>('#titlejp').single().value = record.group.name.native;
    }

    $<HTMLInputElement>('#releasedate').single().value =
      record.group.year?.toString() ?? '';
    if (
      record.item.name ||
      (record.item.year && record.item.year !== record.group.year)
    ) {
      $<HTMLInputElement>('#remaster').single().click();

      // avoid racing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      $<HTMLInputElement>('#remaster_year').single().value =
        record.item.year?.toString() ?? '';
      $<HTMLInputElement>('#remaster_title').single().value =
        record.item.name ?? '';
    }

    await adaptUniversalCore(record, callback);

    if (gazelle) {
      $<HTMLInputElement>('#tags').single().value =
        gazelle.group.tags.join(',');
    }
  };
}
