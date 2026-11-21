const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const load = require("./load-typescript.cjs");
test("RSS real parser preserves attribution, publication date and safe links", async () => {
  assert.ok(fs.existsSync("src/lib/news.server.ts"), "Missing server-side RSS adapter");
  const { parseNews } = load("src/lib/news.server.ts");
  const xml =
    '<rss version="2.0"><channel><title>Test fixture (not live news)</title><item><title>Teste &amp; validação - Editor</title><link>https://example.test/article</link><pubDate>Mon, 02 Nov 2026 09:00:00 GMT</pubDate><source url="https://example.test">Editor</source><description>&lt;b&gt;Texto&lt;/b&gt;</description></item><item><title>Unsafe</title><link>javascript:alert(1)</link></item></channel></rss>';
  const items = await parseNews(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].source, "Editor");
  assert.equal(items[0].title, "Teste & validação");
  assert.equal(items[0].publishedAt, "2026-11-02T09:00:00.000Z");
  assert.equal(items[0].link, "https://example.test/article");
});

test("RSS rejects malformed XML and represents empty feeds without invented items", async () => {
  const { parseNews } = load("src/lib/news.server.ts");
  assert.deepEqual(
    await parseNews('<rss version="2.0"><channel><title>Empty</title></channel></rss>'),
    [],
  );
  await assert.rejects(() => parseNews("invalid XML"));
});
test("Feed service caches for five minutes, deduplicates requests and marks stale on failure", async () => {
  const { createNewsService, FEED_URL } = load("src/lib/news.server.ts");
  assert.equal(typeof createNewsService, "function", "Missing bounded cached feed service");
  assert.ok(FEED_URL.startsWith("https://news.google.com/rss/search?"));
  let calls = 0,
    now = 0,
    failing = false;
  const xml =
    '<rss version="2.0"><channel><title>Fixture</title><item><title>Fixture only</title><link>https://example.test/item</link></item></channel></rss>';
  const service = createNewsService(
    async (url, options) => {
      calls++;
      assert.equal(url, FEED_URL);
      assert.equal(options.redirect, "error");
      assert.ok(options.signal instanceof AbortSignal);
      if (failing) throw new Error("Source down");
      return new Response(xml);
    },
    () => now,
  );
  const results = await Promise.all([service(), service()]);
  assert.equal(calls, 1);
  assert.equal(results[0].items.length, 1);
  assert.equal(results[0].stale, false);
  now = 299999;
  await service();
  assert.equal(calls, 1);
  now = 300001;
  failing = true;
  const stale = await service();
  assert.equal(calls, 2);
  assert.equal(stale.stale, true);
  assert.equal(stale.updatedAt, results[0].updatedAt);
  assert.ok(stale.warning);
});
test("Feed service exposes initial network errors instead of fabricating headlines", async () => {
  const { createNewsService } = load("src/lib/news.server.ts");
  assert.equal(typeof createNewsService, "function");
  await assert.rejects(() =>
    createNewsService(async () => new Response("unavailable", { status: 503 }))(),
  );
});
