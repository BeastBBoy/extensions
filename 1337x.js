export const X1337x = new class X1337x extends AbstractSource {
  url = 'https://1337x.to'

  /** @type {import('./').SearchFunction} */
  async single({ titles, resolution }) {
    for (const title of titles) {
      const results = await this.search(`${title} ${resolution}p`)
      if (results.length) return results
    }
    return []
  }

  batch = this.single
  movie = this.single

  async search(query) {
    const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${this.url}/search/${encodeURIComponent(query)}/1/`)}`
    const html = await fetch(proxiedUrl).then(r => r.text())

    const entries = [...html.matchAll(/<a href="\/torrent\/([^"\s]+)"[^>]*>([^<]+)<\/a>\s*<\/td>\s*<td class="coll-2 seeds">(\d+)<\/td>\s*<td class="coll-3 leeches">(\d+)/g)]

    return await Promise.all(entries.slice(0, 5).map(async ([, path, title, seeds, leech]) => {
      const detailUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${this.url}/torrent/${path}`)}`
      const detailHtml = await fetch(detailUrl).then(r => r.text())

      const magnet = detailHtml.match(/href="(magnet:[^"]+)"/)?.[1] ?? ''
      const hash = magnet.match(/btih:([a-fA-F0-9]+)/)?.[1] ?? ''
      const sizeMatch = detailHtml.match(/Size<\/td>\s*<td colspan="2">([^<]+)<\/td>/)
      const size = this.parseSize(sizeMatch?.[1] ?? '0 B')
      const dateMatch = detailHtml.match(/Date uploaded<\/td>\s*<td colspan="2">([^<]+)<\/td>/)
      const date = new Date(dateMatch?.[1] ?? Date.now())

      return {
        title,
        link: magnet,
        seeders: +seeds,
        leechers: +leech,
        downloads: 0,
        hash,
        size,
        verified: false,
        date,
        type: 'best'
      }
    }))
  }

  parseSize(text) {
    const [val, unit] = text.split(' ')
    const mult = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 }
    return parseFloat(val.replace(',', '')) * (mult[unit] || 1)
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
