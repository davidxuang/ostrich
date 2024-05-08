import { PartialSite } from '../types';
import { adaptUniversal, adaptAuto, adaptLogs } from '.';

export default function (site: PartialSite) {
  site.adapt = async (payload) => {
    const record = payload.record;

    if (payload['gazelle']) {
      await adaptAuto(payload['gazelle']);
    } else {
      await adaptUniversal(payload.record);
    }

    if (record.item.logs) {
      await adaptLogs(record.item.logs, record.group.name);
    }
  };
}
