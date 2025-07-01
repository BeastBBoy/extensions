import AbstractSource from './abstract.js';

export default new class sukebei extends AbstractSource {
  url = atob('aHR0cHM6Ly9zdWtlYmVpLm55YWEuc2kv');

  async single({ anilistId, titles, episodeCount }) {
    if (!anilistId) throw new Error('No anilistId provided');
    if (!titles?.length) throw new Error('No titles provided');

    const res = await fetch(`${this.url}?f=0&c=1_0&q=${titles[0]}&p=1`);
    const html = await res.text();
    const items = html.match(/<tr class="(default|success)"[\s\S]+?<\/tr>/g) || [];

    return items.map(item => {
      const titleMatch = item.match(/title="([^"]+)">([^<]+)<\/a>/);
      const title = titleMatch ? titleMatch[2] : 'Unknown Title';

      const magnetMatch = item.match(/magnet:\?xt=urn:btih:([a-f0-9]{40})/);
      const infoHash = magnetMatch ? magnetMatch[1] : 'Unknown Hash';
      const magnetLink = magnetMatch
        ? `magnet:?xt=urn:btih:${infoHash}&tr=http%3A%2F%2Fopen.nyaatorrents.info%3A6544%2Fannounce&dn=${encodeURIComponent(title)}`
        : 'Unknown Magnet Link';

      const sizeMatch = item.match(/<td class="text-center">([\d\.]+) ([MGiB]+)<\/td>/);
      let size = 0;
      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2];
        size = unit.includes('GiB') || unit.includes('GB') ? value * 1073741824 :
               unit.includes('MiB') || unit.includes('MB') ? value * 1048576 : 0;
      }

      const statsMatch = item.match(/<td class="text-center"[^>]*>(\d+)<\/td>[^<]*<td class="text-center"[^>]*>(\d+)<\/td>/);
      const seeders = statsMatch ? parseInt(statsMatch[1], 10) : 0;
      const leechers = statsMatch ? parseInt(statsMatch[2], 10) : 0;

      const dateMatch = item.match(/data-timestamp="(\d+)">([^<]+)<\/td>/);
      const date = dateMatch ? new Date(parseInt(dateMatch[1], 10) * 1000) : new Date();

      return {
        title,
        link: magnetLink,
        hash: infoHash,
        size,
        seeders,
        leechers,
        date,
        accuracy: "high"
      };
    });
  }

  batch = this.single;
  movie = this.single;

  async test() {
    try {
      const res = await fetch(this.url);
      return res.ok;
    } catch {
      return false;
    }
  }
}();
