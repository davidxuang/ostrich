import { PartialSite } from '../types';
import { adaptUniversal, adaptLogs, adaptGazelle } from '.';

export default function (site: PartialSite) {
  site.adapt = async (payload) => {
    const record = payload.record;
    await adaptUniversal(record);
    if (record.item.logs) {
      await adaptLogs(record.item.logs, record.group.name);
    }

    if (payload['gazelle']) {
      adaptGazelle('Redacted', payload['gazelle']);
    }
  };
}
