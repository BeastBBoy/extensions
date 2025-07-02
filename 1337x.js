import AbstractSource from './abstract.js'

export default new class X1337 extends AbstractSource {
  url = 'https://www.1377x.to'

  buildQuery({ titles, episode }) {
    if (!titles?.length) throw new Error('No titles provided')
    const title = titles[0].replace(/[^\w\s-]/g, ' ').trim()
    return encodeURIComponent(`${title}${episode ? ' ' + episode.toString().padStart(2, '0') : ''}`)
  }

  /**
   * @param {string} html
   * @returns {import('./').TorrentResult[]}
   */
  parse(html) {
    const results = []
    const rows = [...html.matchAll(/<tr>(.*?)<\/tr>/gs)]

    for (const row of rows) {
      const tr = row[1]

      const titleMatch = tr.match(/<a href="\/torrent\/[^"]+">([^<]+)<\/a>/)
      const linkMatch = tr.match(/<a href="(\/torrent\/[^"]+)"/)
      const seedMatch = tr.match(/<td class="seeds">(\d+)<\/td>/)
      const leechMatch = tr.match(/<td class="leeches">(\d+)<\/td>/)
      const sizeMatch = tr.match(/<td class="size">([\d.]+)\s+(MB|GB|MiB|GiB)/)
      const dateMatch = tr.match(/<td class="coll-date">([^<]+)<\/td>/)

      if (!titleMatch || !linkMatch || !seedMatch || !leechMatch || !sizeMatch) continue

      const magnet = `https://www.1377x.to${linkMatch[1]}`
      const hash = this.extractHash(magnet)

      results.push({
        title: titleMatch[1],
        link: magnet,
        hash,
        seeders: parseInt(seedMatch[1]),
        leechers: parseInt(leechMatch[1]),
        downloads: 0,
        size: this.parseSize(sizeMatch[1], sizeMatch[2]),
        date: new Date(), // 1337x doesn't show timestamps, fallback to now
        verified: false,
        type: 'alt',
        accuracy: 'medium'
      })
    }

    return results
  }

  extractHash(url) {
    const match = url.match(/\/torrent\/[^/]+\/([a-fA-F0-9]{40})/)
    return match ? match[1] : ''
  }

  parseSize(value, unit) {
    const num = parseFloat(value)
    switch (unit) {
      case 'MB':
      case 'MiB': return num * 1024 * 1024
      case 'GB':
      case 'GiB': return num * 1024 * 1024 * 1024
      default: return 0
    }
  }

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    const query = this.buildQuery({ titles, episode })
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${this.url}/search/${query}/1/`)}`

    const res = await fetch(url)
    const html = await res.text()

    return this.parse(html)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single

  /** @type {import('./').SearchFunction} */
  movie = this.single

  async test() {
    try {
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(this.url)}`)
      return res.ok
    } catch {
      return false
    }
  }
}()
