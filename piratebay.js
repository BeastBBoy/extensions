import AbstractSource from './abstract.js'

export default new class PirateBay extends AbstractSource {
  url = 'https://api.ryukme.dev/piratebay'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const res = await fetch(`${this.url}/search?query=${query}`)
    const data = await res.json()

    return this.map(data)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single

  /** @type {import('./').SearchFunction} */
  movie = this.single

  buildQuery(title, episode) {
    const clean = title.replace(/[^\w\s-]/g, ' ').trim()
    let query = clean
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`
    return encodeURIComponent(query)
  }

  /**
   * @param {any[]} items
   * @returns {import('./').TorrentResult[]}
   */
  map(items) {
    return items.map(item => {
      const hashMatch = item.magnet.match(/btih:([a-fA-F0-9]+)/i)
      const hash = hashMatch ? hashMatch[1] : ''
      return {
        title: item.title,
        link: item.magnet,
        hash,
        seeders: parseInt(item.seeders || 0),
        leechers: parseInt(item.leechers || 0),
        downloads: parseInt(item.peers || 0),
        accuracy: 'medium',
        size: this.parseSize(item.size),
        date: new Date(item.uploaded || Date.now()),
        type: 'alt',
        verified: item.verified || false
      }
    }).filter(t => t.hash && t.link)
  }

  parseSize(sizeString) {
    const match = sizeString.match(/([\d.]+)\s*(KB|MB|GB|TB)/i)
    if (!match) return 0
    const [_, num, unit] = match
    const value = parseFloat(num)
    switch (unit.toUpperCase()) {
      case 'KB': return value * 1024
      case 'MB': return value * 1024 ** 2
      case 'GB': return value * 1024 ** 3
      case 'TB': return value * 1024 ** 4
      default: return 0
    }
  }

  async test() {
    try {
      const res = await fetch(`${this.url}/search?query=One+Piece`)
      return res.ok
    } catch {
      return false
    }
  }
}()
