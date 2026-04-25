import { PartialSite } from '../types';
import {
  adaptGeneric,
  adaptAuto,
  adaptLogs,
  getGazelle,
  adaptDescriptions,
} from '.';

export default function (def: PartialSite) {
  def.lang = 'zh';

  def.adapt = async (site, payload, callback) => {
    const record = payload.record;
    const gazelle = await getGazelle(site, payload);

    if (gazelle) {
      // drop the descriptions
      gazelle.group.wikiBody = '';
      gazelle.torrent.description = '';
      await adaptAuto(gazelle, payload.record, callback);
      // override descriptions
      await adaptDescriptions(record, callback);
    } else {
      await adaptGeneric(site, payload.record, callback);
    }

    if (record.item.logs) {
      await adaptLogs(record.item.logs, record.group.name);
    }
  };
}
