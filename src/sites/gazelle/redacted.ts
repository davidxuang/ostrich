import { PartialSite } from '../types';
import { adaptUniversal, adaptLogs, adaptGazelle } from '.';

export default function (site: PartialSite) {
  site.adapt = async (payload, callback) => {
    const record = payload.record;
    await adaptUniversal(record);
    if (record.item.logs) {
      await adaptLogs(record.item.logs, record.group.name);
      await callback(
        $('#upload_logs .label').append($('<br>')),
        '#file[name^=logfiles]',
      );
    }

    if (payload['gazelle']) {
      adaptGazelle('Redacted', payload['gazelle']);
    }
  };
}
