import { PartialSite } from '../types';
import { adaptUniversal, adaptAuto, adaptLogs, adaptDescriptions } from '.';

export default function (site: PartialSite) {
  site.adapt = async (payload, callback) => {
    const record = payload.record;

    if (payload['gazelle']) {
      await adaptAuto(payload['gazelle']);

      // avoid racing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await adaptDescriptions(payload.record, callback);
    } else {
      await adaptUniversal(payload.record, callback);
    }

    if (record.item.logs) {
      await adaptLogs(record.item.logs, record.group.name);
    }
  };
  return true;
}
