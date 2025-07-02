import AbstractSource from './abstract.js';

export default new class PirateBay extends AbstractSource {
  base = 'https://torrent-search-api-livid.vercel.app/api/piratebay'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return [];

    const query = this.buildQuery(titles[0], episode);
    const url = `${this.base}/${query}`;

    const res = await fetch(url);
    const data = await res.json();

    return this.map(data);
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single;

  /** @type {import('./').SearchFunction} */
  movie = this.single;

  buildQuery(title, episode) {
    const clean = title.replace(/[^\w\s-]/g, ' ').trim();
    let query = clean;
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`;
    return encodeURIComponent(query);
  }

  map(results) {
    return results.map(item => {
      const size = this.parseSize(item.Size);
      const hashMatch = item.Magnet.match(/btih:([a-fA-F0-9]{40})/i);
      return {
        title: item.Name,
        link: item.Magnet,
        hash: hashMatch ? hashMatch[1].toLowerCase() : '',
        seeders: parseInt(item.Seeders || '0'),
        leechers: parseInt(item.Leechers || '0'),
        downloads: parseInt(item.Downloads || '0'),
        size,
        date: new Date(item.DateUploaded),
        verified: false,
        type: 'alt',
        accuracy: 'medium'
      };
    }).filter(r => r.hash); // only valid results
  }

  parseSize(sizeStr) {
    const [val, unit] = sizeStr.split(' ');
    const num = parseFloat(val);
    switch (unit) {
      case 'MB': case 'MiB': return num * 1024 * 1024;
      case 'GB': case 'GiB': return num * 1024 * 1024 * 1024;
      default: return 0;
    }
  }

  async test() {
    try {
      const res = await fetch(`${this.base}/test`);
      return res.ok;
    } catch {
      return false;
    }
  }
}();
