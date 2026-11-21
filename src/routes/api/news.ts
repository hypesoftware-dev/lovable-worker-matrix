import { createFileRoute } from "@tanstack/react-router";
import { getNews } from "@/lib/news.server";
export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (new URL(request.url).search)
          return Response.json(
            { error: "Este endpoint não aceita parâmetros ou URLs externas." },
            { status: 400 },
          );
        try {
          return Response.json(await getNews(), { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json(
            { error: "Não foi possível consultar o RSS. Tente novamente em instantes." },
            { status: 502 },
          );
        }
      },
    },
  },
});
