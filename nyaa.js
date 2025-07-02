import AbstractSource from './abstract.js'

export default new class Nyaa extends AbstractSource {
  url = 'https://nyaa.si'

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const searchUrl = `${this.url}/?f=0&c=1_2&q=${query}&s=seeders&o=desc`
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`

    const res = await fetch(proxyUrl)
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
    return encodeURIComponent(query)
  }

  parse(html) {
    const results = []
    const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]

    for (const row of rows) {
      const tr = row[1]

      const titleMatch = tr.match(/<a href="\/view\/\d+"[^>]*>([^<]+)<\/a>/)
      const magnetMatch = tr.match(/href="(magnet:\?xt=urn:[^"]+)"/)
      const hashMatch = magnetMatch?.[1]?.match(/btih:([a-fA-F0-9]+)/)
      const sizeMatch = tr.match(/<td class="text-center">([\d.]+)\s+(MiB|GiB|MB|GB)<\/td>/)
      const dateMatch = tr.match(/data-timestamp="(\d+)"/)
      const stats = [...tr.matchAll(/<td class="text-center">(\d+)<\/td>/g)]
      const seeders = stats[stats.length - 2]?.[1]
      const leechers = stats[stats.length - 1]?.[1]

      if (!titleMatch || !magnetMatch || !hashMatch || !sizeMatch || !dateMatch || !seeders || !leechers) continue

      const title = titleMatch[1]
      const magnet = magnetMatch[1]
      const hash = hashMatch[1]
      const size = this.parseSize(sizeMatch[1], sizeMatch[2])
      const date = new Date(parseInt(dateMatch[1]) * 1000)

      results.push({
        title,
        link: magnet,
        hash,
        seeders: parseInt(seeders),
        leechers: parseInt(leechers),
        downloads: 0,
        verified: false,
        size,
        date,
        type: 'alt',
        accuracy: 'high'
      })
    }

    return results
  }

  parseSize(value, unit) {
    const num = parseFloat(value)
    switch (unit) {
      case 'MiB':
      case 'MB': return num * 1024 * 1024
      case 'GiB':
      case 'GB': return num * 1024 * 1024 * 1024
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

