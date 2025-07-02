import AbstractSource from './abstract.js'

export default new class Nyaa extends AbstractSource {
  url = 'https://nyaa.si'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${this.url}/?f=0&c=1_2&q=${query}&s=seeders&o=desc`)}`

    const res = await fetch(proxiedUrl)
    const html = await res.text()

    return this.parse(html)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  /** @type {import('./').SearchFunction} */
  movie = this.single

  buildQuery(title, episode) {
    const clean = title.replace(/[^\w\s-]/g, ' ').trim()
    let query = clean
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`
    return query
  }

  parse(html) {
    const results = []
    const rows = [...html.matchAll(/<tr>([\s\S]+?)<\/tr>/g)]

    for (const row of rows) {
      const tr = row[1]

      const titleMatch = tr.match(/<a href="\/view\/\d+"[^>]*>([^<]+)<\/a>/)
      const magnetMatch = tr.match(/href="(magnet:\?xt=urn:[^"]+)"/)
      const hashMatch = magnetMatch?.[1].match(/btih:([a-fA-F0-9]+)/)
      const seedMatch = tr.match(/<td class="text-center">(\d+)<\/td>\s*<td class="text-center">(\d+)<\/td>/)
      const dateMatch = tr.match(/data-timestamp="(\d+)"/)
      const sizeMatch = tr.match(/<td class="text-center">([\d.]+)\s+(MiB|GiB|MB|GB)<\/td>/)

      if (!titleMatch || !magnetMatch || !hashMatch || !seedMatch || !dateMatch || !sizeMatch) continue

      const [_, seeders, leechers] = seedMatch
      const [__, sizeValue, sizeUnit] = sizeMatch
      const size = this.parseSize(sizeValue, sizeUnit)

      results.push({
        title: titleMatch[1],
        link: magnetMatch[1],
        seeders: parseInt(seeders),
        leechers: parseInt(leechers),
        downloads: 0,
        hash: hashMatch[1],
        size,
        verified: false,
        date: new Date(parseInt(dateMatch[1]) * 1000),
        type: 'alt'
      })
    }

    return results
  }

  parseSize(value, unit) {
    const num = parseFloat(value)
    switch (unit) {
      case 'MiB': case 'MB': return num * 1024 * 1024
      case 'GiB': case 'GB': return num * 1024 * 1024 * 1024
      default: return 0
    }
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
