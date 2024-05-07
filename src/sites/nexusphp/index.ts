import data from '../data';
import { PartialSite } from '../types';
import opencd from './opencd';
import tjupt from './tjupt';

export default function (framework: typeof data.nexusphp) {
  (
    Object.entries(framework) as [keyof typeof framework, PartialSite][]
  ).forEach(([st, site]) => {
    switch (st) {
      case 'OpenCD':
        return opencd(site);
      case 'TJUPT':
        return tjupt(site);
    }
  });
}
