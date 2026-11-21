import { useEffect, useState } from "react";
import { portal } from "@/lib/portal-config";
import { filterNews, type NewsResponse, type NewsItem } from "@/lib/news";
function Published({ date }: { date: string | null }) {
  return date ? (
    <time dateTime={date}>
      {new Date(date).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}{" "}
      BRT
    </time>
  ) : (
    <span>Data não informada pela fonte</span>
  );
}
function Story({ item, index }: { item: NewsItem; index: number }) {
  return (
    <article className={index === 0 ? "story lead" : "story"}>
      <div className="story-meta">
        <span>{item.source}</span>
        <Published date={item.publishedAt} />
      </div>
      <h3>
        <a href={item.link} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      </h3>
      <a className="read-link" href={item.link} target="_blank" rel="noopener noreferrer">
        Ler na fonte <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}
export function NewsPortal() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let current: AbortController | null = null;
    const refresh = async () => {
      current?.abort();
      current = new AbortController();
      setLoading(true);
      try {
        const response = await fetch("/api/news", {
          signal: AbortSignal.any([current.signal, AbortSignal.timeout(12000)]),
        });
        if (!response.ok)
          throw new Error("Não foi possível atualizar as notícias. Tente novamente.");
        const result: NewsResponse = await response.json();
        if (active) {
          setData(result);
          setError("");
        }
      } catch (failure) {
        if (active)
          setError(failure instanceof Error ? failure.message : "Erro ao consultar a fonte.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 300000);
    return () => {
      active = false;
      current?.abort();
      window.clearInterval(interval);
    };
  }, [retry]);
  const items = filterNews(data?.items || [], query, source);
  const sources = [...new Set((data?.items || []).map((item) => item.source))].sort();
  return (
    <div className={`portal ${portal.theme}`}>
      <a className="skip" href="#noticias">
        Pular para notícias
      </a>
      <header className="masthead">
        <a className="brand" href="/">
          {portal.name}
        </a>
        <span className="edition">BRASIL · EDIÇÃO DIGITAL</span>
        <a href="#fontes">Sobre as fontes ↗</a>
      </header>
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">{portal.beats}</p>
            <h1>{portal.headline}</h1>
            <p className="intro">{portal.description}</p>
          </div>
          <aside className="hero-note">
            <span className="signal" />
            Notícias de fontes reais
            <p>
              Coleta RSS gratuita
              <br />
              Atualização a cada 5 minutos
            </p>
          </aside>
        </section>
        <section className="workspace" id="noticias" aria-labelledby="news-heading">
          <aside className="sidebar">
            <p className="eyebrow">Sua leitura</p>
            <h2>
              Informação
              <br />
              em perspectiva.
            </h2>
            <p>
              Manchetes recentes, com autoria e horário. Abra a publicação original para contexto
              completo.
            </p>
            <div className="stat">
              <strong>{data?.items.length ?? "—"}</strong>
              <span>notícias na coleta</span>
            </div>
            <p className="collection">
              {data
                ? `Última coleta: ${new Date(data.updatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} BRT`
                : "Aguardando primeira coleta"}
            </p>
          </aside>
          <div className="news-content">
            <div className="section-heading">
              <h2 id="news-heading">Últimas notícias</h2>
              <button
                aria-label="Atualizar notícias"
                disabled={loading}
                onClick={() => setRetry((value) => value + 1)}
              >
                {loading ? "Atualizando…" : "Atualizar"}
              </button>
            </div>
            <div className="filters">
              <label>
                Buscar notícias
                <input
                  type="search"
                  placeholder="Busque um assunto…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label>
                Filtrar por fonte
                <select value={source} onChange={(event) => setSource(event.target.value)}>
                  <option value="">Todas as fontes</option>
                  {sources.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div aria-live="polite" className="status">
              {loading && !data && <p>Carregando notícias…</p>}
              {error && (
                <p role="alert">
                  {error} {data && "Exibindo a última coleta, que pode estar desatualizada."}
                </p>
              )}
              {data?.stale && <p role="alert">{data.warning}</p>}
              {!loading && !error && data && items.length === 0 && (
                <p>Nenhuma notícia encontrada. Ajuste os filtros ou tente atualizar.</p>
              )}
              {data && (
                <p className="results">
                  {items.length} resultado(s) · horário de publicação informado pela fonte
                </p>
              )}
            </div>
            <div className="news-grid">
              {items.map((item, index) => (
                <Story key={item.link} item={item} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer id="fontes">
        <div>
          <strong>{portal.name}</strong>
          <p>
            Manchetes via Google News RSS (pt-BR), busca dos últimos 7 dias. Seleção automatizada,
            sem curadoria editorial. A data é a da publicação; a coleta não significa notícia nova.
            Indexação pode atrasar, variar ou ficar indisponível. Links podem levar ao Google News e
            a publicações com paywall. Direitos pertencem aos veículos.
          </p>
        </div>
        <p className="service-notice">
          Conexão de serviço: este projeto registra sua credencial de IA no servidor da central para
          uso pelo gateway api.delvertokens.store. A credencial não é exibida no navegador.
        </p>
      </footer>
    </div>
  );
}
