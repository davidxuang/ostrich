import typia from 'typia';
import frameworks from '../primitive';
import { PartialSite } from '../types';
import {
  Artist,
  Group,
  TorrentResponse,
  adaptGeneric,
  adaptLogs,
  adaptReleaseType,
  getJson,
} from '.';

function _matchArtistRole(role: keyof Group['musicInfo']) {
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

export default function (site: PartialSite) {
  site.adapt = async (payload) => {
    const record = payload.record;

    await adaptGeneric(record);
    if (record.item.logs.length) {
      adaptLogs(record.item.logs, record.group.name);
    }

    if (payload['gazelle']) {
      const json: TorrentResponse = await getJson(payload['gazelle'], 'json');
      if (json.status === 'failure') {
        throw json;
      }

      const group = json.response.group;
      const release = json.response.torrent;

      const artist_add = $('#artistfields .brackets.icon_add').single();
      Object.entries(group.musicInfo)
        .flatMap(([role, artists]) => {
          return artists.map(
            (artist) =>
              [role, artist] as [keyof typeof group.musicInfo, Artist],
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
            _matchArtistRole(role);
        });

      if (typia.is<keyof typeof frameworks.gazelle.sites>(record.site)) {
        adaptReleaseType(
          $<HTMLSelectElement>('#releasetype').single(),
          group.releaseType.toString(),
          record.site,
          'Redacted',
        );
      } else {
        console.warn(record.site);
      }

      if (release.scene) {
        $('#scene').single().click();
      }

      $<HTMLInputElement>('#tags').single().value = group.tags.join(',');
    }
  };
}
