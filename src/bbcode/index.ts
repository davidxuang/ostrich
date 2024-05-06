import typia, { createIs } from 'typia';
import { _throw } from '../helper';

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;
type Integer<L extends number, R extends number> = Exclude<
  Enumerate<R>,
  Enumerate<L>
>;

interface INode {
  '#': string;
  $?: string | number;
  $$?: INode[];
}

class Singleton<T extends string> implements INode {
  '#': T;
  constructor(tag: T) {
    this['#'] = tag;
  }
}
function singleton<T extends string>(tag: T) {
  return () => new Singleton(tag);
}

class ValueSingleton<T extends string, V extends string | number = string>
  implements INode
{
  '#': T;
  $: V;
  constructor(tag: T, value: V) {
    this['#'] = tag;
    this.$ = value;
  }
}
function valueSingleton<T extends string, V extends string | number = string>(
  tag: T,
) {
  return (value: V) => new ValueSingleton(tag, value);
}

class View<T extends string, C extends INode = BBNode> implements INode {
  '#': T;
  $$: C[];
  constructor(tag: T, children: C[]) {
    this['#'] = tag;
    this.$$ = children;
  }
}
function view<T extends string, C extends INode = BBNode>(tag: T) {
  return (children: C[]) => new View(tag, children);
}

class ValueView<
  T extends string,
  V extends string | number = string,
  C extends INode = BBNode,
> {
  '#': T;
  $: V;
  $$: C[];
  constructor(tag: T, value: V, children: C[]) {
    this['#'] = tag;
    this.$$ = children;
    this.$ = value;
  }
}
function valueView<
  T extends string,
  V extends string | number = string,
  C extends INode = BBNode,
>(tag: T) {
  return (value: V, children: C[]) => new ValueView(tag, value, children);
}

type Factory<T> = (...args: any) => T;

// inline
interface Bold extends View<'b'> {}
const Bold = view('b') satisfies Factory<Bold>;
interface Italic extends View<'i'> {}
const Italic = view('i') satisfies Factory<Italic>;
interface Underline extends View<'u'> {}
const Underline = view('u') satisfies Factory<Underline>;
interface Strikethrough extends View<'s'> {}
const Strikethrough = view('s') satisfies Factory<Strikethrough>;
interface Font extends ValueView<'font'> {}
const Font = valueView('font') satisfies Factory<Font>;
interface Size extends ValueView<'size', Integer<1, 8>> {}
const Size = valueView('size') satisfies Factory<Size>;
interface Color extends ValueView<'color'> {}
const Color = valueView('color') satisfies Factory<Color>;
interface Heading extends ValueView<'h', Integer<1, 7>> {}
const Heading = valueView('h') satisfies Factory<Heading>;
interface Sub extends View<'sub'> {}
const Sub = view('sub') satisfies Factory<Sub>;
interface Sup extends View<'sup'> {}
const Sup = view('sup') satisfies Factory<Sup>;
interface Anchor extends ValueView<'url'> {}
const Anchor = valueView('url') satisfies Factory<Anchor>;
class ImageElement extends ValueSingleton<'img'> {
  alt?: string;
  constructor(value: string, alt?: string) {
    super('img', value);
    this.alt = alt;
  }
}
const Image: Factory<ImageElement> = (value: string, alt?: string) =>
  new ImageElement(value, alt);
interface Code extends View<'code'> {}
const Code = view('code') satisfies Factory<Code>;
interface Spoiler extends View<'#spoiler'> {}
const Spoiler = view('#spoiler') satisfies Factory<Spoiler>;
// block
interface HorizontalRule extends Singleton<'hr'> {}
const HorizontalRule = singleton('hr') satisfies Factory<HorizontalRule>;
interface Align extends ValueView<'align', 'left' | 'center' | 'right'> {}
const Align = valueView('align') satisfies Factory<Align>;
interface Quote extends ValueView<'quote'> {}
const Quote = valueView('quote') satisfies Factory<Quote>;
interface Pre extends ValueView<'pre'> {}
const Pre = valueView('pre') satisfies Factory<Pre>;
interface Collapse extends ValueView<'#collapse'> {}
const Collapse = valueView('#collapse') satisfies Factory<Collapse>;
// list
interface ListItem extends View<'li'> {}
const ListItem = view('li') satisfies Factory<ListItem>;
interface UList extends View<'ul', ListItem> {}
const UList = view('ul') satisfies Factory<UList>;
interface OList extends View<'ol', ListItem> {}
const OList = view('ol') satisfies Factory<OList>;
// table
interface Table extends View<'table', TableRow> {}
const Table = view('table') satisfies Factory<Table>;
interface TableRow extends View<'tr', TableCell> {}
const TableRow = view('tr') satisfies Factory<TableRow>;
interface TableCell extends View<'td'> {}
const TableCell = view('td') satisfies Factory<TableCell>;

type BBElement =
  | Bold
  | Italic
  | Underline
  | Strikethrough
  | Font
  | Size
  | Color
  | Heading
  | Sub
  | Sup
  | Anchor
  | ImageElement
  | Code
  | Spoiler
  | HorizontalRule
  | Align
  | Quote
  | Pre
  | Collapse
  | ListItem
  | UList
  | OList
  | Table
  | TableRow
  | TableCell;

type BBValueView = Extract<BBElement, ValueView<any>>;
type BBView = Exclude<Extract<BBElement, View<any>>, BBValueView>;
type BBValueSingleton = Exclude<
  Extract<BBElement, ValueSingleton<any>>,
  BBValueView
>;
type BBSingleton = Exclude<
  Extract<BBElement, Singleton<any>>,
  BBValueView | BBView | BBValueSingleton
>;

const is = {
  singleton: (node: BBNode): node is BBSingleton =>
    createIs<BBSingleton['#']>()(node['#']),
  valueSingleton: (node: BBNode): node is BBValueSingleton =>
    createIs<BBValueSingleton['#']>()(node['#']),
  view: (node: BBNode): node is BBView => createIs<BBView['#']>()(node['#']),
  valueView: (node: BBNode): node is BBValueView =>
    createIs<BBValueView['#']>()(node['#']),
};

class BBText implements INode {
  '#': '#text' = '#text';
  $: string;
  constructor(value: string) {
    this.$ = value;
  }
}
const text = (value: string) => new BBText(value);
type BBNode = BBElement | BBText;

function _clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function _wrapNewline(nodes: BBNode[], position: 0b10 | 0b11 | 0b01): BBNode[] {
  if (position === 0b10 || position === 0b11) {
    let f = nodes.at(0);
    if (f instanceof BBText) {
      f.$ = f.$.replace(/^ */, '\n');
    } else {
      nodes.unshift(new BBText('\n'));
    }
  }
  if (position === 0b01 || position === 0b11) {
    let l = nodes.at(-1);
    if (l instanceof BBText) {
      l.$ = l.$.replace(/ *$/, '\n');
    } else {
      nodes.push(new BBText('\n'));
    }
  }
  return nodes;
}

function _fromHTML(
  parent: HTMLElement,
  baseURL: URL,
  raw: boolean = false,
): BBNode[] {
  let index = -1;
  const origin = [...parent.childNodes];
  const result: BBNode[] = [];
  while (++index < origin.length) {
    const n = origin[index];
    if (n instanceof Text) {
      let last = result.at(-1);
      if (raw) {
        result.push(new BBText(n.textContent ?? ''));
      } else if (last instanceof BBText) {
        last.$ =
          last.$ +
          (last.$.match(/\s$/)
            ? n.textContent?.trimStart() ?? ''
            : n.textContent ?? ''
          ).replace(/\s+/g, ' ');
      } else {
        result.push(new BBText(n.textContent?.replace(/\s+/g, ' ') ?? ''));
      }
    } else if (n instanceof HTMLBRElement) {
      _wrapNewline(result, 0b01);
    } else if (n instanceof HTMLUListElement) {
      result.push(
        UList(
          [...n.children].map((item) =>
            ListItem(_fromHTML(item as HTMLElement, baseURL)),
          ),
        ),
      );
    } else if (n instanceof HTMLOListElement) {
      result.push(
        OList(
          [...n.children].map((item) =>
            ListItem(_fromHTML(item as HTMLElement, baseURL)),
          ),
        ),
      );
    } else if (n instanceof HTMLTableElement) {
      if (n.classList.contains('hide')) {
        // NexusPHP collapse
        result.push(
          Collapse(
            n.tBodies
              .item(0)
              ?.rows?.item(0)
              ?.cells?.item(0)
              ?.textContent?.trim() ?? _throw(n),
            _fromHTML(
              n.tBodies.item(0)?.rows?.item(1)?.cells?.item(0) ?? _throw(n),
              baseURL,
            ),
          ),
        );
      } else {
        const caption = [...n.children].at(0);
        if (caption instanceof HTMLTableCaptionElement) {
          result.push(Align('center', _fromHTML(caption, baseURL)));
        }
        result.push(
          Table(
            [n.tHead, ...n.tBodies]
              .filter((sec) => sec)
              .flatMap((sec) => [...sec!.rows])
              .map((row) =>
                TableRow(
                  [...row.cells].map((cell) =>
                    TableCell(_fromHTML(cell as HTMLElement, baseURL)),
                  ),
                ),
              ),
          ),
        );
      }
    } else if (n instanceof HTMLQuoteElement) {
      result.push(Quote('', _fromHTML(n, baseURL)));
    } else if (n instanceof HTMLPreElement) {
      result.push(Pre('', _fromHTML(n, baseURL, true)));
    } else if (n instanceof HTMLFieldSetElement) {
      const firstChild = [...n.children].at(0);
      if (firstChild instanceof HTMLLegendElement) {
        n.removeChild(firstChild);
        result.push(
          Quote(firstChild.textContent?.trim() ?? '', _fromHTML(n, baseURL)),
        );
      } else {
        result.push(Quote('', _fromHTML(n, baseURL)));
      }
    } else if (n instanceof HTMLFontElement) {
      let outer: BBNode | undefined;
      const children = _fromHTML(n, baseURL);
      if (n.face) {
        outer = Font(n.face, children);
      }
      if (n.size) {
        outer = Font(n.size, outer ? [outer] : children);
      }
      if (n.color) {
        outer = Font(n.color, outer ? [outer] : children);
      }
      if (outer) {
        result.push(outer);
      } else {
        result.push(...children);
      }
    } else if (n instanceof HTMLHeadingElement) {
      result.push(
        Heading(
          parseInt(n.tagName.slice(1)) as Integer<1, 7>,
          _fromHTML(n, baseURL),
        ),
      );
    } else if (n instanceof HTMLAnchorElement) {
      let href = n.href;
      if (!href.match(/^[a-z+]+:\/\//)) {
        href = new URL(href, baseURL).toString();
      }
      if (
        n.attributes.getNamedItem('onclick')?.value?.startsWith('QuoteJump')
      ) {
        // Gazelle named quote
        let offset = 0;
        while (offset++ < origin.length) {
          if (origin.at(index + offset) instanceof HTMLQuoteElement) break;
        }
        if (index + offset === origin.length) throw n;
        result.push(
          Quote(
            [...n.children].at(0)?.textContent?.trim() ?? '',
            _fromHTML(origin.at(index + offset) as HTMLElement, baseURL),
          ),
        );
        index += offset;
      } else {
        result.push(Anchor(href, _fromHTML(n, baseURL)));
      }
    } else if (n instanceof HTMLImageElement) {
      if (n.classList.contains('listicon')) {
        result.push(ListItem([]));
      } else {
        result.push(Image(n.src, n.alt));
      }
    } else if (n instanceof HTMLHRElement) {
      result.push(HorizontalRule());
    } else if (n instanceof HTMLElement) {
      if (
        n.classList.contains('mature') // Gazelle
      ) {
        continue;
      }

      const tagName = n.tagName.toLowerCase();
      const nextElement = origin
        .slice(index)
        .filter(
          (node) =>
            node instanceof HTMLElement && !(node instanceof HTMLBRElement),
        )
        .at(1);

      if (n.classList.contains('quoteheader')) {
        // Gazelle named quote
        let offset = 0;
        while (offset++ < origin.length) {
          if (origin.at(index + offset) instanceof HTMLQuoteElement) break;
        }
        if (index + offset === origin.length) throw n;
        result.push(
          Quote(
            n.textContent?.trim() ?? '',
            _fromHTML(origin.at(index + offset) as HTMLElement, baseURL),
          ),
        );
        index += offset;
      } else if (
        tagName === 'strong' &&
        nextElement instanceof HTMLAnchorElement &&
        (nextElement.attributes
          .getNamedItem('onclick')
          ?.value?.indexOf('spoiler') ?? NaN) >= 0
      ) {
        // Gazelle collapse
        let offset = 0;
        while (offset++ < origin.length) {
          if (origin.at(index + offset) instanceof HTMLQuoteElement) break;
        }
        if (index + offset === origin.length) throw n;
        result.push(
          Collapse(
            n.textContent?.trim() ?? '',
            _fromHTML(origin.at(index + offset) as HTMLElement, baseURL),
          ),
        );
        index += offset;
        index += 3;
      } else if (n.classList.contains('codetop')) {
        // NexusPHP pre
        let nextElement: ChildNode;
        do {
          nextElement = origin[++index];
          if (nextElement === undefined) {
            throw n;
          }
        } while (!(nextElement instanceof HTMLElement));
        result.push(..._fromHTML(nextElement, baseURL));
        let offset = 1;
        nextElement = origin[index + offset];
        // NexusPHP mediainfo + hidden pre
        while (!(nextElement instanceof HTMLElement) && nextElement) {
          nextElement = origin[index + ++offset];
        }
        if (nextElement instanceof HTMLElement) {
          if (nextElement.children.item(0)?.classList?.contains('codemain')) {
            result.push(
              ..._fromHTML(
                nextElement.children.item(0) as HTMLElement,
                baseURL,
              ),
            );
            index += offset;
          }
        }
      } else if (tagName === 'b' || tagName === 'strong') {
        result.push(Bold(_fromHTML(n, baseURL)));
      } else if (tagName === 'i' || tagName === 'i') {
        result.push(Italic(_fromHTML(n, baseURL)));
      } else if (tagName === 'u' || tagName === 'ins') {
        result.push(Underline(_fromHTML(n, baseURL)));
      } else if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
        result.push(Strikethrough(_fromHTML(n, baseURL)));
      } else if (tagName === 'code' || tagName === 'tt') {
        result.push(Code(_fromHTML(n, baseURL)));
      } else if (tagName === 'sub') {
        result.push(Sub(_fromHTML(n, baseURL)));
      } else if (tagName === 'sup') {
        result.push(Sup(_fromHTML(n, baseURL)));
      } else if (tagName === 'center' || tagName === 'marquee') {
        result.push(Align('center', _fromHTML(n, baseURL)));
      } else {
        let outer: BBNode | undefined;
        let allowUnwrap = false;
        const children = _fromHTML(n, baseURL);
        const classes = [...n.classList];

        const fontWeight = n.style.fontWeight.toLowerCase();
        if (
          parseFloat(fontWeight) >= 550 ||
          fontWeight === 'bold' ||
          fontWeight === 'bolder'
        ) {
          outer = Bold(children);
        }

        const fontStyle = n.style.fontStyle.toLowerCase();
        if (fontStyle === 'italic' || fontStyle.startsWith('oblique')) {
          outer = Italic(outer ? [outer] : children);
        }

        const textDecoration = n.style.textDecoration.toLowerCase().split(' ');
        const textDecorationLine = n.style.textDecorationLine.toLowerCase();
        if (
          textDecorationLine === 'underline' ||
          textDecoration.indexOf('underline') >= 0
        ) {
          outer = Underline(outer ? [outer] : children);
        } else if (
          textDecorationLine === 'line-through' ||
          textDecoration.indexOf('line-through') >= 0
        ) {
          outer = Strikethrough(outer ? [outer] : children);
        }

        const fontFamily = n.style.fontFamily.toLowerCase().split(';').at(0);
        if (fontFamily) {
          if (n.children.item(0) instanceof HTMLPreElement) {
            // NexuxPHP pre
            allowUnwrap = true;
          } else {
            outer = Font(fontFamily, outer ? [outer] : children);
          }
        }

        const fontSize = n.style.fontSize.toLowerCase();
        const sizeClasses = classes.filter((x) => x.startsWith('size'));
        if (sizeClasses.length) {
          outer = Size(
            _clamp(parseInt(sizeClasses.at(0)!.slice(4)), 0, 7) as any,
            outer ? [outer] : children,
          );
        } else if (fontSize) {
          console.warn(fontSize);
        }

        const color = n.style.color.toLowerCase();
        if (color) {
          outer = Color(color, outer ? [outer] : children);
        }

        const align = n.style.textAlign.toLowerCase();
        if (typia.is<Align['$']>(align)) {
          outer = Align(align, outer ? [outer] : children);
        }

        if (tagName === 'span') {
          if (
            !(
              n.attributes.getNamedItem('class')?.value ||
              n.attributes.getNamedItem('style')?.value
            )
          ) {
            allowUnwrap = true;
          } else if (n.classList.contains('mask')) {
            outer = Spoiler(children);
          }
        }

        if (tagName === 'p') {
          if (n.classList.contains('sub')) {
            result.push(Heading(2, children));
          } else {
            result.push(..._wrapNewline(outer ? [outer] : children, 0b11));
          }
        } else if (outer) {
          if (tagName === 'p') {
          } else {
            result.push(outer);
          }
        } else if (allowUnwrap) {
          result.push(...children);
        } else {
          console.warn(n);
          console.log(n.outerHTML);
          if (tagName === 'span') {
            result.push(...children);
          }
        }
      }
    } else {
      throw n;
    }
  }
  return result;
}

function fromHTML(parent: HTMLElement, baseURL: URL) {
  return _fromHTML(parent, baseURL);
}

export type {
  ImageElement,
  INode,
  BBNode,
  BBElement,
  BBSingleton,
  BBText,
  BBValueSingleton,
  BBView,
  BBValueView,
  Integer,
  Singleton,
  ValueSingleton,
  ValueView,
  View,
};
export default {
  fromHTML,
  text,
  singleton,
  valueSingleton,
  view,
  valueView,
  is,
};
