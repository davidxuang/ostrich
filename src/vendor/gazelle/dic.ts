import { PartialSite } from '../types';
import { adaptUniversal, adaptJson, adaptLogs } from '.';
import bbcode from './bbcode';

export default function (site: PartialSite) {
  site.adapt = async (payload) => {
    const record = payload.record;

    if (payload['gazelle']) {
      await adaptJson(payload['gazelle']);

      // avoid racing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      $<HTMLTextAreaElement>('#album_desc').single().value =
        record.group.description instanceof Object
          ? bbcode.dump(record.group.description)
          : record.group.description;
      $<HTMLTextAreaElement>('#release_desc').single().value =
        record.item.description;
    } else {
      await adaptUniversal(payload.record);
    }

    if (record.item.logs.length) {
      adaptLogs(record.item.logs, record.group.name);
    }
  };
}
