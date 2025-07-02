export const Sukebei = new class Sukebei extends AbstractSource {
  url = 'https://sukebei.nyaa.si'

  /** @type {import('./').SearchFunction} */
  async single({ titles }) {
    if (!titles?.length) return []

    const query = titles[0]
    const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${this.url}/?f=0&c=1_0&q=${query}`)}`
    const html = await fetch(proxiedUrl).then(r => r.text())

    return this.parse(html)
  }

  batch = this.single
  movie = this.single

  parse(html) {
    const results = []
    const rows = [...html.matchAll(/<tr.*?>([\s\S]*?)<\/tr>/g)]

    for (const [_, row] of rows) {
      const titleMatch = row.match(/title="[^"]+">([^<]+)<\/a>/)
      const magnetMatch = row.match(/href="(magnet:[^"]+)"/)
      const hash = magnetMatch?.[1].match(/btih:([a-fA-F0-9]+)/)?.[1] ?? ''
      const seeders = parseInt(row.match(/<td class="text-center">(\d+)<\/td>/)?.[1] || '0')
      const leechers = parseInt(row.match(/<td class="text-center">\d+<\/td>\s*<td class="text-center">(\d+)<\/td>/)?.[1] || '0')
      const sizeMatch = row.match(/<td class="text-center">([\d.]+)\s+(MiB|GiB|MB|GB)<\/td>/)
      const size = sizeMatch ? this.parseSize(sizeMatch[1], sizeMatch[2]) : 0
      const dateMatch = row.match(/data-timestamp="(\d+)"/)
      const date = dateMatch ? new Date(parseInt(dateMatch[1]) * 1000) : new Date()

      if (!titleMatch || !magnetMatch || !hash) continue

      results.push({
        title: titleMatch[1],
        link: magnetMatch[1],
        hash,
        size,
        seeders,
        leechers,
        downloads: 0,
        verified: false,
        date,
        type: 'alt'
      })
    }

    return results
  }

  parseSize(val, unit) {
    const num = parseFloat(val)
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
