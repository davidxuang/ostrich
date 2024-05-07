import { createIs } from 'typia';
import bb, {
  BBNode,
  BBText,
  Integer,
  VoidElement,
  ValueVoidElement,
  ValueViewElement,
  ViewElement,
  View,
  ValueView,
} from '../../common/bbcode';

type NPVoid = VoidElement<'hr'>;
type NPValueVoid = ValueVoidElement<'img'>;
type NPView = ViewElement<
  | 'b'
  | 'i'
  | 'u'
  | 's'
  | 'center'
  | 'sup'
  | 'sub'
  | 'mask'
  | 'pre'
  | '*'
  | 'table'
  | 'tr'
  | 'td'
>;
type NPValueView =
  | ValueViewElement<
      'color' | 'font' | 'url' | 'quote' | 'hide' | 'code',
      string
    >
  | ValueViewElement<'size', Integer<1, 8>>;

type NPNode = BBText | NPVoid | NPValueVoid | NPView | NPValueView;

const _is = {
  void: (node: NPNode): node is NPVoid => createIs<NPVoid['#']>()(node['#']),
  valueVoid: (node: NPNode): node is NPValueVoid =>
    createIs<NPValueVoid['#']>()(node['#']),
  view: (node: NPNode): node is NPView => createIs<NPView['#']>()(node['#']),
  valueView: (node: NPNode): node is NPValueView =>
    createIs<NPValueView['#']>()(node['#']),
};

function _dump(n: BBNode, depth = -1): string {
  let np: NPNode | string = (() => {
    switch (n['#']) {
      case 'h':
        return ValueView<'size', Integer<1, 8>>('size')(
          (8 - n.$) as Integer<2, 8>,
          n.$$,
        );
      case 'code':
        return ValueView('font')('monospace', n.$$);
      case '#spoiler':
        return { ...n, '#': 'mask' };
      case 'align':
        if (n.$ === 'center') {
          return View('center')(n.$$);
        } else {
          console.warn(n);
          return n.$$.map((c) => _dump(c, depth)).join('');
        }
      case '#collapse':
        return { ...n, '#': 'hide' };
      case 'li':
        console.warn(n);
        return { ...n, '#': '*' };
      case 'ul':
        ++depth;
        return n.$$.map(
          (x) =>
            `${'    '.repeat(depth)}[*] ${x.$$.map((y) => _dump(y, depth))}`,
        ).join('\n');
      case 'ol':
        ++depth;
        return n.$$.map(
          (x, i) =>
            `${'    '.repeat(depth)}[*] ${i + 1}. ${x.$$.map((y) => _dump(y, depth))}`,
        ).join('\n');
      default:
        return n;
    }
  })();

  if (typeof np === 'string') {
    return np;
  }

  switch (np['#']) {
    case '#text':
      return np.$.replace(
        /\[(\/?(?:\w+(?:=.+?)?|\*|#))\]/g,
        '[\u200B$1\u200B]',
      ); // escaping
    case '*':
      return `[${np['#']}]${np.$$.map((n) => _dump(n)).join('')}`;
  }

  if (_is.void(np)) {
    return `[${n['#']}]`;
  } else if (_is.valueVoid(np)) {
    return `[${np['#']}=${np.$}]`;
  } else if (_is.view(np)) {
    return `[${np['#']}]${np.$$.map((n) => _dump(n)).join('')}[/${n['#']}]`;
  } else if (_is.valueView(np)) {
    return `[${np['#']}=${np.$}]${np.$$.map((n) => _dump(n)).join('')}[/${n['#']}]`;
  } else {
    throw n;
  }
}

function dump(root: BBNode[]) {
  return root
    .map((node) => _dump(node))
    .join('')
    .trim();
}

export default { ...bb, dump };