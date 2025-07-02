import AbstractSource from './abstract.js'

export default new class PirateBay extends AbstractSource {
  url = 'https://torrent-search-api-livid.vercel.app/api/piratebay'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const res = await fetch(`${this.url}/${query}`)
    const data = await res.json()

    return this.map(data)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  movie = this.single

  buildQuery(title, episode) {
    const clean = title.replace(/[^\w\s-]/g, ' ').trim()
    let query = clean
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`
    return encodeURIComponent(query)
  }

  /** @param {Array} torrents */
  map(torrents) {
    return torrents.map(t => {
      const hashMatch = t.magnet.match(/btih:([a-fA-F0-9]+)/)
      return {
        title: t.title || 'Unknown',
        link: t.magnet,
        hash: hashMatch?.[1] || '',
        seeders: parseInt(t.seeds || '0'),
        leechers: parseInt(t.peers || '0'),
        downloads: 0,
        accuracy: 'medium',
        size: this.parseSize(t.size),
        date: new Date(),
        verified: false,
        type: 'alt'
      }
    }).filter(r => r.hash)
  }

  parseSize(sizeStr) {
    const [num, unit] = sizeStr.split(' ')
    const n = parseFloat(num)
    switch ((unit || '').toUpperCase()) {
      case 'MB': return n * 1024 * 1024
      case 'GB': return n * 1024 * 1024 * 1024
      case 'KB': return n * 1024
      default: return 0
    }
  }

  async test() {
    try {
      const res = await fetch(`${this.url}/naruto`)
      return res.ok
    } catch {
      return false
    }
  }
}()
