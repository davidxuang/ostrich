import primitive from '../primitive';
import { PartialSite } from '../types';
import opencd from './opencd';
import tjupt from './tjupt';

export default function (framework: typeof primitive.nexusphp) {
  (
    Object.entries(framework.sites) as [
      keyof typeof framework.sites,
      PartialSite,
    ][]
  ).forEach(([st, site]) => {
    switch (st) {
      case 'OpenCD':
        return opencd(site);
      case 'TJUPT':
        return tjupt(site);
    }
  });
}
