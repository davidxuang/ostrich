import { dumpDescriptions } from '..';
import { nextMutation } from '../../common/html';
import log from '../../common/log';
import { _throw } from '../../common/throw';
import { PartialSite } from '../types';
import bbcode from './bbcode';

export default function (site: PartialSite) {
  site.adapt = async (payload, callback) => {
    const record = payload.record;
    const select_cat = $<HTMLSelectElement>('#browsecat').single();
    select_cat.value = '406'; // Music cat

    $(select_cat).trigger('change');
    const form_div = select_cat.nextElementSibling ?? _throw(select_cat);
    while (form_div.children.length <= 1)
      await nextMutation(
        select_cat.nextElementSibling ?? _throw(select_cat),
        'childList',
      );

    $<HTMLInputElement>('#hqname').single().value = record.group.name;
    $<HTMLInputElement>('#artist').single().value =
      record.group.artists.join(' / ');
    $<HTMLInputElement>('#issuedate').single().value =
      record.group.year.toString();
    $<HTMLInputElement>('#specificcat').single().value = record.item.media;
    $<HTMLInputElement>('#format').single().value = record.item.format;
    $<HTMLInputElement>('#hqtone').single().value = record.item.encoding;
    $<HTMLInputElement>('input[name=small_descr]').single().value = [
      record.item.name,
      record.group.year !== record.item.year && record.item.year,
      record.item.label ? record.item.label : record.group.label,
      record.item.catalogue ? record.item.catalogue : record.group.catalogue,
      record.item.logs?.score && `Log (${record.item.logs.score}%)`,
    ]
      .filter((i) => i)
      .join(' / ');

    const logs = record.item.logs
      ? log
          .toString(record.item.logs)
          .map((log) => `[hide=Log][code]${log}[/code][/hide]`)
          .join('\n')
      : undefined;
    await callback(
      $('tr:has(#descr) > .rowhead'),
      $('#descr'),
      dumpDescriptions([record.group, record.item], bbcode.dump).map((s) =>
        [`[img]${record.group.image}[/img]`, s, logs]
          .filter((i) => i)
          .join('\n[hr]\n'),
      ),
    );
  };
}
