import { PartialSite } from '../types';
import { adaptGeneric, adaptAuto, adaptLogs, getGazelle } from '.';

export default function (def: PartialSite) {
  def.adapt = async (site, payload, callback) => {
    const record = payload.record;
    const gazelle = await getGazelle(site, payload);

    if (gazelle) {
      await adaptAuto(gazelle, payload.record, callback);
    } else {
      await adaptGeneric(site, payload.record, callback);
    }

    if (record.item.logs) {
      await adaptLogs(record.item.logs, record.group.name);
    }
  };
}
