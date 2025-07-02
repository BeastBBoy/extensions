import AbstractSource from './abstract.js';

export default new class PirateBay extends AbstractSource {
  base = 'https://torrent-search-api-livid.vercel.app/api/piratebay';

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return [];

    const query = this.buildQuery(titles[0], episode);
    const url = `${this.base}/${query}`;

    const res = await fetch(url);
    const data = await res.json();

    return this.map(data);
  }

  batch = this.single;
  movie = this.single;

  buildQuery(title, episode) {
    const clean = title.replace(/[^\w\s-]/g, ' ').trim();
    let query = clean;
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`;
    return encodeURIComponent(query);
  }

  map(results) {
    return results
      .map(item => {
        const magnet = item.Magnet || '';
        const hashMatch = magnet.match(/btih:([a-fA-F0-9]{40})/i);
        const hash = hashMatch ? hashMatch[1].toLowerCase() : null;

        if (!hash) return null; // skip invalid result

        return {
          title: item.Name || '',
          link: magnet,
          hash,
          seeders: parseInt(item.Seeders || '0'),
          leechers: parseInt(item.Leechers || '0'),
          downloads: parseInt(item.Downloads || '0'),
          size: this.parseSize(item.Size),
          date: new Date(item.DateUploaded),
          verified: false,
          type: 'alt',
          accuracy: 'medium'
        };
      })
      .filter(Boolean); // remove null entries
  }

  parseSize(sizeStr) {
    if (!sizeStr) return 0;
    const [val, unit] = sizeStr.split(' ');
    const num = parseFloat(val);
    switch (unit) {
      case 'MB':
      case 'MiB': return num * 1024 * 1024;
      case 'GB':
      case 'GiB': return num * 1024 * 1024 * 1024;
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

