import AbstractExtension from "./abstract";

export default class NyaapiExtension extends AbstractExtension {
  constructor() {
    super({
      id: "nyaapi",
      name: "Nyaapi",
      version: "1.0.0",
      homepage: "https://nyaapi.deno.dev",
      icon: "https://nyaapi.deno.dev/favicon.ico",
    });
  }

  async search(query, page = 1) {
    const url = new URL("https://nyaapi.deno.dev/nyaa");
    url.searchParams.set("q", query);
    url.searchParams.set("page", page.toString());

    const resp = await fetch(url.toString());
    const data = await resp.json();

    return data.results.map(item => ({
      title: item.name,
      link: item.link,
      download: item.torrent,
      magnet: item.magnet,
      seeds: item.seeders,
      peers: item.leechers,
      size: item.size,
      time: new Date(item.pubDate).getTime(),
    }));
  }

  async getInfo(item) {
    return item;
  }

  async test() {
    try {
      const res = await fetch("https://nyaapi.deno.dev/nyaa?q=test");
      return res.ok;
    } catch {
      return false;
    }
  }
}
