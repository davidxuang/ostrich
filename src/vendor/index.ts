import { _throw } from '../helper';
import gazelle from './gazelle';
import nexusphp from './nexusphp';
import primitive, { getFullSites } from './primitive';
import { Matches, Site } from './types';

const frameworks = primitive;
gazelle(frameworks.gazelle);
nexusphp(frameworks.nexusphp);
const sites = getFullSites(frameworks);

export default {
  sites: getFullSites(frameworks),
  parse(location: Location) {
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
      keyof Matches,
    ];
  },
};
