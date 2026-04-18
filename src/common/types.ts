import { BBNode } from './bbcode.js';

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;
type Without<T, U> = { [P in Exclude<keyof U, keyof T>]?: never };

type AnyOf<T extends readonly any[]> = {
  [K in keyof T]: Prettify<T[K] & Partial<UnionToIntersection<T[number]>>>;
}[number];
type OneOf<T extends readonly any[]> = {
  [K in keyof T]: Prettify<
    T[K] & Without<T[K], UnionToIntersection<T[number]>>
  >;
}[number];

type LogCollection = OneOf<
  [
    { plain: string[] },
    { encoded: string[] }, // base64url
  ]
> & {
  recovered?: boolean;
  score: number;
};

type Description = AnyOf<
  [{ description: string }, { description_tree: BBNode[] }]
>;

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
