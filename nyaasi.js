import AbstractSource from './abstract.js'

export default new class Nyaasi extends AbstractSource {
  base = 'https://torrent-search-api-livid.vercel.app/api/nyaasi/'

  /** @type {import('./').SearchFunction} */
  async single(query) {
    const titles = query.titles || []
    const episode = query.episode

    if (!titles.length) {
      return []
    }

    const title = titles[0]
    const searchQuery = this.buildQuery(title, episode)
    const url = this.base + encodeURIComponent(searchQuery)

    const res = await fetch(url)
    const data = await res.json()

    if (!Array.isArray(data)) {
      return []
    }

    return this.map(data)
  }

  batch = this.single
  movie = this.single

  buildQuery(title, episode) {
    let clean = title.replace(/[^\w\s-]/g, ' ').trim()
    if (episode) {
      clean += ' ' + episode.toString().padStart(2, '0')
    }
    return clean
  }

  map(results) {
    return results.map(item => {
      const hashMatch = item.Magnet && item.Magnet.match(/btih:([a-fA-F0-9]+)/)
      const hash = hashMatch ? hashMatch[1] : ''

      return {
        title: item.Name || '',
        link: item.Magnet || '',
        hash: hash,
        seeders: parseInt(item.Seeders || '0'),
        leechers: parseInt(item.Leechers || '0'),
        downloads: parseInt(item.Downloads || '0'),
        size: this.parseSize(item.Size),
        date: new Date(item.DateUploaded),
        verified: false,
        type: 'alt',
        accuracy: 'medium'
      }
    })
  }

  parseSize(sizeStr) {
    const match = /([\d.]+)\s*(KiB|MiB|GiB|KB|MB|GB)/i.exec(sizeStr)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()

    switch (unit) {
      case 'KIB':
      case 'KB': return value * 1024
      case 'MIB':
      case 'MB': return value * 1024 * 1024
      case 'GIB':
      case 'GB': return value * 1024 * 1024 * 1024
      default: return 0
    }
  }

  async test() {
    const res = await fetch(this.base + 'jujutsu kaisen')
    return res.ok
  }
}()

