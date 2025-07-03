import AbstractSource from './abstract.js'

export default new class Nyaasi extends AbstractSource {
  base = 'https://torrent-search-api-livid.vercel.app/api/nyaasi'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const res = await fetch(`${this.base}/${query}`)
    const data = await res.json()

    if (!Array.isArray(data)) return []

    return this.map(data)
  }

  batch = this.single
  movie = this.single

  buildQuery(title, episode) {
    let query = title
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`
    return encodeURIComponent(query)
  }

  map(entries) {
    return entries.map(entry => {
      const hash = entry.Magnet?.match(/btih:([a-fA-F0-9]+)/)?.[1] || ''
      return {
        title: entry.Name,
        link: entry.Magnet,
        seeders: parseInt(entry.Seeders || '0'),
        leechers: parseInt(entry.Leechers || '0'),
        downloads: parseInt(entry.Downloads || '0'),
        hash,
        size: this.parseSize(entry.Size),
        date: new Date(entry.DateUploaded),
        type: 'alt',
        accuracy: 'medium'
      }
    }).filter(e => e.hash)
  }

  parseSize(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(GiB|MiB|GB|MB)/)
    if (!match) return 0
    const [_, num, unit] = match
    const size = parseFloat(num)
    switch (unit) {
      case 'GiB':
      case 'GB': return size * 1024 * 1024 * 1024
      case 'MiB':
      case 'MB': return size * 1024 * 1024
      default: return 0
    }
  }

  async test() {
    try {
      const res = await fetch(this.base + '/one piece')
      return res.ok
    } catch {
      return false
    }
  }
}()


