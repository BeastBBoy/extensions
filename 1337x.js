import AbstractSource from './abstract.js'

export default new class X1337x extends AbstractSource {
  url = 'https://1337x.to'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode, resolution }) {
    if (!titles?.length) return []
    const query = this.buildQuery(titles[0], episode, resolution)
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${this.url}/search/${query}/1/`)}`

    const res = await fetch(proxy)
    const html = await res.text()
    return this.parseList(html)
  }

  batch = this.single
  movie = this.single

  buildQuery(title, episode, resolution) {
    let query = title.replace(/[^\w\s-]/g, ' ').trim()
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`
    if (resolution) query += ` ${resolution}p`
    return query
  }

  parseSize(value) {
    const [val, unit] = value.split(' ')
    const num = parseFloat(val.replace(',', ''))
    switch (unit) {
      case 'MB': return num * 1e6
      case 'MiB': return num * 1048576
      case 'GB': return num * 1e9
      case 'GiB': return num * 1073741824
      default: return 0
    }
  }

  async parseList(html) {
    const entries = [...html.matchAll(/<a href="\/torrent\/([^"\n]+)"[^>]*>([^<]+)<\/a><\/td>\s*<td class="coll-2 seeds">(\d+)<\/td>\s*<td class="coll-3 leeches">(\d+)/g)]
    const results = []

    for (const [, path, title, seeds, leeches] of entries.slice(0, 8)) {
      const detailUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${this.url}/torrent/${path}`)}`
      try {
        const html = await (await fetch(detailUrl)).text()
        const magnet = html.match(/href="(magnet:[^"]+)"/)?.[1] ?? ''
        const hash = magnet.match(/btih:([a-fA-F0-9]+)/)?.[1] ?? ''
        const sizeMatch = html.match(/Size<\/td>\s*<td colspan="2">([^<]+)<\/td>/)
        const size = this.parseSize(sizeMatch?.[1] ?? '0 B')
        const dateMatch = html.match(/Date uploaded<\/td>\s*<td colspan="2">([^<]+)<\/td>/)
        const date = dateMatch ? new Date(dateMatch[1]) : new Date()

        results.push({
          title,
          link: magnet,
          hash,
          seeders: parseInt(seeds),
          leechers: parseInt(leeches),
          downloads: 0,
          size,
          verified: false,
          date,
          type: 'alt'
        })
      } catch (e) {
        continue
      }
    }

    return results
  }

  async test() {
    try {
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(this.url)}`)
      return res.ok
    } catch {
      return false
    }
  }
}()
