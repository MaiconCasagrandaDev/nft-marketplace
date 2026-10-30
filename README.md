# Kurio — Marketplace de NFTs (Desafio Frontend)

Marketplace de NFTs em React, com **API e servidor de tempo real simulados no navegador via MSW**. Todo fluxo (catálogo, favoritos, carrinho, checkout, pedido, perfil e carteiras) passa por requisições HTTP e por um socket reais interceptados pelo MSW — nenhum evento é disparado direto na interface.

- **URL pública:** https://nft-marketplace-maicon99.vercel.app/
- **Repositório:** https://github.com/MaiconCasagrandaDev/nft-marketplace

## Stack

Vite + React + TypeScript (`strict`) · Tailwind CSS v4 · shadcn/ui (Radix) · TanStack Router · TanStack Query v5 · Axios · MSW 2 (REST + WebSocket) · socket.io-client · zod + react-hook-form · decimal.js · Playwright.

## Como rodar

```bash
npm ci
npm run dev          # http://localhost:5173 (com mocks MSW)
npm run build        # tsc -b && vite build
npm run preview      # serve o build em http://localhost:4173
npm run typecheck    # verificação de tipos
npm run lint         # ESLint
npm run test:e2e     # Playwright (faz o build e serve em :4173 sozinho)
npm run lighthouse   # auditoria Lighthouse (com o preview rodando); relatório em reports/lighthouse/
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

## Telas e fluxos

- **Início e catálogo:** busca, filtros, ordenação e página ficam na URL.
- **Detalhe do NFT:** preço e estoque ao vivo por socket, favoritar com rollback.
- **Carrinho → Pagamento → Pedido:** cotação com `quoteId`, confirmação de novos valores, pedido idempotente e confirmação só após a resposta da simulação.
- **Perfil (`/profile`):** dados do colecionador, avatar e troca de senha (requer login).
- **Carteiras (`/wallets`):** carteira principal e secundárias, com criar, editar, tornar principal e excluir (requer login).
- **Lista de interesse (`/favorites`):** NFTs favoritados do usuário, com os mesmos cards do catálogo (requer login).
- **Responsivo:** desktop e mobile (375 px). No celular a navegação é só pela barra inferior; no desktop, pelo cabeçalho e pelo menu lateral da conta.

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
| `kurioMock.setScenario("walletMode", "reject")` | Ativa falhas: `failFavorites` (`true`/`false`), `orderTimeout` (`true`/`false`), `walletMode` (`"approve"` \| `"reject"` \| `"disconnect"`). Os cenários ficam em memória e voltam ao padrão ao recarregar a página. |

### Como reproduzir falhas

- **Favorito falha e volta atrás (rollback):** `kurioMock.setScenario("failFavorites", true)` e clique em **Favoritar** na página de um NFT.
- **Pagamento recusado:** `kurioMock.setScenario("walletMode", "reject")` e conclua o checkout → pedido `rejected`.
- **Carteira desconectada:** `kurioMock.setScenario("walletMode", "disconnect")` e clique em "Conectar carteira".
- **Timeout + idempotência:** `kurioMock.setScenario("orderTimeout", true)` e confirme o pedido → mensagem de timeout; ao tentar de novo, o mesmo pedido não é duplicado.
- **Sessão expirada:** `kurioMock.expireSessions()` e navegue → volta ao login com a rota de retorno.
- **Preço muda durante o checkout:** na revisão do pedido, rode `kurioMock.setPrice(...)` → "Confirmar novos valores".
- **Evento duplicado ou atrasado:** `replayLastEvent()` / `emitStaleEvent(id)` → a UI ignora.
- **Queda do socket:** `disconnectSockets(4000)` → reconecta e reconcilia com a API.
- **Erros de perfil e carteira:** em `/profile`, e-mail ou usuário já em uso e senha atual incorreta devolvem `422` com erro por campo; em `/wallets`, endereço inválido ou repetido também devolve `422`, e excluir a única carteira devolve `409 LAST_WALLET`.

## Testes (Playwright)

```bash
npx playwright install chromium   # primeira vez
npm run test:e2e
```

16 testes, sempre com MSW (sem dados fixos na UI), em Chromium desktop:

- **Catálogo** (`catalog.spec.ts`): busca vinda da URL que sobrevive ao recarregar; ordenação e página na URL.
- **Compra** (`purchase.spec.ts`): rota privada redirecionando ao login; compra completa do detalhe até o pedido confirmado; mudança de preço na revisão exigindo confirmar os novos valores.
- **Falhas** (`failures.spec.ts`): pagamento recusado mantendo os itens no carrinho; timeout na confirmação sem duplicar o pedido (idempotência); rollback de favorito quando a API falha.
- **Tempo real** (`realtime.spec.ts`): preço ao vivo por socket; evento duplicado e evento atrasado ignorados; reconciliação com a API após queda do socket.
- **Conta** (`account.spec.ts`): edição de perfil com persistência ao navegar; validação de campos e senha atual incorreta; ciclo de carteiras (criar secundária, tornar principal e excluir).
- **Favoritos** (`favorites.spec.ts`): favoritar no detalhe leva o NFT para a Lista de interesse.
- **Smoke** (`smoke.spec.ts`): o app sobe com a API simulada e mostra um NFT.

## Desempenho e acessibilidade

Lighthouse (mobile, janela anônima, URL pública): **Acessibilidade 100**, **Práticas recomendadas 100**, **Desempenho 70**. O custo de desempenho vem da API simulada rodando no navegador (o pacote do MSW leva cerca de 0,9 s de CPU no perfil de celular lento do Lighthouse). As telas são carregadas por rota sob demanda (veja o ARCHITECTURE.md). O SEO fica em 66 porque o Vercel envia `x-robots-tag: noindex` neste endereço.

## Estrutura

```
src/
  components/layout   Header, Footer, BottomNav, Layout
  features/           account, auth, cart, catalog, checkout, favorites, home, realtime
  lib/                api (axios), auth-store, guards, config, format, labels
  mocks/              handlers MSW (REST + WebSocket), db, controles
  routes/             páginas
  types/
e2e/                  testes Playwright
```

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para contratos, cache, reconciliação REST↔socket, limitações e desvios do Figma.