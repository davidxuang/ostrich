import { PartialSite } from '../types';
import {
  adaptUniversal,
  adaptAuto,
  adaptLogs,
  adaptDescriptions,
  getGazelle,
} from '.';

export default function (def: PartialSite) {
  def.lang = 'zh';

  def.adapt = async (site, payload, callback) => {
    const record = payload.record;
    const gazelle = await getGazelle(site, payload);

    if (gazelle) {
      await adaptAuto(gazelle);

      // avoid racing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await adaptDescriptions(payload.record, callback);
    } else {
      await adaptUniversal(site, payload.record, callback);
    }

    if (record.item.logs) {
      await adaptLogs(record.item.logs, record.group.name);
    }
  };
  return true;
}
