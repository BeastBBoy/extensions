import AbstractSource from './abstract.js';

export default new class Nyaa extends AbstractSource {
  url = 'https://nyaa.si' // Plain text URL (no need for Base64 here)
  
  /** @type {import('./').SearchFunction} */
  async single({ anilistId, titles, episode }) {
    if (!titles?.length) return [];
    
    try {
      // Build search query with episode if specified
      const query = episode 
        ? `${encodeURIComponent(titles[0])}+${episode.toString().padStart(2, '0')}`
        : encodeURIComponent(titles[0]);
      
      const searchUrl = `${this.url}/?f=0&c=1_2&q=${query}&s=seeders&o=desc`;
      
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'HayaseApp/1.0',
          'Accept': 'text/html'
        }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      return this.parseHtml(await res.text());
      
    } catch (error) {
      console.error('[Nyaa] Search failed:', error);
      return []; // Always return array even on error
    }
  }

  parseHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr.default, tr.success');
    
    return Array.from(rows).map(row => {
      const titleLink = row.querySelector('td[colspan="2"] a:last-child');
      const magnetLink = row.querySelector('a[href^="magnet:"]');
      const [seeders, leechers] = Array.from(row.querySelectorAll('td.text-center')).slice(-3, -1);
      
      return {
        title: titleLink?.textContent.trim() || 'Unknown',
        link: magnetLink?.href || '',
        seeders: parseInt(seeders?.textContent || '0'),
        leechers: parseInt(leechers?.textContent || '0'),
        downloads: 0,
        accuracy: 'high'
      };
    }).filter(t => t.link); // Filter out entries without magnet links
  }

  batch = this.single;
  movie = this.single;

  async test() {
    try {
      const res = await fetch(this.url, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }
}();
