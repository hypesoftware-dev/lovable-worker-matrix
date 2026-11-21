# Observatório IA

Portal independente em pt-BR: Pesquisa, produtos e impacto da inteligência artificial em uma leitura essencial.

## Executar no Windows

Node.js 22+, npm 10+. Abra `INICIAR.bat` ou:

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5101
```

Não depende de nenhuma pasta irmã. Não exige chave para notícias.

## Dados e limites

`GET /api/news` consulta somente o endpoint fixo abaixo; parâmetros são rejeitados (não é proxy aberto).

https://news.google.com/rss/search?q=intelig%C3%AAncia%20artificial%20when%3A7d&hl=pt-BR&gl=BR&ceid=BR:pt-419

Google News RSS gratuito, português/Brasil, janela solicitada de 7 dias, até 60 manchetes ordenadas por publicação. Fonte, data BRT e link original em cada item. Sem notícias inventadas e sem HTML RSS injetado. Índice automatizado: atrasos, indisponibilidade e cobertura variam; artigos podem exigir assinatura. Acesso público não concede direitos de republicação: conservamos apenas manchetes e atribuição, não o texto integral. Não existe SLA nem promessa de tempo real.

Timeout upstream 5 s, cache em memória 5 min, requisições simultâneas deduplicadas, atualização cliente 5 min. Falha com cache mantém a última coleta marcada desatualizada e tenta fonte após 30 s; falha inicial retorna HTTP 502. Estados loading, erro, vazio, busca sem acentos, filtro por fonte e retry manual. O botão respeita cache do servidor. Cache é local à instância e reinicia com o processo.

## Integração preservada

Arquivos de handshake e `__root.tsx` preservados byte a byte. O gatilho original continua: este projeto registra sua credencial de IA no servidor da central para uso pelo gateway api.delvertokens.store, sem expô-la no navegador. Não preencher `.env` para testar notícias; não há chave live adicionada. O gateway não foi testado contra domínio de registro autorizado. Histórico de documentação anterior não descreve o novo frontend.

## Verificação

```sh
npm test
npm run typecheck
npm run build
npm run lint
```

Resultados executados, hashes e smoke HTTP em `VERIFICACAO.json` e logs em `verificacao/`.
