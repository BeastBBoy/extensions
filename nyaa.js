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

  batch = this.single
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
      const dateMatch = tr.match(/data-timestamp="(\d+)"/)
      const sizeMatch = tr.match(/<td class="text-center">([\d.]+)\s+(MiB|GiB|MB|GB)<\/td>/)
      const statsMatch = [...tr.matchAll(/<td class="text-center">(\d+)<\/td>/g)]

      if (!titleMatch || !magnetMatch || !hashMatch || !dateMatch || !sizeMatch || statsMatch.length < 3) continue

      const seeders = parseInt(statsMatch[1][1])
      const leechers = parseInt(statsMatch[2][1])
      const [__, sizeVal, sizeUnit] = sizeMatch
      const size = this.parseSize(sizeVal, sizeUnit)

      results.push({
        title: titleMatch[1],
        link: magnetMatch[1],
        hash: hashMatch[1],
        seeders,
        leechers,
        downloads: 0,
        verified: false,
        size,
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

