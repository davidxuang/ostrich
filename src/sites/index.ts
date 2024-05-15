import { BBNode } from '../common/bbcode';
import { _throw } from '../common/throw';
import data from './data';
import gazelle from './gazelle';
import nexusphp from './nexusphp';
import { Description, Site, SiteIncludeTypes } from './types';

gazelle(data.gazelle);
nexusphp(data.nexusphp);

function parseSites(location: Location) {
  if (location.hostname.toLowerCase() === 'logs.musichoarders.xyz') {
    return ['gazelle', '', {}, 'validate'] as [
      keyof typeof data,
      string,
      Site,
      SiteIncludeTypes | 'validate',
    ];
  }

  const [fw, st, site] =
    Object.entries(data)
      .flatMap(([fw, framework]) =>
        Object.entries(framework).map(
          ([st, site]) => [fw, st, site] as [string, string, Site],
        ),
      )
      .find(([_f, _s, site]) => location.hostname.endsWith(site.hostname)) ??
    _throw(location);

  const [cat] =
    Object.entries(site.include).find(([cat, fw_path]) => {
      const path = site.include?.[cat as SiteIncludeTypes] ?? fw_path;
      return path instanceof Array
        ? path.filter((path) => path === location.pathname).length > 0
        : path === location.pathname;
    }) ?? _throw(location);

  return [fw, st, site, cat] as [
    keyof typeof data,
    string,
    Site,
    SiteIncludeTypes | 'validate',
  ];
}

function dumpDescriptions(
  descriptions: Description[],
  dump: (nodes: BBNode[]) => string,
) {
  const array = descriptions.map((d) => [
    d.description,
    d.description_tree ? dump(d.description_tree) : undefined,
  ]);
  function* _join() {
    if (array[0][0] !== undefined) {
      yield [array[0][0], ...array.slice(1).map((p) => p[0] ?? p[1] ?? '')]
        .filter((d) => d)
        .join('\n[hr]\n');
    }
    if (array[0][1] !== undefined) {
      yield [array[0][1], ...array.slice(1).map((p) => p[1] ?? p[0] ?? '')]
        .filter((d) => d)
        .join('\n[hr]\n');
    }
  }
  return Array.from(_join());
}

export { parseSites, dumpDescriptions };
export default data as typeof data & {
  [fw in keyof typeof data]: {
    [st in keyof (typeof data)[fw]]: Site;
  };
};
