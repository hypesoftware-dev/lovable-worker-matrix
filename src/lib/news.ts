export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
}
export interface NewsResponse {
  items: NewsItem[];
  updatedAt: string;
  stale: boolean;
  warning: string | null;
}
export function filterNews<T extends { title: string; source: string }>(
  items: T[],
  query: string,
  source: string,
): T[] {
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  return items.filter(
    (item) =>
      (!source || item.source === source) &&
      normalize(item.title).includes(normalize(query.trim())),
  );
}
