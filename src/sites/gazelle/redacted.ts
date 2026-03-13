import sites from '..';
import { PartialSite } from '../types';
import { adaptUniversal, adaptLogs, adaptGazelle, getGazelle } from '.';

export default function (def: PartialSite<keyof typeof sites.gazelle>) {
  def.adapt = async (site, payload, callback) => {
    const record = payload.record;
    const gazelle = await getGazelle(site, payload);

    await adaptUniversal(site, record, callback);
    if (record.item.logs) {
      await adaptLogs(record.item.logs, record.group.name);
    }

    if (gazelle) {
      adaptGazelle(site, gazelle);
    }
  };
}
