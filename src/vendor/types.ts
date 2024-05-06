import { BBNode } from '../bbcode';

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
    logs: string[];
  };
};

interface Payload {
  torrent: string;
  record: Record;
  [key: string]: any;
}
type FromCallback = (container: JQuery, payload: Payload) => void;

type PartialSite = {
  hostname: string;
  matches?: Partial<Matches>;
  entries?: Partial<Entries>;
  actions?: { [action: string]: string };
  selects?: { [map: string]: { [key: string]: string } };

  extract?: (site: [string, Site], callback: FromCallback) => Promise<void>;
  adapt?: (payload: Payload) => Promise<void>;
};
type Site = PartialSite & {
  matches: Matches;
  entries: Entries;
};

type Matches = {
  source: string | string[];
  target: string | string[];
};
type Entries = {
  download: string;
  upload: string;
};
type Framework = {
  sites: { [site: string]: PartialSite };
  matches: Matches;
  entries: Entries;
};

export type {
  Entries,
  Framework,
  FromCallback,
  Matches,
  PartialSite,
  Payload,
  Record,
  Site,
};
