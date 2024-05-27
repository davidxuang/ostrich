import { dumpDescriptions } from '..';
import {
  nextMutation,
  parseHeaders,
  toDataTransfer,
  trySelect,
  xmlHttpRequest,
} from '../../common/html';
import log from '../../common/log';
import { _throw } from '../../common/throw';
import { PartialSite } from '../types';
import bbcode from './bbcode';

export default function (site: PartialSite) {
  site.validate = async (callback) => {
    await callback($('.rowhead[msg^=NFO]'), 'input[name^=nfo1]');
  };

  site.adapt = async (payload, callback) => {
    const record = payload.record;
    const cover_task = xmlHttpRequest({
      method: 'GET',
      url: record.group.image,
      responseType: 'arraybuffer',
    }).then((event) => {
      const transfer = toDataTransfer(
        new File(
          [event.response],
          new URL(event.finalUrl).pathname
            .split('/')
            .filter((x) => x)
            .at(-1)
            ?.substring(1) ?? _throw(event),
          {
            type: parseHeaders(event.responseHeaders)['content-type'].split(
              ';',
            )[0],
          },
        ),
      );
      $<HTMLIFrameElement>('td:has(> #cover) iframe')
        .single()
        .contentDocument!.querySelector<HTMLInputElement>('#file')!.files =
        transfer.files;
    });

    // avoid risk
    const desc_parent = $('#editer_description').single();
    if (desc_parent.children.length === 0) {
      await nextMutation(desc_parent, 'childList');
    }

    $<HTMLSelectElement>('#browsecat').single().value = '408'; // Music cat
    $<HTMLInputElement>('#artist').single().value =
      record.group.artists.join(' / ');
    $<HTMLInputElement>('#resource_name').single().value = record.group.name;
    const year = $<HTMLInputElement>('#year').single();
    year.value = record.group.year.toString();
    year.dispatchEvent(new Event('change'));

    trySelect($<HTMLSelectElement>('#standard').single(), record.item.format);
    trySelect($<HTMLSelectElement>('#medium').single(), record.item.media);

    const repost_input = $<HTMLInputElement>('#boardid1').single();
    repost_input.checked = true;
    $(repost_input).trigger('change');

    $<HTMLInputElement>('#small_descr').single().value = [
      record.item.name,
      record.group.year !== record.item.year && record.item.year,
      record.item.label ? record.item.label : record.group.label,
      record.item.catalogue ? record.item.catalogue : record.group.catalogue,
      record.item.logs?.score && `Log (${record.item.logs.score}%)`,
    ]
      .filter((i) => i)
      .join(' / ');

    if (record.item.logs) {
      const log_add = $<HTMLInputElement>('#nfoadd').single();
      log.toFile(record.item.logs, record.group.name).forEach(async (f, i) => {
        if (i > 0) {
          log_add.click();
        }
        $<HTMLInputElement>(`[name=nfo${'1'.repeat(i + 1)}]`).single().files =
          toDataTransfer(f).files;
      });
    }

    await callback(
      $('tr:has(#descr) > .rowhead'),
      $('#descr'),
      dumpDescriptions([record.group, record.item], bbcode.dump),
    );

    await cover_task;
  };
}
