import { PartialSite } from '../types';
import { adaptUniversal, adaptLogs, adaptGazelle } from '.';

export default function (site: PartialSite) {
  site.adapt = async (payload, callback) => {
    const record = payload.record;
    await adaptUniversal(record, callback);
    if (record.item.logs) {
      await adaptLogs(record.item.logs, record.group.name);
    }

    if (payload['gazelle']) {
      adaptGazelle('Redacted', payload['gazelle']);
    }
  };
}
