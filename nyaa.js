import AbstractSource from './abstract.js'

export default new class Nyaa extends AbstractSource {
  url = 'https://corsproxy.io/?https://nyaa.si'

  async single({ anilistId, titles, episodeCount }) {
    if (!anilistId) throw new Error('No anilistId provided')
    if (!titles?.length) throw new Error('No titles provided')

    const query = encodeURIComponent(titles[0])
    const res = await fetch(`${this.url}/?f=0&c=1_2&q=${query}&p=1`)
    const html = await res.text()

    const rows = html.match(/<tr class="(default|success)"[\s\S]+?<\/tr>/g) || []

    return rows.map(row => {
      const title = row.match(/title="[^"]+">([^<]+)<\/a>/)?.[1] ?? 'Unknown Title'

      const magnet = row.match(/href="(magnet:\?[^"]+)"/)?.[1] ?? ''
      const infoHash = magnet.match(/btih:([a-f0-9]{40})/)?.[1] ?? ''

      const sizeMatch = row.match(/<td class="text-center">([\d.]+) ([MGK]i?B)<\/td>/)
      const units = { KiB: 1024, MiB: 1048576, GiB: 1073741824 }
      const size = sizeMatch ? parseFloat(sizeMatch[1]) * (units[sizeMatch[2]] || 1) : 0

      const stats = [...row.matchAll(/<td class="text-center">(\d+)<\/td>/g)]
      const seeders = parseInt(stats.at(-3)?.[1] ?? 0)
      const leechers = parseInt(stats.at(-2)?.[1] ?? 0)

      const dateMatch = row.match(/data-timestamp="(\d+)"/)
      const date = dateMatch ? new Date(parseInt(dateMatch[1]) * 1000) : new Date()

      return {
        hash: infoHash,
        link: magnet,
        title,
        size,
        type: 'alt',
        date,
        seeders,
        leechers,
        downloads: 0,
        accuracy: 'medium'
      }
    })
  }

  batch = this.single
  movie = this.single

  async test() {
    const res = await fetch(this.url)
    return res.ok
  }
}()
