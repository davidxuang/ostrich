import { PartialSite } from '../types';
import { adaptUniversal, adaptJson, adaptLogs } from '.';

export default function (site: PartialSite) {
  site.adapt = async (payload) => {
    const record = payload.record;

    if (payload['gazelle']) {
      await adaptJson(payload['gazelle']);
    } else {
      await adaptUniversal(payload.record);
    }

    if (record.item.logs.length) {
      adaptLogs(record.item.logs, record.group.name);
    }
  };
}
