export default class X1337xMovies {
  name = "1337xMovies";
  version = "1.0.0";

  async movie({ titles, resolution }) {
    for (const title of titles) {
      const results = await this.search1337x(`${title} ${resolution}p`);
      if (results.length) return results;
    }
    return [];
  }

  async single() {
    return [];
  }

  async batch() {
    return [];
  }

  async search1337x(query) {
    try {
      const response = await fetch(`https://corsproxy.io/?https://1337x.to/search/${encodeURIComponent(query)}/1/`);
      const html = await response.text();

      const entries = [...html.matchAll(
        /<a href="\/torrent\/([^"]+)"[^>]*>([^<]+)<\/a><\/td>\s*<td class="coll-2 seeds">(\d+)<\/td>\s*<td class="coll-3 leeches">(\d+)/g
      )];

      return await Promise.all(
        entries.slice(0, 8).map(async ([, path, title, seeds, leech]) => {
          const detailHtml = await (await fetch(`https://corsproxy.io/?https://1337x.to/torrent/${path}`)).text();

          const magnet = detailHtml.match(/href="(magnet:[^"]+)"/)?.[1] ?? "";
          const hash = magnet.match(/btih:([a-fA-F0-9]+)/)?.[1] ?? "";

          const sizeMatch = detailHtml.match(/Size<\/td>\s*<td colspan="2">([^<]+)<\/td>/);
          const size = parseSize(sizeMatch?.[1] ?? "0 B");

          const dateMatch = detailHtml.match(/Date uploaded<\/td>\s*<td colspan="2">([^<]+)<\/td>/);
          const date = new Date(dateMatch?.[1] ?? Date.now());

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
            type: "best"
          };
        })
      );
    } catch (err) {
      console.error("1337xMovies search failed:", err);
      return [];
    }
  }

 test() {
  return fetch("https://corsproxy.io/?https://1337x.to")
    .then(res => res.ok)
    .catch(() => false);
   }
}

function parseSize(text) {
  if (!text) return 0;
  const [val, unitRaw] = text.trim().split(" ");
  const unit = unitRaw?.toUpperCase() ?? "B";
  const mult = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 };
  return parseFloat(val.replace(",", "")) * (mult[unit] || 1);
}
