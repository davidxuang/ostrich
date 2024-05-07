import { Framework, Site } from './types';

const frameworks = {
  gazelle: {
    sites: {
      DIC: {
        hostname: 'dicmusic.com',
        selects: {
          releaseType: {
            '1': 'Album',
            '3': 'Soundtrack',
            '5': 'EP',
            '6': 'Anthology',
            '7': 'Compilation',
            '9': 'Single',
            '11': 'Live album',
            '13': 'Remix',
            '14': 'Bootleg',
            '15': 'Interview',
            '16': 'Mixtape',
            '17': 'Demo',
            '18': 'Concert recording',
            '19': 'DJ Mix',
            '21': 'Unknown',
          },
        },
      },
      OPS: {
        hostname: 'orpheus.network',
        selects: {
          releaseType: {
            '1': 'Album',
            '3': 'Soundtrack',
            '5': 'EP',
            '6': 'Anthology',
            '7': 'Compilation',
            '9': 'Single',
            '11': 'Live album',
            '13': 'Remix',
            '14': 'Bootleg',
            '15': 'Interview',
            '16': 'Mixtape',
            '17': 'DJ Mix',
            '18': 'Concert recording',
            '21': 'Unknown',
          },
        },
      },
      Redacted: {
        hostname: 'redacted.ch',
        selects: {
          releaseType: {
            '1': 'Album',
            '3': 'Soundtrack',
            '5': 'EP',
            '6': 'Anthology',
            '7': 'Compilation',
            '9': 'Single',
            '11': 'Live album',
            '13': 'Remix',
            '14': 'Bootleg',
            '15': 'Interview',
            '16': 'Mixtape',
            '17': 'Demo',
            '18': 'Concert Recording',
            '19': 'DJ Mix',
            '21': 'Unknown',
          },
        },
        actions: {
          log: 'loglist',
        },
      },
    },
    matches: {
      source: ['/torrents.php', '/artist.php', '/collages.php'],
      target: '/upload.php',
    },
    entries: {
      download: '/torrents.php',
      upload: '/upload.php',
    },
  },
  nexusphp: {
    sites: {
      OpenCD: {
        hostname: 'open.cd',
      },
      TJUPT: {
        hostname: 'tjupt.org',
        matches: {
          source: '/details.php',
          target: '/upload.php',
        },
        entries: {
          upload: '/upload.php',
        },
      },
    },
    matches: {
      source: '/plugin_details.php',
      target: '/plugin_upload.php',
    },
    entries: {
      download: '/download.php',
      upload: '/plugin_upload.php',
    },
  },
};

function transformSites(frameworks: { [fw: string]: Framework }) {
  return Object.entries(frameworks).flatMap(([fw, framework]) =>
    Object.entries(framework.sites).map(
      ([st, site]): [string, string, Site] => [
        fw,
        st,
        {
          ...site,
          entries: {
            ...framework.entries,
            ...site.entries,
          },
          matches: {
            ...framework.matches,
            ...site.matches,
          },
        },
      ],
    ),
  );
}

export default frameworks;
export { transformSites };
