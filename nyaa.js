import AbstractSource from './abstract.js';

export default new class Nyaa extends AbstractSource {
  url = atob('aHR0cHM6Ly9ueWFhLnNpLw==') // Base64 encoded 'https://nyaa.si/'

  /** @type {import('./').SearchFunction} */
  async single({ anilistId, titles, episodeCount }) {
    if (!anilistId) throw new Error('No anilistId provided');
    if (!titles?.length) throw new Error('No titles provided');

    const searchUrl = `${this.url}?f=0&c=1_2&q=${encodeURIComponent(titles[0])}&p=1`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Hayase-Nyaa-Extension/1.0' }
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const html = await res.text();

    // Parse HTML using similar structure to your SeaDex example
    const items = html.match(/<tr class="(default|success)"[\s\S]+?<\/tr>/g) || [];

    return items.map(item => {
      const titleMatch = item.match(/title="([^"]+)">([^<]+)<\/a>/);
      const magnetMatch = item.match(/magnet:\?xt=urn:btih:([a-f0-9]{40})/);
      const statsMatch = item.match(/<td class="text-center"[^>]*>(\d+)<\/td>[^<]*<td class="text-center"[^>]*>(\d+)<\/td>/);
      const sizeMatch = item.match(/<td class="text-center">([\d\.]+)\s([KMGT]iB)<\/td>/);

      return {
        hash: magnetMatch ? magnetMatch[1] : null,
        link: magnetMatch ? magnetMatch[0] : null,
        title: titleMatch ? titleMatch[2] : 'Unknown Title',
        size: sizeMatch ? this.parseSize(sizeMatch[1], sizeMatch[2]) : 0,
        type: 'default',
        date: new Date(),
        seeders: statsMatch ? parseInt(statsMatch[1], 10) : 0,
        leechers: statsMatch ? parseInt(statsMatch[2], 10) : 0,
        downloads: 0,
        accuracy: 'high'
      };
    }).filter(torrent => torrent.hash && torrent.link); // Filter out invalid entries
  }

  // Helper function to parse size strings
  parseSize(value, unit) {
    const units = { 'KiB': 1024, 'MiB': 1048576, 'GiB': 1073741824, 'TiB': 1099511627776 };
    return parseFloat(value) * (units[unit] || 1);
  }

  batch = this.single;
  movie = this.single;

  async test() {
    const res = await fetch(this.url);
    return res.ok;
  }
}();


