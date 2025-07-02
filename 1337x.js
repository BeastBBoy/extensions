import AbstractSource from './abstract.js'

export default new class X1337x extends AbstractSource {
  base = 'https://torrents-api.ryukme.repl.co/api/1337x'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []
    const query = encodeURIComponent(titles[0])
    const url = `${this.base}/${query}/1`
    const res = await fetch(url)
    const list = await res.json()
    return this.map(list.results || [])
  }

  batch = this.single
  movie = this.single

  map(items) {
    return items.map(item => ({
      title: item.Name,
      link: item.Magnet,
      hash: item.Magnet.match(/btih:([A-Fa-f0-9]+)/)?.[1] ?? '',
      seeders: parseInt(item.Seeders),
      leechers: parseInt(item.Leechers),
      downloads: parseInt(item.Downloads) || 0,
      size: this.parseSize(item.Size),
      date: new Date(item.DateUploaded),
      verified: false,
      type: 'alt',
      accuracy: 'medium'
    }))
  }

  parseSize(text) {
    const [val, unit] = text.split(' ')
    const num = parseFloat(val)
    switch (unit) {
      case 'GiB': return num * 1024 ** 3
      case 'MiB': return num * 1024 ** 2
      case 'GB': return num * 1e9
      case 'MB': return num * 1e6
      default: return 0
    }
  }

  async test() {
    try {
      const res = await fetch(`${this.base}/test/1`)
      return res.ok
    } catch {
      return false
    }
  }
}()
