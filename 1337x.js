import AbstractSource from './abstract.js'

export default new class X1337x extends AbstractSource {
  url = atob('aHR0cHM6Ly9jb3JzcHJveHkubGlnaHRzcGVlZC5kZXYvP2NvcnM9') // proxy for https://1337x.to/

  /** @type {import('./').SearchFunction} */
  async single({ titles, resolution }) {
    if (!titles?.length) return []

    for (const title of titles) {
      const results = await this.search(`${title} ${resolution || ''}p`)
      if (results.length) return results
    }

    return []
  }

  batch = this.single
  movie = this.single

  async test() {
    const res = await fetch(this.url + encodeURIComponent('test'))
    return res.ok
  }

  async search(query) {
    const url = this.url + encodeURIComponent(`https://1337x.to/search/${query}/1/`)
    const response = await fetch(url)
    const html = await response.text()

    const entries = [...html.matchAll(/<a href="\/torrent\/([^"]+)"[^>]*>([^<]+)<\/a><\/td>\s*<td class="coll-2 seeds">(\d+)<\/td>\s*<td class="coll-3 leeches">(\d+)/g)]

    return await Promise.all(entries.slice(0, 8).map(async ([, path, title, seeds, leech]) => {
      try {
        const detailUrl = this.url + encodeURIComponent(`https://1337x.to/torrent/${path}`)
        const detailHtml = await (await fetch(detailUrl)).text()

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
      } catch {
        return null
      }
    })).then(results => results.filter(Boolean))
  }

  parseSize(text) {
    const [val, unit] = text.split(" ")
    const mult = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 }
    return parseFloat(val.replace(",", "")) * (mult[unit] || 1)
  }
}()
