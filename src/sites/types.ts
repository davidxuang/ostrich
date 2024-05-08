import { BBNode } from '../common/bbcode';

type LogCollection =
  | {
      plain: string[];
      encoded?: undefined;
      recovered?: boolean;
    }
  | {
      plain?: undefined;
      encoded: string[]; // base64url
      recovered?: undefined;
    };

type Record = {
  site: string;
  group: {
    name: string;
    artists: string[];
    guests: string[];
    composers: string[];
    conductor: string[];
    producer: string[];
    dj: string[];
    remixer: string[];
    description: string | BBNode[];
    label: string;
    catalogue: string;
    year: number;
    image: string;
  };
  item: {
    name?: string;
    description: string;
    label?: string;
    catalogue?: string;
    year?: number;
    media: string;
    encoding: string;
    format: string;
    scene: boolean;
    uploaded_by: string;
    logs?: LogCollection;
  };
};

interface Payload {
  torrent: string;
  record: Record;
  [key: string]: any;
}
type ExtractCallback = (container: JQuery, payload: Payload) => Promise<void>;
type ValidateCallback = (container: JQuery, selector: string) => Promise<void>;

type SiteCore = {
  hostname: string;
  selects?: { [map: string]: { [key: string]: string } };

  extract?: (site: [string, Site], callback: ExtractCallback) => Promise<void>;
  validate?: (callback: ValidateCallback) => Promise<void>;
  adapt?: (payload: Payload) => Promise<void>;
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
  actions?: { [action: string]: string };
};
type SiteEntries = {
  include: SiteInclues;
  exclude: SiteExclude;
  actions?: { [action: string]: string };
};

type PartialSite = SiteCore & PartialSiteEntries;
type Site = SiteCore & SiteEntries;

type FrameworkMap = { [fw: string]: { [st: string]: Site } };

export type {
  LogCollection,
  Record,
  Payload,
  ValidateCallback,
  ExtractCallback,
  SiteEntries,
  PartialSite,
  Site,
  SiteIncludeTypes,
  FrameworkMap,
};
