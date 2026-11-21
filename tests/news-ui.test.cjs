const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const load = require("./load-typescript.cjs");
test("Portal initial render includes disclosure and accessible search/source/retry controls", () => {
  assert.ok(fs.existsSync("src/components/NewsPortal.tsx"), "Missing news portal");
  const { NewsPortal } = load("src/components/NewsPortal.tsx");
  const html = renderToStaticMarkup(React.createElement(NewsPortal));
  assert.match(html, /Carregando notícias/);
  assert.match(html, /Buscar notícias/);
  assert.match(html, /Filtrar por fonte/);
  assert.match(html, /Atualizar/);
  assert.match(html, /credencial de IA/);
  assert.doesNotMatch(html, /Versículos/);
});
test("Search combines accented title matching with exact source filter", () => {
  assert.ok(fs.existsSync("src/lib/news.ts"), "Missing client filtering");
  const { filterNews } = load("src/lib/news.ts");
  const items = [
    { title: "Inteligência artificial", source: "Editor A" },
    { title: "Inteligência no trabalho", source: "Editor B" },
  ];
  assert.equal(filterNews(items, "INTELIGENCIA", "Editor A").length, 1);
  assert.equal(filterNews(items, "absent", "").length, 0);
});
