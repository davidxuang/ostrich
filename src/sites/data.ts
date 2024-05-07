import _data from './data.json';
import { FrameworkMap, PartialSite, Site, SiteEntries } from './types';

_data satisfies {
  base: { [fw: string]: SiteEntries };
  override: { [fw: string]: { [st: string]: PartialSite } };
};

type Override = typeof _data.override;

let data: FrameworkMap &
  Override & {
    [fw in keyof Override]: {
      [st in keyof Override[fw]]: Site;
    };
  } = {} as any;

function _transform<T extends keyof Override>(fw: T) {
  data[fw] = {} as any;
  (Object.keys(_data.override[fw]) as (keyof Override[T])[]).forEach((st) => {
    const base = _data.base[fw] satisfies SiteEntries as SiteEntries;
    let site = _data.override[fw][st] as PartialSite;
    site.include = {
      ...base.include,
      ...site.include,
    };
    site.exclude = {
      ...base.exclude,
      ...site.exclude,
    };
    site.actions = {
      ...base.actions,
      ...site.actions,
    };
    (data[fw][st] as PartialSite) = site;
  });
}

(Object.keys(_data.override) as (keyof Override)[]).forEach((fw) =>
  _transform(fw),
);

export default data;
