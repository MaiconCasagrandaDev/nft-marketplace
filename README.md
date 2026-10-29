# Kurio — Marketplace de NFTs (Desafio Frontend)

Marketplace de NFTs em React, com **API e servidor de tempo real simulados no navegador via MSW**. Todo fluxo (catálogo, favoritos, carrinho, checkout, pedido) passa por requisições HTTP e por um socket reais interceptados pelo MSW — nenhum evento é disparado direto na interface.

- **URL pública:** _(preencher com a URL da Vercel)_
- **Repositório:** _(preencher)_

## Stack

Vite + React + TypeScript (`strict`) · Tailwind CSS v4 · shadcn/ui (Radix) · TanStack Router · TanStack Query v5 · Axios · MSW 2 (REST + WebSocket) · socket.io-client · zod + react-hook-form · decimal.js · Playwright.

## Como rodar

```bash
npm ci
npm run dev          # http://localhost:5173
npm run build        # tsc -b && vite build
npm run preview      # serve o build
npm run test:e2e     # Playwright (sobe o servidor sozinho)
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_USE_MOCKS` | `true` | `false` desliga o MSW (a API passa a ser esperada em `/api`). |

O realtime usa a URL fictícia `wss://realtime.kurio.test`, interceptada pelo MSW (`src/lib/config.ts`).

## Credenciais fictícias

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Ana | `ana@kurio.test` | `Senha@123` |
| Bruno | `bruno@kurio.test` | `Senha@456` |

Também é possível criar uma conta em **Entrar → Criar conta**.

## Banco simulado, cenários e reset

O banco do mock fica no `localStorage` (`kurio:mock-db:v4`) e sobrevive a recarregamentos. No Console do navegador existe o objeto `window.kurioMock`:

| Comando | Efeito |
| --- | --- |
| `kurioMock.reset()` | Restaura o banco inicial. |
| `kurioMock.expireSessions()` | Expira todas as sessões (a próxima chamada devolve 401). |
| `kurioMock.listNfts()` | Lista id, preço, estoque e versão dos NFTs. |
| `kurioMock.setPrice("nft-009", "0.50")` | Muda o preço e emite `nft.updated` pelo socket. |
| `kurioMock.setStock("nft-009", 0)` | Muda o estoque e emite `nft.updated`. |
| `kurioMock.replayLastEvent()` | Reenvia o último evento (duplicado). |
| `kurioMock.emitStaleEvent("nft-009")` | Envia um evento com versão antiga. |
| `kurioMock.disconnectSockets(4000)` | Derruba o socket e recusa reconexão por 4 s. |
| `kurioMock.setScenario(...)` | Ativa falhas: favoritos (`failFavorites`), timeout do pedido (`orderTimeout`), carteira (`walletMode`: `approve` \| `reject` \| `disconnect`). _(conferir a assinatura em `src/mocks/controls.ts`)_ |

### Como reproduzir falhas

- **Favorito falha e volta atrás (rollback):** ative `failFavorites` e clique no coração em um NFT.
- **Pagamento recusado:** `walletMode: "reject"` e conclua o checkout → pedido `rejected`.
- **Carteira desconectada:** `walletMode: "disconnect"` ao conectar a carteira.
- **Timeout + idempotência:** ative `orderTimeout` e confirme o pedido → mensagem de timeout; ao tentar de novo, o mesmo pedido não é duplicado.
- **Sessão expirada:** `kurioMock.expireSessions()` e navegue → volta ao login com a rota de retorno.
- **Preço muda durante o checkout:** na revisão do pedido, rode `kurioMock.setPrice(...)` → "Confirmar novos valores".
- **Evento duplicado ou atrasado:** `replayLastEvent()` / `emitStaleEvent(id)` → a UI ignora.
- **Queda do socket:** `disconnectSockets(4000)` → reconecta e reconcilia com a API.

## Estrutura

```
src/
  components/layout   Header, Footer, Layout
  features/           auth, cart, catalog, checkout, favorites, home, realtime
  lib/                api (axios), auth-store, guards, config, format, labels
  mocks/              handlers MSW (REST + WebSocket), db, controles
  routes/             páginas
  types/
e2e/                  testes Playwright
```

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para contratos, cache, reconciliação REST↔socket, limitações e desvios do Figma.