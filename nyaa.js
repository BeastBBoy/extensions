import AbstractExtension from "./abstract.js";

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
      link: item.magnet,
      hash: item.infoHash || "",
      size: item.size_bytes || 0,
      seeders: item.seeders,
      leechers: item.leechers,
      date: new Date(item.pubDate),
    }));
  }

  async getInfo(item) {
    return item;
  }

  async test() {
    return true;
  }
}
