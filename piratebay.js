import AbstractSource from './abstract.js'

export default new class PirateBay extends AbstractSource {
  url = 'https://torrent-search-api-livid.vercel.app/api/piratebay'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const res = await fetch(`${this.url}/${query}`)
    const data = await res.json()

    if (!Array.isArray(data)) return []

    return this.map(data)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  /** @type {import('./').SearchFunction} */
  movie = this.single

  buildQuery(title, episode) {
    let query = title.replace(/[^\w\s-]/g, ' ').trim()
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`
    return encodeURIComponent(query)
  }

  parseSize(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(KB|MB|GB|TB)/i)
    if (!match) return 0
    const num = parseFloat(match[1])
    switch (match[2].toUpperCase()) {
      case 'KB': return num * 1024
      case 'MB': return num * 1024 ** 2
      case 'GB': return num * 1024 ** 3
      case 'TB': return num * 1024 ** 4
      default: return 0
    }
  }

  map(results) {
    return results.map(item => {
      const hashMatch = item.Magnet?.match(/btih:([a-fA-F0-9]+)/)
      return {
        title: item.Name || 'Unknown',
        link: item.Magnet || '',
        hash: hashMatch?.[1] || '',
        size: this.parseSize(item.Size || ''),
        seeders: parseInt(item.Seeders || '0'),
        leechers: parseInt(item.Leechers || '0'),
        downloads: parseInt(item.Downloads || '0'),
        date: new Date(item.DateUploaded || Date.now()),
        verified: false,
        accuracy: 'medium',
        type: 'alt'
      }
    }).filter(t => t.link && t.hash)
  }

  async test() {
    try {
      const res = await fetch(`${this.url}/one piece`)
      return res.ok
    } catch {
      return false
    }
  }
}()
