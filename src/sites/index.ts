import { _throw } from '../common/throw';
import gazelle from './gazelle';
import nexusphp from './nexusphp';
import primitive, { transformSites } from './primitive';
import { Matches, Site } from './types';

gazelle(primitive.gazelle);
nexusphp(primitive.nexusphp);
const sites = transformSites(primitive);

function parseSites(location: Location) {
  if (location.hostname.toLowerCase() === 'logs.musichoarders.xyz') {
    return ['gazelle', '', {}, 'validate'] as [
      keyof typeof primitive,
      string,
      Site,
      keyof Matches | 'validate',
    ];
  }

  const [fw, st, site] =
    sites.find(([_fw, _st, site]) =>
      location.hostname.endsWith(site.hostname),
    ) ?? _throw(location);

  const [cat] =
    Object.entries(site.matches).find(([cat, fw_path]) => {
      const path = site.matches?.[cat as keyof Matches] ?? fw_path;
      return path instanceof Array
        ? path.filter((path) => path === location.pathname).length > 0
        : path === location.pathname;
    }) ?? _throw(location);

  return [fw, st, site, cat] as [
    keyof typeof primitive,
    string,
    Site,
    keyof Matches | 'validate',
  ];
}

export { parseSites };
export default transformSites(primitive);
