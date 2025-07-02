import AbstractSource from './abstract.js'

export default new class PirateBay extends AbstractSource {
  baseUrl = 'https://torrent-search-api-livid.vercel.app/api/piratebay'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const url = `${this.baseUrl}/${query}`

    const res = await fetch(url)
    const data = await res.json()

    return this.map(data)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  movie = this.single

  buildQuery(title, episode) {
    const clean = title.replace(/[^\w\s-]/g, ' ').trim()
    return encodeURIComponent(episode ? `${clean} ${episode}` : clean)
  }

  map(data) {
    return data
      .filter(entry => entry.Magnet && entry.Name)
      .map(entry => {
        const hashMatch = entry.Magnet.match(/btih:([a-fA-F0-9]+)/)
        const size = this.parseSize(entry.Size)
        return {
          title: entry.Name,
          link: entry.Magnet,
          hash: hashMatch?.[1] || '',
          seeders: parseInt(entry.Seeders || '0'),
          leechers: parseInt(entry.Leechers || '0'),
          downloads: parseInt(entry.Downloads || '0'),
          size,
          date: new Date(entry.DateUploaded),
          verified: false,
          type: 'alt',
          accuracy: 'high'
        }
      })
  }

  parseSize(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(GB|GiB|MB|MiB)/i)
    if (!match) return 0
    const num = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    if (unit.includes('g')) return num * 1024 * 1024 * 1024
    if (unit.includes('m')) return num * 1024 * 1024
    return 0
  }

  async test() {
    try {
      const res = await fetch(`${this.baseUrl}/one piece`)
      return res.ok
    } catch {
      return false
    }
  }
}()
