import AbstractSource from './abstract.js';

export default new class Nyaa extends AbstractSource {
  // Configuration
  config = {
    baseUrl: 'https://nyaa.si',
    timeout: 10000, // 10 seconds
    retries: 3
  }

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return [];

    let attempts = 0;
    while (attempts < this.config.retries) {
      try {
        const query = this.buildQuery(titles[0], episode);
        const url = `${this.config.baseUrl}/?f=0&c=1_2&q=${query}&s=seeders&o=desc`;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html'
          }
        });

        clearTimeout(timeout);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        return this.parseResults(await response.text());

      } catch (error) {
        attempts++;
        if (attempts >= this.config.retries) {
          console.error(`[Nyaa] Failed after ${this.config.retries} attempts:`, error);
          return [];
        }
        await new Promise(r => setTimeout(r, 2000 * attempts)); // Exponential backoff
      }
    }
    return [];
  }

  buildQuery(title, episode) {
    const cleanTitle = title.replace(/[^\w\s-]/g, ' ').trim();
    let query = encodeURIComponent(cleanTitle);
    if (episode) query += `+${episode.toString().padStart(2, '0')}`;
    return query;
  }

  parseResults(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = Array.from(doc.querySelectorAll('tbody tr'));

    return rows.map(row => {
      const titleCell = row.querySelector('td[colspan="2"] a:last-child');
      const magnetLink = row.querySelector('a[href^="magnet:"]');
      const [seeders, leechers] = Array.from(row.querySelectorAll('td.text-center')).slice(-3, -1);

      return {
        title: titleCell?.textContent.trim() || 'Unknown',
        link: magnetLink?.href || '',
        seeders: parseInt(seeders?.textContent || '0'),
        leechers: parseInt(leechers?.textContent || '0'),
        downloads: 0,
        accuracy: 'high'
      };
    }).filter(t => t.link); // Remove invalid entries
  }

  batch = this.single;
  movie = this.single;

  async test() {
    try {
      const response = await fetch(this.config.baseUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}();
