import { BBNode } from './bbcode';

type LogCollection =
  | {
      plain: string[];
      encoded?: undefined;
      recovered?: boolean;
      score: number;
    }
  | {
      plain?: undefined;
      encoded: string[]; // base64url
      recovered?: boolean;
      score: number;
    };

type Description =
  | {
      description: string;
      description_tree?: BBNode[];
    }
  | {
      description?: string;
      description_tree: BBNode[];
    };

type Biscriptal = {
  latin: string;
  native: string;
};

type RecordPersonnel = {
  artists: (string | Biscriptal)[];
  guests: (string | Biscriptal)[];
  composers: (string | Biscriptal)[];
  conductor: (string | Biscriptal)[];
  producer: (string | Biscriptal)[];
  dj: (string | Biscriptal)[];
  remixer: (string | Biscriptal)[];
};

type Record = {
  site: string;
  group: {
    type: string;
    name: string | Biscriptal;
    label: string;
    catalogue: string;
    year: number;
    image: string;
  } & RecordPersonnel &
    Description;
  item: {
    name?: string;
    label?: string;
    catalogue?: string;
    year?: number;
    media: string;
    encoding: string;
    format: string;
    scene: boolean;
    uploaded_by: string;
    logs?: LogCollection;
  } & Description;
};

interface Payload {
  torrent: string;
  record: Record;
  [key: string]: any;
}

export type {
  LogCollection,
  Description,
  Biscriptal,
  RecordPersonnel,
  Record,
  Payload,
};
