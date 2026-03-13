import { Biscriptal } from './types';

export default {
  parse: function (val: string): string | Biscriptal {
    val = val.trim().normalize();
    const match = val.match(/^(.+?)\s*\((.+)\)$/);
    if (!match) return val;

    let [latin, native] = match.slice(1);

    // DIC
    const trilingual = native
      .trim()
      .match(/^(.+?)(?:\s+\/\s+|\s*／\s*)(.*\p{Script=Han}.*)$/u);
    if (trilingual) {
      return {
        latin: latin,
        native: trilingual[1],
      };
    }

    // count non-Latin letters
    let l = match[1].match(/[^\P{L}\p{Script=Latin}]/gu)?.length ?? 0;
    let r = match[2].match(/[^\P{L}\p{Script=Latin}]/gu)?.length ?? 0;
    if (l === r) {
      l = match[1].match(/[^\P{L}a-zA-Z]/gu)?.length ?? 0;
      r = match[2].match(/[^\P{L}a-zA-Z]/gu)?.length ?? 0;
    }

    if (l > r) {
      [latin, native] = [native, latin];
    } else if (l === r && latin.length < native.length) {
      // assume that the romanisation is longer
      [latin, native] = [native, latin];
    }

    return {
      latin: latin,
      native: native,
    };
  },
  format: function (
    val: string | Biscriptal,
    prefer: 'latin' | 'native' | 'cjk' | 'zh' | string = 'latin',
  ): string {
    if (typeof val === 'string') return val;
    switch (prefer) {
      default:
        return `${val.latin} (${val.native})`;
      case 'native':
        return `${val.native} (${val.latin})`;
      case 'cjk':
        return this.format(
          val,
          /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(
            val.native,
          )
            ? 'native'
            : 'latin',
        );
      case 'zh':
        const z =
          /\p{Script=Han}/u.test(val.native) &&
          !/\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(
            val.native,
          );
        return this.format(val, z ? 'native' : 'latin');
    }
  },
  select: function (
    val: string | Biscriptal,
    prefer: 'latin' | 'native' = 'latin',
  ) {
    if (typeof val === 'string') return val;
    return prefer === 'latin' ? val.latin : val.native;
  },
};
