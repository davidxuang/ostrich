import bb from '../../bbcode';
import { _throw, xmlHttpRequest } from '../../helper';
import file from '../../io/file';
import html from '../../io/html';
import meta from '../primitive';
import { FromCallback, Record, PartialSite, Site } from '../types';
import bbcode from './bbcode';
import dic from './dic';
import ops from './ops';
import redacted from './redacted';

type Artist = {
  id: number;
  name: string;
};

type Group = {
  id: number;
  bbBody?: string;
  catalogueNumber: string;
  musicInfo: {
    artists: Artist[];
    composers: Artist[];
    conductor: Artist[];
    dj: Artist[];
    producer: Artist[];
    remixedBy: Artist[];
    with: Artist[];
  };
  name: string;
  recordLabel: string;
  tags: string[];
  time: string;
  wikiBody: string;
  wikiImage: string;
  year: number;
  releaseType: number;
};
type Torrent = {
  id: number;
  description: string;
  encoding: string;
  format: string;
  hasLog: boolean;
  logScore: number;
  media: string;
  remastered: boolean;
  remasterCatalogueNumber: string;
  remasterRecordLabel: string;
  remasterTitle: string;
  remasterYear: number;
  scene: boolean;
  time: string;
  userId: number;
  username: string;
};

type Reseponse<T> =
  | {
      status: 'success';
      response: T;
    }
  | {
      status: 'failure';
      error: string;
    };

type TorrentEntry = {
  group: Group;
  torrent: Torrent;
};
type TorrentResponse = Reseponse<TorrentEntry>;

function _toRecord(
  d: TorrentEntry,
  logs: string[],
  site: string,
  base: URL,
): Record {
  return {
    site: site,
    group: {
      name: html.unescape(d.group.name),
      artists: d.group.musicInfo.artists.map((a) => a.name),
      guests: d.group.musicInfo.with.map((a) => a.name),
      composers: d.group.musicInfo.composers.map((a) => a.name),
      conductor: d.group.musicInfo.conductor.map((a) => a.name),
      producer: d.group.musicInfo.producer.map((a) => a.name),
      dj: d.group.musicInfo.dj.map((a) => a.name),
      remixer: d.group.musicInfo.remixedBy.map((a) => a.name),
      description: d.group.bbBody
        ? html.unescape(d.group.bbBody)
        : bb.fromHTML(
            new DOMParser().parseFromString(
              `<html><body>${d.group.wikiBody}</body></html>`,
              'text/html',
            ).body,
            base,
          ),
      label: html.unescape(d.group.recordLabel),
      catalogue: html.unescape(d.group.catalogueNumber),
      year: d.group.year,
      image: d.group.wikiImage,
    },
    item: {
      name: html.unescape(d.torrent.remasterTitle),
      description: html.unescape(d.torrent.description),
      label: html.unescape(d.torrent.remasterRecordLabel),
      catalogue: html.unescape(d.torrent.remasterCatalogueNumber),
      year: d.torrent.remasterYear,
      media: d.torrent.media,
      encoding: d.torrent.encoding,
      format: d.torrent.format,
      scene: d.torrent.scene,
      uploaded_by: d.torrent.username,
      logs: logs,
    },
  };
}

async function extract([st, site]: [string, Site], callback: FromCallback) {
  $('tr.torrent_row, .group_torrent:not(.edition)').each((_, header) => {
    let initialised = false;
    let busy = false;

    const header_buttons = $(header).find(
      '.torrent_action_buttons, .td_info > span',
    );
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
      const torrent_id = torrent_url.searchParams.get('id');
      let links_container: JQuery;
      if (header.id) {
        // expand hidden
        links_container = $(`#torrent_${torrent_id}`)
          .removeClass('hidden')
          .find('blockquote')
          .first();

        if (!links_container.hasClass('ostrich')) {
          links_container.addClass('ostrich').append($('<br>'), $('<br>'));
        }
      } else {
        links_container = $(header).next();
        if (
          links_container.length === 0 ||
          !links_container.hasClass('torrentdetails')
        ) {
          links_container = $(`<td>`)
            .attr('colspan', 9)
            .appendTo(
              $(`<tr>`)
                .addClass('torrentdetails')
                .addClass('pad')
                .insertAfter(header),
            );
        }
      }

      if (initialised || busy) {
        return;
      }
      busy = true;

      try {
        // links container
        const links = $(`<span>`)
          .text('Repost to...')
          .appendTo(links_container);

        // get log
        const log_task = xmlHttpRequest({
          method: 'GET',
          url: `${site.entries.download}?action=${
            site.actions?.log ?? 'viewlog'
          }&torrentid=${torrent_id}`,
          responseType: 'document',
        }).then((event) => {
          return $(event.response?.body)
            .find('pre')
            .map((_, pre) => pre.textContent)
            .toArray();
        });

        // get metadata
        const meta_url = new URL(
          `/ajax.php?action=torrent&id=${torrent_id}`,
          location.href,
        ).toString();
        const meta = await xmlHttpRequest({
          method: 'GET',
          url: meta_url,
          responseType: 'json',
        }).then(async (event) => {
          let r = event.response as TorrentResponse;
          if (r.status !== 'success') {
            throw r.error;
          }

          return _toRecord(
            r.response,
            await log_task,
            st,
            new URL(location.href),
          );
        });

        // create links
        links.text('Repost to: ');
        callback(links, {
          torrent: torrent_url.toString(),
          record: meta,
          gazelle: meta_url,
        });
        initialised = true;
      } finally {
        busy = false;
      }
    };
  });
}

async function getJson<T extends 'arraybuffer' | 'json'>(
  gazelle: string,
  type: T,
) {
  return xmlHttpRequest({
    method: 'GET',
    url: gazelle,
    responseType: type,
  }).then((event) => event.response);
}

async function adaptJson(gazelle: string) {
  const json_input = $<HTMLInputElement>('#torrent-json-file').single();
  json_input.files = file.toDataTransfer(
    new File([await getJson(gazelle, 'arraybuffer')], 'gazelle.json', {
      type: 'application/json',
    }),
  ).files;

  await html.changed(
    $('#dynamic_form').single(),
    'childList',
    undefined,
    json_input,
  );
}

function adaptReleaseType(
  select: HTMLSelectElement,
  value: string,
  source: keyof typeof meta.gazelle.sites,
  target: keyof typeof meta.gazelle.sites,
) {
  const name = Object.entries(meta.gazelle.sites[source].selects.releaseType)
    .find(([k, _v]) => k === value)?.[1]
    ?.toLowerCase();
  if (!name) return;
  const mapped = Object.entries(
    meta.gazelle.sites[target].selects.releaseType,
  ).find(([_, v]) => v.toLowerCase() === name)?.[0];
  if (mapped === undefined) return;
  select.value = mapped;
}

async function adaptUniversal(record: Record) {
  $<HTMLInputElement>('#title').single().value = record.group.name;
  $<HTMLInputElement>('#year').single().value = record.group.year.toString();

  $<HTMLInputElement>('#remaster_year').single().value =
    record.item.year?.toString() ?? '';
  $<HTMLInputElement>('#remaster_title').single().value =
    record.item.name ?? '';
  $<HTMLInputElement>('#remaster_record_label').single().value =
    record.item.label ?? '';
  $<HTMLInputElement>('#remaster_catalogue_number').single().value =
    record.item.catalogue ?? '';

  const format_select = $<HTMLSelectElement>('#format').single();
  html.trySelect(format_select, record.item.format);
  $(format_select).trigger('change');

  const encoding_select = $<HTMLSelectElement>('#bitrate').single();
  if (!html.trySelect(encoding_select, record.item.encoding)) {
    html.trySelect(encoding_select, 'Other');
    $(encoding_select).trigger('change');
    $<HTMLInputElement>('#other_bitrate').single().value = record.item.encoding;
  }

  html.trySelect($<HTMLSelectElement>('#media').single(), record.item.media);

  $<HTMLInputElement>('#image').single().value = record.group.image;
  $<HTMLTextAreaElement>('#album_desc').single().value =
    typeof record.group.description == 'string'
      ? record.group.description
      : bbcode.dump(record.group.description);
  $<HTMLTextAreaElement>('#release_desc').single().value =
    record.item.description;
}

function adaptLogs(logs: string[], name: string) {
  $<HTMLInputElement>('#file[name^=logfiles]').single().files =
    file.toDataTransfer(file.fromLogs(logs, name)).files;
}

export { getJson, adaptJson, adaptReleaseType, adaptUniversal, adaptLogs };
export type { Artist, Group, Torrent, TorrentResponse };
export default function (framework: typeof meta.gazelle) {
  (
    Object.entries(framework.sites) as [
      keyof typeof framework.sites,
      PartialSite,
    ][]
  ).forEach(([st, site]) => {
    site['extract'] = extract;
    switch (st) {
      case 'DIC':
        return dic(site);
      case 'OPS':
        return ops(site);
      case 'Redacted':
        return redacted(site);
    }
  });
}
