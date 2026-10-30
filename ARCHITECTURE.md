# Arquitetura — Kurio

## Visão geral

SPA em React. Estado do servidor no **TanStack Query**; estado de URL no **TanStack Router** (filtros, ordenação e página do catálogo ficam na query string, validados com zod). O backend é simulado pelo **MSW** (REST e WebSocket) com um banco em `localStorage`.

```
UI (features) → hooks TanStack Query → axios (/api) → MSW handlers → db (localStorage)
                          ↑                                   │
                          └── useRealtime (socket.io) ←───────┘  eventos nft.updated / order.updated
```

## Contratos

Base `/api`. Erros: `{ code, message, available?, fields? }`.

| Método e rota | Descrição |
| --- | --- |
| `GET /nfts`, `/nfts/facets`, `/nfts/:id` | Catálogo paginado, facetas, detalhe. |
| `POST /auth/login`, `/auth/register`, `GET /auth/session`, `POST /auth/logout` | Sessão por token Bearer (expira em 1 h). |
| `GET/POST/PATCH/DELETE /cart…` | Carrinho; cupom em `/cart/coupon`. O carrinho de visitante é mesclado ao do usuário no login. |
| `GET/PUT/DELETE /favorites…` | Favoritos por usuário. |
| `GET /wallets`, `POST /wallets/:id/connect` | Carteiras do usuário e conexão (cenário simulado). |
| `GET /checkout/quote` | Cotação com `quoteId` (hash de itens, preços, cupom, taxa e total) e `issues` de disponibilidade. |
| `POST /orders` | Cria o pedido. Exige `Idempotency-Key` e `quoteId`. |
| `GET /orders/:id` | Pedido do próprio usuário (de outro usuário → 404). |

Pedido: `pending → confirmed | rejected`. A confirmação só ocorre após a resposta da simulação (liquidação em ~2,5 s); apenas os itens comprados saem do carrinho e o estoque é decrementado na confirmação.

### Idempotência e quote

- Mesma `Idempotency-Key` + mesmo corpo → mesmo pedido (200).
- Mesma chave + corpo diferente → `409 IDEMPOTENCY_CONFLICT`.
- `quoteId` diferente do atual → `409 QUOTE_CHANGED` (a resposta inclui a nova cotação) e a UI exige "Confirmar novos valores".
- Estoque insuficiente → `AVAILABILITY_CHANGED`.

### Eventos de tempo real

Envelope: `{ id, type, resource, version, occurredAt, data }`, com os tipos `nft.updated` (para todos) e `order.updated` (apenas para o dono). O token vai na query da conexão e o servidor falso filtra por usuário.

## Política de cache e retry (TanStack Query)

- Chaves: `["nfts", params]`, `["nft", id]`, `["cart"]`, `["favorites"]`, `["session"]`, `["quote"]`, `["wallets"]`, `["order", id]`.
- O catálogo usa `keepPreviousData` para não piscar entre páginas; as requisições são canceladas via `signal`.
- Detalhe do NFT: não repete em 404; até 2 tentativas nos demais erros.
- Favoritos: atualização otimista com rollback em caso de erro.
- Pedido pendente: `refetchInterval` de 4 s até sair de `pending`.
- Criação de pedido: timeout de 8 s no cliente; a mesma `Idempotency-Key` é reaproveitada na nova tentativa.
- 401 com `SESSION_EXPIRED`/`UNAUTHORIZED`: o interceptor limpa o token e redireciona ao login com retorno seguro. O logout faz `queryClient.clear()` para não vazar dados entre usuários.

## Reconciliação REST ↔ socket

1. O cliente **deduplica por `id`** e ignora eventos com `version` menor ou igual à última vista do recurso.
2. Ao aceitar um evento, invalida as consultas afetadas (tudo exceto `session` e `orders`); a API REST continua sendo a fonte da verdade.
3. Na **reconexão**, o cliente reconcilia invalidando as mesmas consultas.
4. O socket reabre quando o token muda (login/logout).
5. Os avisos aparecem numa região `aria-live` (`LiveNotices`) no carrinho, no checkout e no detalhe do NFT.
6. No checkout, uma mudança de preço gera nova cotação e a revisão exige confirmar os novos valores.

O `socket.io-client` é importado dinamicamente depois que o MSW inicia; caso contrário ele captura o `WebSocket` nativo antes da interceptação. O servidor falso envia ping do Engine.IO a cada 5 s para evitar *ping timeout*.

## Limitações conhecidas

- Dados e "blockchain" são simulados; o hash de transação e o link do explorer são fictícios.
- O banco vive no `localStorage` do navegador e não é compartilhado entre navegadores.
- A URL de realtime é fictícia (`wss://realtime.kurio.test`) e só funciona com o MSW ativo.
- O `@mswjs/socket.io-binding` não tem *broadcast*: o servidor falso mantém seu próprio registro de clientes.
- Bundle único acima de 500 kB (aviso do Vite); não há divisão de código por rota nesta versão.

## Desvios do Figma

- Hero em português; abas "Novos lançamentos" e "Em alta" desabilitadas ("Em breve").
- Login e cadastro como páginas próprias (não há frames no Figma).
- Sem coração de favorito nos cards (não está no Figma); favoritar fica no detalhe.
- Detalhe: avaliações (19), chips de edição, miniaturas, atributos e textos de contrato/direitos são **conteúdo estático**, como no Figma; o ícone de X foi substituído pelo do Twitter em SVG; os títulos "Contrato" e "Direitos autorais" foram corrigidos para casar com o texto.
- Pagamento: os campos do Figma sem equivalente no contrato (nome de usuário, nome do perfil, ENS/carteira secundária, código de indicação, nome ENS, "usar outra carteira" e observação) são exibidos mas não enviados nem validados; telefone não é coletado.
- Newsletter: `POST /api/newsletter` simulado.
- Mobile: o Figma não traz frames mobile; a versão de 375 px é uma adaptação própria (cabeçalho, filtros, carrinho, pagamento e confirmação em coluna única).