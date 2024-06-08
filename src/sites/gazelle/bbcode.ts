import bb, { BBNode } from '../../common/bbcode';

function _dump(n: BBNode, ordered = false): string {
  let tag: string = n['#'];

  switch (n['#']) {
    case '#text':
      return n.$.match(/\[(\/?(?:\w+(?:=.+?)?|\*|#))\]/g)
        ? `[plain]${n.$}[/plain]` // escaping
        : n.$;
    case 'li':
      tag = ordered ? '#' : '*';
      return `[${tag}]${n.$$.map((n) => _dump(n)).join('')}`;
    case 'img':
      return `[${tag}=${n.$}]${n.alt}[/${tag}]`;
    case 'ul':
      return n.$$.map((n) => _dump(n)).join('\n');
    case 'ol':
      return n.$$.map((n) => _dump(n, true)).join('\n');
    case '#collapse':
    case '#spoiler':
      tag = 'hide';
      break;
  }

  if (bb.is.void(n)) {
    return `[${tag}]`;
  } else if (bb.is.valueVoid(n)) {
    return n satisfies never;
    //return n.$ ? `[${n['#']}=${n.$}]` : `[${n['#']}]`;
  } else if (bb.is.view(n)) {
    return `[${tag}]${n.$$.map((x) => _dump(x)).join('')}[/${tag}]`;
  } else if (bb.is.valueView(n)) {
    return n.$
      ? `[${tag}=${n.$}]${n.$$.map((x) => _dump(x)).join('')}[/${tag}]`
      : `[${tag}]${n.$$.map((x) => _dump(x)).join('')}[/${tag}]`;
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
