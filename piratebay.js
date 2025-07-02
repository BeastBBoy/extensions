import AbstractSource from './abstract.js'

export default new class PirateBay extends AbstractSource {
  base = 'https://torrent-exonoob-in.vercel.app/api'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []
    const q = titles[0].replace(/[^\w\s-]/g, ' ').trim()
    const url = `${this.base}/piratebay/${encodeURIComponent(q)}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return this.map(data)
  }

  batch = this.single
  movie = this.single

  map(items) {
    return items.map(item => ({
      title: item.Name,
      link: item.Magnet,
      hash: item.Magnet.match(/btih:([A-Fa-f0-9]+)/)?.[1] || '',
      seeders: Number(item.Seeders) || 0,
      leechers: Number(item.Leechers) || 0,
      downloads: Number(item.Downloads) || 0,
      size: this.parseSize(item.Size),
      date: new Date(item.DateUploaded),
      verified: false,
      type: 'alt',
      accuracy: 'medium'
    })).filter(r => r.hash)
  }

  parseSize(text) {
    const [val, unit] = text.split(' ')
    const num = parseFloat(val)
    switch ((unit || '').toUpperCase()) {
      case 'KB': return num * 1024
      case 'MB': return num * 1024 ** 2
      case 'GB': return num * 1024 ** 3
      case 'TB': return num * 1024 ** 4
      default: return 0
    }
  }

  async test() {
    try {
      const res = await fetch(`${this.base}/piratebay/test`)
      return res.ok
    } catch {
      return false
    }
  }
}()
