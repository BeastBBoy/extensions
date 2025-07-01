import AbstractSource from './abstract.js';

export default new class Nyaa extends AbstractSource {
  url = 'https://nyaa.si';

  /** @type {import('./types').SearchFunction} */
  async single({ anilistId, titles, episodeCount }) {
    if (!anilistId) throw new Error('No anilistId provided');
    if (!titles?.length) throw new Error('No titles provided');

    const res = await fetch(`${this.url}/?f=0&c=1_2&q=${encodeURIComponent(titles[0])}&p=1`);
    const html = await res.text();

    const items = html.match(/<tr class="(default|success)"[\s\S]+?<\/tr>/g) || [];

    return items.map(item => {
      const titleMatch = item.match(/title="([^"]+)">([^<]+)<\/a>/);
      const title = titleMatch ? titleMatch[2] : 'Unknown Title';

      const magnetMatch = item.match(/magnet:\?xt=urn:btih:([a-f0-9]{40})/);
      const infoHash = magnetMatch ? magnetMatch[1] : 'UnknownHash';

      const magnetLink = magnetMatch
        ? `magnet:?xt=urn:btih:${infoHash}&tr=http%3A%2F%2Fopen.nyaatorrents.info%3A6544%2Fannounce&dn=${encodeURIComponent(title)}`
        : '';

      const sizeMatch = item.match(/<td class="text-center">([\d.]+) ([MGK]i?B)<\/td>/);
      let size = 0;
      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2];
        const units = { KiB: 1024, MiB: 1048576, GiB: 1073741824, KB: 1000, MB: 1e6, GB: 1e9 };
        size = value * (units[unit] || 1);
      }

      const statsMatch = item.match(/<td class="text-center"[^>]*>(\d+)<\/td>[^<]*<td class="text-center"[^>]*>(\d+)<\/td>[^<]*<td class="text-center">(\d+)<\/td>/);
      const seeders = statsMatch ? parseInt(statsMatch[1], 10) : 0;
      const leechers = statsMatch ? parseInt(statsMatch[2], 10) : 0;

      const dateMatch = item.match(/data-timestamp="(\d+)"/);
      const date = dateMatch ? new Date(parseInt(dateMatch[1], 10) * 1000) : new Date();

      return {
        title,
        link: magnetLink,
        hash: infoHash,
        size,
        seeders,
        leechers,
        date,
        downloads: 0,
        verified: false,
        type: 'alt'
      };
    });
  }

  /** @type {import('./types').SearchFunction} */
  async batch({ anilistId, titles, episodeCount }) {
    return this.single({ anilistId, titles, episodeCount });
  }

  /** @type {import('./types').SearchFunction} */
  async movie({ anilistId, titles }) {
    return this.single({ anilistId, titles, episodeCount: 1 });
  }

  async test() {
    const res = await fetch(this.url);
    return res.ok;
  }
}();

