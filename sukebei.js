import AbstractSource from './abstract.js';

export default new class Sukebei extends AbstractSource {
  url = 'https://corsproxy.io/?https://sukebei.nyaa.si';

  /** @type {import('./').SearchFunction} */
  async single({ anilistId, titles, episodeCount }) {
    if (!anilistId) throw new Error('No anilistId provided');
    if (!titles?.length) throw new Error('No titles provided');

    const res = await fetch(`${this.url}/?f=0&c=1_0&q=${encodeURIComponent(titles[0])}&p=1`);
    const html = await res.text();

    const rows = html.match(/<tr class="(default|success)"[\s\S]+?<\/tr>/g) || [];

    return rows.map(row => {
      const title = row.match(/title="[^"]+">([^<]+)<\/a>/)?.[1] ?? 'Unknown';
      const infoHash = row.match(/magnet:\?xt=urn:btih:([a-f0-9]{40})/)?.[1] ?? '';
      const magnet = `magnet:?xt=urn:btih:${infoHash}&tr=http%3A%2F%2Fopen.nyaatorrents.info%3A6544%2Fannounce&dn=${encodeURIComponent(title)}`;

      const sizeMatch = row.match(/<td class="text-center">([\d.]+) ([MGK]i?B)<\/td>/);
      const size = sizeMatch ? parseSize(sizeMatch[1], sizeMatch[2]) : 0;

      const [seeders, leechers] = row.match(/<td class="text-center">(\d+)<\/td>/g)?.slice(-3, -1).map(n => parseInt(n.replace(/\D/g, ''))) || [0, 0];

      const dateMatch = row.match(/data-timestamp="(\d+)"/);
      const date = dateMatch ? new Date(parseInt(dateMatch[1], 10) * 1000) : new Date();

      return {
        title,
        link: magnet,
        hash: infoHash,
        size,
        type: 'alt',
        date,
        seeders,
        leechers,
        downloads: 0,
        accuracy: 'medium'
      };
    });
  }

  batch = this.single;
  movie = this.single;

  async test() {
    const res = await fetch(this.url);
    return res.ok;
  }
}();

function parseSize(val, unit) {
  const size = parseFloat(val.replace(",", ""));
  const units = { KiB: 1024, MiB: 1048576, GiB: 1073741824, KB: 1e3, MB: 1e6, GB: 1e9 };
  return size * (units[unit] || 1);
}

