import AbstractSource from './abstract.js';

export default new class X1337x extends AbstractSource {
  base = 'https://corsproxy.io/?https://1337x.to';

  /** @type {import('./').SearchFunction} */
  async single({ titles, resolution }) {
    if (!titles?.length) return [];

    for (const title of titles) {
      const query = `${title} ${resolution ?? ''}p`;
      const results = await this.fetchResults(query);
      if (results.length) return results;
    }

    return [];
  }

  batch = this.single;
  movie = this.single;

  async test() {
    const res = await fetch(this.base + '/search/test/1/');
    return res.ok;
  }

  async fetchResults(query) {
    const response = await fetch(`${this.base}/search/${encodeURIComponent(query)}/1/`);
    const html = await response.text();

    const entries = [...html.matchAll(/<a href="\/torrent\/([^"]+)"[^>]*>([^<]+)<\/a><\/td>\s*<td class="coll-2 seeds">(\d+)<\/td>\s*<td class="coll-3 leeches">(\d+)/g)];

    return await Promise.all(entries.slice(0, 8).map(async ([, path, title, seeds, leech]) => {
      try {
        const detailHtml = await (await fetch(`${this.base}/torrent/${path}`)).text();

        const magnet = detailHtml.match(/href="(magnet:[^"]+)"/)?.[1] ?? '';
        const hash = magnet.match(/btih:([a-fA-F0-9]+)/)?.[1] ?? '';
        if (!magnet || !hash) return null;

        const sizeText = detailHtml.match(/Size<\/td>\s*<td colspan="2">([^<]+)<\/td>/)?.[1] ?? '0 B';
        const size = this.parseSize(sizeText);

        const dateText = detailHtml.match(/Date uploaded<\/td>\s*<td colspan="2">([^<]+)<\/td>/)?.[1] ?? '';
        const date = new Date(dateText || Date.now());

        return {
          title,
          link: magnet,
          hash,
          seeders: parseInt(seeds, 10),
          leechers: parseInt(leech, 10),
          downloads: 0,
          size,
          verified: false,
          date,
          type: 'best'
        };
      } catch (e) {
        return null;
      }
    })).then(r => r.filter(Boolean));
  }

  parseSize(text) {
    const [val, unit] = text.split(" ");
    const mult = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 };
    return parseFloat(val.replace(",", "")) * (mult[unit] || 1);
  }
}();
