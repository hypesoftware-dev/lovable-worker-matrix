import Parser from "rss-parser";
export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
}
export async function parseNews(xml: string): Promise<NewsItem[]> {
  const feed = await new Parser<Record<string, unknown>, { source?: { _: string } | string }>({
    customFields: { item: ["source"] },
  }).parseString(xml);
  const seen = new Set<string>();
  return feed.items
    .flatMap((item) => {
      if (!item.title || !item.link) return [];
      let url: URL;
      try {
        url = new URL(item.link);
      } catch {
        return [];
      }
      if (!["https:", "http:"].includes(url.protocol) || seen.has(url.href)) return [];
      seen.add(url.href);
      const source =
        typeof item.source === "string"
          ? item.source
          : item.source?._ || item.creator || "Fonte não informada";
      const date = item.isoDate || item.pubDate;
      const publishedAt =
        date && Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : null;
      return [
        {
          title: item.title.endsWith(` - ${source}`)
            ? item.title.slice(0, -(source.length + 3))
            : item.title,
          link: url.href,
          source,
          publishedAt,
        },
      ];
    })
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, 60);
}

export const FEED_URL =
  "https://news.google.com/rss/search?q=intelig%C3%AAncia%20artificial%20when%3A7d&hl=pt-BR&gl=BR&ceid=BR:pt-419";

export interface NewsResponse {
  items: NewsItem[];
  updatedAt: string;
  stale: boolean;
  warning: string | null;
  feedUrl: string;
}
export function createNewsService(fetcher: typeof fetch = fetch, clock: () => number = Date.now) {
  let cached: NewsResponse | null = null;
  let fetchedAt = 0;
  let retryAfter = 0;
  let pending: Promise<NewsResponse> | null = null;
  return async function get(): Promise<NewsResponse> {
    const now = clock();
    if (cached && (now < retryAfter || (!cached.stale && now - fetchedAt < 300000))) return cached;
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetcher(FEED_URL, {
          signal: AbortSignal.timeout(5000),
          redirect: "error",
          headers: { Accept: "application/rss+xml, application/xml" },
        });
        if (!response.ok) throw new Error(`RSS HTTP ${response.status}`);
        const xml = await response.text();
        if (xml.length > 2000000) throw new Error("Feed acima do limite");
        const items = await parseNews(xml);
        fetchedAt = clock();
        cached = {
          items,
          updatedAt: new Date(fetchedAt).toISOString(),
          stale: false,
          warning: null,
          feedUrl: FEED_URL,
        };
        return cached;
      } catch (error) {
        if (!cached) throw error;
        retryAfter = clock() + 30000;
        cached = {
          ...cached,
          stale: true,
          warning:
            "A fonte não respondeu. Exibindo a última coleta; notícias podem estar desatualizadas.",
        };
        return cached;
      } finally {
        pending = null;
      }
    })();
    return pending;
  };
}
export const getNews = createNewsService();
