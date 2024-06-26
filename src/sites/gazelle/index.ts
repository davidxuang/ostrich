import typia from 'typia';
import { dumpDescriptions } from '..';
import base64url from '../../common/base64url';
import bb from '../../common/bbcode';
import {
  nextMutation,
  toDataTransfer,
  trySelect,
  unescapeHtml,
  xmlHttpRequest,
  onDescendantAdded,
} from '../../common/html';
import log from '../../common/log';
import { _throw } from '../../common/throw';
import sites from '../data';
import {
  ExtractCallback,
  Record,
  PartialSite,
  Site,
  LogCollection,
  ValidateCallback,
  AdaptCallback,
} from '../types';
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
  bbBody?: string; // Redacted
  wikiBBcode?: string; // OPS
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
  e: TorrentEntry,
  site: string,
  base: URL,
  logs: LogCollection | undefined,
): Record {
  const group_bb = e.group.bbBody ?? e.group.wikiBBcode;
  return {
    site: site,
    group: {
      name: unescapeHtml(e.group.name),
      artists: e.group.musicInfo.artists.map((a) => a.name),
      guests: e.group.musicInfo.with.map((a) => a.name),
      composers: e.group.musicInfo.composers.map((a) => a.name),
      conductor: e.group.musicInfo.conductor.map((a) => a.name),
      producer: e.group.musicInfo.producer.map((a) => a.name),
      dj: e.group.musicInfo.dj.map((a) => a.name),
      remixer: e.group.musicInfo.remixedBy.map((a) => a.name),
      description: group_bb ? unescapeHtml(group_bb) : undefined,
      description_tree: bb.fromHTML(
        new DOMParser().parseFromString(
          `<html><body>${e.group.wikiBody}</body></html>`,
          'text/html',
        ).body,
        base,
      ),
      label: unescapeHtml(e.group.recordLabel),
      catalogue: unescapeHtml(e.group.catalogueNumber),
      year: e.group.year,
      image: e.group.wikiImage,
    },
    item: {
      name: unescapeHtml(e.torrent.remasterTitle),
      description: unescapeHtml(e.torrent.description),
      label: unescapeHtml(e.torrent.remasterRecordLabel),
      catalogue: unescapeHtml(e.torrent.remasterCatalogueNumber),
      year: e.torrent.remasterYear,
      media: e.torrent.media,
      encoding: e.torrent.encoding,
      format: e.torrent.format,
      scene: e.torrent.scene,
      uploaded_by: e.torrent.username,
      logs: logs,
    },
  };
}

function _mostCommon<T extends string | number>(array: T[], invalid: T) {
  let compare = 0;
  let common = invalid;
  array.reduce<{ [key in T]: number }>(
    (acc, val) => {
      if (val in acc) {
        acc[val]++;
      } else {
        acc[val] = 1;
      }
      if (acc[val] > compare) {
        compare = acc[val];
        common = val;
      }
      return acc;
    },
    {} as { [key in T]: number },
  );
  return common;
}

function _recoverLog(log: string) {
  if (
    log.startsWith('Exact Audio Copy') ||
    log.startsWith('EAC extraction logfile')
  ) {
    return log
      .replace('\r\n', '\n')
      .replace(
        /^Used [Dd]rive( +: .+?)(?: \(not found in database\))?$/m,
        'Used drive$1',
      )
      .replace(/Additional command line options +: .+(\n.+)+/m, (sub) =>
        sub.replace('\n', ''),
      )
      .split('\n\n')
      .map((block) => {
        let lines = block.split('\n');
        if (
          lines.some((line) =>
            line.startsWith('Delete leading and trailing silent blocks'),
          )
        ) {
          // find most common colon position
          const common_pos = _mostCommon(
            lines.map((line) => line.indexOf(':')),
            -1,
          );
          lines = lines.map((line) => {
            const pos = line.indexOf(':');
            return line.slice(0, pos).padEnd(common_pos) + line.slice(pos);
          });
        }
        return lines.join('\n');
      })
      .join('\n\n')
      .replace('\n', '\r\n');
  } else if (
    log.startsWith('X Lossless Decoder') ||
    log.startsWith('XLD extraction logfile')
  ) {
    return log
      .replace('\r\n', '\n')
      .replace(
        /^Used [Dd]rive( +: .+?)(?: \(not found in database\))?$/m,
        'Used drive$1',
      )
      .replace(/(Absolute +\| +Relative +\| +Confidence)$/m, '$1 ')
      .replace(/(?<!\n)\n(\n\nAccurateRip)/, '$1');
  } else {
    console.warn(log);
    return log;
  }
}

async function extract([st, site]: [string, Site], callback: ExtractCallback) {
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

        // get metadata
        const gazelle_url = new URL(
          `/ajax.php?action=torrent&id=${torrent_id}`,
          location.href,
        ).toString();
        const record = await xmlHttpRequest({
          method: 'GET',
          url: gazelle_url,
          responseType: 'json',
        }).then(async (event) => {
          let r = event.response as TorrentResponse;
          if (r.status !== 'success') {
            throw r.error;
          }

          let logs: LogCollection | undefined;
          if (r.response.torrent.hasLog) {
            logs = await xmlHttpRequest({
              method: 'GET',
              url: `${site.exclude.download}?action=${
                site.actions?.log || _throw(site)
              }&torrentid=${torrent_id}`,
              responseType: 'document',
            }).then<LogCollection>(async (event) => {
              const body = $(event.response?.body);
              const sections = body.find('.log_section');
              if (sections.length) {
                return {
                  encoded: await Promise.all(
                    sections.toArray().map(async (section) => {
                      const event = await xmlHttpRequest({
                        method: 'GET',
                        url: new URL(
                          (
                            $(section).find<HTMLAnchorElement>(
                              'a.brackets',
                            )[0] ?? _throw(section)
                          ).href,
                          location.href,
                        ).toString(),
                        responseType: 'arraybuffer',
                      });
                      return base64url.encodeBytes(
                        new Uint8Array(event.response),
                      );
                    }),
                  ),
                  score: r.response.torrent.logScore,
                };
              } else {
                return {
                  plain: body
                    .find('pre')
                    .map((_, pre) => pre.textContent)
                    .toArray()
                    .map(_recoverLog),
                  recovered: true,
                  score: r.response.torrent.logScore,
                };
              }
            });
          } else {
            logs = undefined;
          }

          return _toRecord(r.response, st, new URL(location.href), logs);
        });

        // create links
        links.text('Repost to: ');
        await callback(links, {
          torrent: torrent_url.toString(),
          record: record,
          gazelle: gazelle_url,
        });
        initialised = true;
      } finally {
        busy = false;
      }
    };
  });
}

async function validate(callback: ValidateCallback) {
  await callback($('#upload_logs .label'), '#file[name^=logfiles]');
  const form = $('#dynamic_form')[0];
  if (form) {
    onDescendantAdded($(form).single(), false, async (node) => {
      const label = $(node).find('#upload_logs .label');
      if (label.length) {
        await callback(label, '#file[name^=logfiles]');
      }
    });
  }
}

async function _getJson<T extends 'arraybuffer' | 'json'>(
  gazelle: string,
  type: T,
) {
  return xmlHttpRequest({
    method: 'GET',
    url: gazelle,
    responseType: type,
  }).then((event) => event.response);
}

async function adaptAuto(gazelle: string) {
  const json_input = $<HTMLInputElement>('#torrent-json-file').single();
  json_input.files = toDataTransfer(
    new File([await _getJson(gazelle, 'arraybuffer')], 'gazelle.json', {
      type: 'application/json',
    }),
  ).files;

  await nextMutation(
    $('#dynamic_form').single(),
    'childList',
    undefined,
    undefined,
    json_input,
  );
}

function _adaptArtistRole(role: keyof Group['musicInfo']) {
  switch (role) {
    case 'artists':
      return '1';
    case 'with':
      return '2';
    case 'composers':
      return '3';
    case 'conductor':
      return '4';
    case 'dj':
      return '5';
    case 'remixedBy':
      return '6';
    case 'producer':
      return '7';
    default:
      throw role satisfies never;
  }
}

async function adaptDescriptions(record: Record, callback: AdaptCallback) {
  await callback(
    $('tr:has(#album_desc) > .label'),
    $('#album_desc'),
    dumpDescriptions([record.group], bbcode.dump),
  );
  await callback(
    $('tr:has(#release_desc) > .label'),
    $('#release_desc'),
    dumpDescriptions([record.item], bbcode.dump),
  );
}

async function adaptUniversal(record: Record, callback: AdaptCallback) {
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
  trySelect(format_select, record.item.format);
  $(format_select).trigger('change');

  const encoding_select = $<HTMLSelectElement>('#bitrate').single();
  if (!trySelect(encoding_select, record.item.encoding)) {
    trySelect(encoding_select, 'Other');
    $(encoding_select).trigger('change');
    $<HTMLInputElement>('#other_bitrate').single().value = record.item.encoding;
  }

  trySelect($<HTMLSelectElement>('#media').single(), record.item.media);

  $<HTMLInputElement>('#image').single().value = record.group.image;
  await adaptDescriptions(record, callback);
}

function _adaptReleaseType(
  select: HTMLSelectElement,
  value: string,
  source: keyof typeof sites.gazelle,
  target: keyof typeof sites.gazelle,
) {
  const name = Object.entries(sites.gazelle[source].selects.releaseType)
    .find(([k, _v]) => k === value)?.[1]
    ?.toLowerCase();
  if (!name) return;
  const mapped = Object.entries(sites.gazelle[target].selects.releaseType).find(
    ([_, v]) => v.toLowerCase() === name,
  )?.[0];
  if (mapped === undefined) return;
  select.value = mapped;
}

async function adaptGazelle(
  site: keyof typeof sites.gazelle,
  json_url: string,
) {
  const json: TorrentResponse = await _getJson(json_url, 'json');
  if (json.status === 'failure') {
    throw json;
  }

  const group = json.response.group;
  const release = json.response.torrent;

  const artist_add = $('#artistfields .brackets.icon_add').single();
  Object.entries(group.musicInfo)
    .flatMap(([role, artists]) => {
      return artists.map(
        (artist) => [role, artist] as [keyof typeof group.musicInfo, Artist],
      );
    })
    .forEach(([role, artist], i) => {
      let input: HTMLInputElement;
      if (i === 0) {
        input = $<HTMLInputElement>('#artist').single();
      } else {
        artist_add.click();
        input = $<HTMLInputElement>(`#artist_${i}`).single();
      }
      input.value = artist.name;
      (input.nextElementSibling as HTMLSelectElement).value =
        _adaptArtistRole(role);
    });

  if (typia.is<keyof typeof sites.gazelle>(site)) {
    _adaptReleaseType(
      $<HTMLSelectElement>('#releasetype').single(),
      group.releaseType.toString(),
      site,
      'Redacted',
    );
  } else {
    console.warn(site);
  }

  if (release.scene) {
    $('#scene').single().click();
  }

  $<HTMLInputElement>('#tags').single().value = group.tags.join(',');
}

async function adaptLogs(logs: LogCollection, name: string) {
  const log_input = $<HTMLInputElement>('#file[name^=logfiles]').single();
  log_input.files = toDataTransfer(log.toFile(logs, name)).files;
}

export {
  adaptAuto,
  adaptDescriptions,
  adaptUniversal,
  adaptGazelle,
  adaptLogs,
};
export type { Artist, Group, Torrent, TorrentResponse };
export default function (framework: typeof sites.gazelle) {
  (
    Object.entries(framework) as [keyof typeof framework, PartialSite][]
  ).forEach(([st, site]) => {
    site.extract = extract;
    site.validate = validate;
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
