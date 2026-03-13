import { Payload } from '../common/types';

type ExtractCallback = (container: JQuery, payload: Payload) => Promise<void>;
type ValidateCallback = (container: JQuery, selector: string) => Promise<void>;
type AdaptCallback = (
  container: JQuery,
  input: JQuery<HTMLInputElement | HTMLTextAreaElement>,
  selections: string[],
) => Promise<void>;

type SiteCore<K = string> = {
  hostname: string;
  selects?: { [map: string]: { [key: string]: string } };
  lang?: 'latin' | 'native' | 'cjk' | 'zh' | string;

  extract?: (site: NamedSite<K>, callback: ExtractCallback) => Promise<void>;
  validate?: (callback: ValidateCallback) => Promise<void>;
  adapt?: (
    site: NamedSite<K>,
    payload: Payload,
    callback: AdaptCallback,
  ) => Promise<void>;
};

type SiteInclues = {
  source: string | string[];
  target: string;
};
type SiteIncludeTypes = keyof SiteInclues;

type SiteExclude = {
  download: string;
};

type PartialSiteEntries = {
  include?: Partial<SiteInclues>;
  exclude?: Partial<SiteExclude>;
  actions?: { [action: string]: string | null };
};
type SiteEntries = {
  include: SiteInclues;
  exclude: SiteExclude;
  actions?: { [action: string]: string | null };
};

type PartialSite<K = string> = SiteCore<K> & PartialSiteEntries;
type Site<K = string> = SiteCore<K> & SiteEntries;
type NamedSite<K = string> = Site<K> & { name: string };

type FrameworkMap = { [fw: string]: { [st: string]: Site } };

export type {
  ValidateCallback,
  ExtractCallback,
  AdaptCallback,
  SiteIncludeTypes,
  SiteEntries,
  PartialSite,
  Site,
  NamedSite,
  FrameworkMap,
};
