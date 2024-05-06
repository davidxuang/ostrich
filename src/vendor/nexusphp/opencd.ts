import { _throw, xmlHttpRequest } from '../../helper';
import file from '../../io/file';
import html from '../../io/html';
import { PartialSite } from '../types';
import bbcode from './bbcode';

export default function (site: PartialSite) {
  site.adapt = async (payload) => {
    const record = payload.record;
    const cover_task = xmlHttpRequest({
      method: 'GET',
      url: record.group.image,
      responseType: 'arraybuffer',
    }).then((event) => {
      const transfer = file.toDataTransfer(
        new File(
          [event.response],
          new URL(event.finalUrl).pathname
            .split('/')
            .filter((x) => x)
            .at(-1)
            ?.substring(1) ?? _throw(event),
          {
            type: html
              .parseHeaders(event.responseHeaders)
              ['content-type'].split(';')[0],
          },
        ),
      );
      $<HTMLIFrameElement>('td:has(> #cover) iframe')
        .single()
        .contentDocument!.querySelector<HTMLInputElement>('#file')!.files =
        transfer.files;
    });

    // race & risk
    const desc_parent = $('#editer_description').single();
    if (desc_parent.children.length === 0) {
      await html.changed(desc_parent, 'childList');
    }

    $<HTMLSelectElement>('#browsecat').single().value = '408'; // Music cat
    $<HTMLInputElement>('#artist').single().value =
      record.group.artists.join(' / ');
    $<HTMLInputElement>('#resource_name').single().value = record.group.name;
    const year = $<HTMLInputElement>('#year').single();
    year.value = record.group.year.toString();
    year.dispatchEvent(new Event('change'));

    html.trySelect(
      $<HTMLSelectElement>('#standard').single(),
      record.item.format,
    );
    html.trySelect($<HTMLSelectElement>('#medium').single(), record.item.media);

    const repost_input = $<HTMLInputElement>('#boardid1').single();
    repost_input.checked = true;
    $(repost_input).trigger('change');

    $<HTMLInputElement>('#small_descr').single().value = [
      record.item.name,
      record.group.year !== record.item.year && record.item.year,
      record.item.label ? record.item.label : record.group.label,
      record.item.catalogue ? record.item.catalogue : record.group.catalogue,
    ]
      .filter((i) => i)
      .join(' / ');

    const add_log_input = $<HTMLInputElement>('#nfoadd').single();
    file.fromLogs(record.item.logs, record.group.name).forEach((f, i) => {
      if (i > 0) {
        add_log_input.click();
      }
      $<HTMLInputElement>(`[name=nfo${'1'.repeat(i + 1)}]`).single().files =
        file.toDataTransfer(f).files;
    });

    $<HTMLTextAreaElement>('#descr').single().value = [
      record.group.description instanceof Object
        ? bbcode.dump(record.group.description)
        : record.group.description,
      record.item.description,
    ]
      .filter((i) => i)
      .join('\n[hr]\n');

    await cover_task;
  };
}
