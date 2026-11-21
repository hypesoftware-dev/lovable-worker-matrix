import { createFileRoute } from "@tanstack/react-router";
import { NewsPortal } from "@/components/NewsPortal";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Observatório IA — notícias recentes" },
      {
        name: "description",
        content:
          "Pesquisa, produtos e impacto da inteligência artificial em uma leitura essencial.",
      },
    ],
  }),
  component: NewsPortal,
});
