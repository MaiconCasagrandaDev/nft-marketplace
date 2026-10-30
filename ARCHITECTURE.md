# Arquitetura — Kurio

## Visão geral

SPA em React. Estado do servidor no **TanStack Query**; estado de URL no **TanStack Router** (filtros, ordenação e página do catálogo ficam na query string, validados com zod). O backend é simulado pelo **MSW** (REST e WebSocket) com um banco em `localStorage`.

```
UI (features) → hooks TanStack Query → axios (/api) → MSW handlers → db (localStorage)
                          ↑                                   │
                          └── useRealtime (socket.io) ←───────┘  eventos nft.updated / order.updated
```

## Contratos

Base `/api`. Erros: `{ code, message, available?, fields? }`. Erros de validação voltam com `422` e `fields` (mensagem por campo), que os formulários exibem junto de cada campo.

| Método e rota | Descrição |
| --- | --- |
| `GET /nfts`, `/nfts/facets`, `/nfts/:id` | Catálogo paginado, facetas, detalhe. |
| `POST /auth/login`, `/auth/register`, `GET /auth/me`, `POST /auth/logout` | Sessão por token Bearer (expira em 1 h). |
| `PATCH /auth/me` | Atualiza nome de exibição, usuário, e-mail, ENS e avatar (data URL de até ~300 kB). Valida formato e unicidade de usuário e e-mail. |
| `POST /auth/password` | Troca a senha; exige a senha atual (`422` com `fields.currentPassword` se estiver errada). |
| `GET/POST/PATCH/DELETE /cart…` | Carrinho; cupom em `/cart/coupon`. O carrinho de visitante é mesclado ao do usuário no login. |
| `GET/PUT/DELETE /favorites…` | Favoritos por usuário. |
| `GET /wallets`, `POST /wallets/:id/connect` | Carteiras do usuário e conexão (cenário simulado). |
| `POST /wallets`, `PATCH /wallets/:id`, `DELETE /wallets/:id` | Cria, edita e exclui carteiras. Endereço EVM (`0x` + 40 hex) ou Solana; endereço repetido → `422`; só uma carteira principal por usuário; excluir a única carteira → `409 LAST_WALLET`; excluir a principal promove outra. |
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
- Perfil: a resposta do `PATCH /auth/me` atualiza `["session"]` direto no cache (`setQueryData`), então o cabeçalho reflete a mudança sem nova requisição.
- Carteiras: criar, editar, tornar principal e excluir invalidam `["wallets"]`, e a mutação só termina depois do refetch, para a tela não piscar dados antigos.
- 401 com `SESSION_EXPIRED`/`UNAUTHORIZED`: o interceptor limpa o token e redireciona ao login com retorno seguro. O logout faz `queryClient.clear()` para não vazar dados entre usuários.

## Reconciliação REST ↔ socket

1. O cliente **deduplica por `id`** e ignora eventos com `version` menor ou igual à última vista do recurso.
2. Ao aceitar um evento, invalida as consultas afetadas (tudo exceto `session` e `orders`); a API REST continua sendo a fonte da verdade.
3. Na **reconexão**, o cliente reconcilia invalidando as mesmas consultas.
4. O socket reabre quando o token muda (login/logout).
5. Os avisos aparecem numa região `aria-live` (`LiveNotices`) no carrinho, no checkout e no detalhe do NFT.
6. No checkout, uma mudança de preço gera nova cotação e a revisão exige confirmar os novos valores.

O `socket.io-client` é importado dinamicamente depois que o MSW inicia; caso contrário ele captura o `WebSocket` nativo antes da interceptação. O servidor falso envia ping do Engine.IO a cada 5 s para evitar *ping timeout*.

## Desempenho e acessibilidade

- **Divisão de código por rota:** só a Home e o layout ficam no pacote inicial; as demais telas são carregadas sob demanda (`lazyRouteComponent`) e pré-carregadas na intenção de clique (`defaultPreload: "intent"`). O pacote principal caiu de ~688 kB para ~228 kB.
- **Inicialização paralela:** em `main.tsx`, o app e o MSW são baixados juntos, e a tela só monta quando os dois estão prontos (as requisições não podem sair antes do worker).
- **Medição (Lighthouse mobile, URL pública):** Acessibilidade 100, Práticas recomendadas 100, Desempenho 70. O principal custo é o pacote do MSW (~460 kB, ~0,9 s de CPU no perfil de celular lento), inerente a rodar a API simulada no navegador.
- **Acessibilidade:** controles com rótulo associado, erros de campo ligados por `aria-describedby` e `role="alert"`, avisos em regiões `aria-live`, foco visível e navegação por teclado.

## Limitações conhecidas

- Dados e "blockchain" são simulados; o hash de transação e o link do explorer são fictícios.
- O banco vive no `localStorage` do navegador e não é compartilhado entre navegadores.
- A URL de realtime é fictícia (`wss://realtime.kurio.test`) e só funciona com o MSW ativo.
- O `@mswjs/socket.io-binding` não tem *broadcast*: o servidor falso mantém seu próprio registro de clientes.
- O MSW é carregado antes da tela montar, o que pesa no Total Blocking Time (veja acima).
- O avatar é guardado como data URL no banco simulado (limite de ~150 KB na interface).

## Desvios do Figma

- Hero em português; abas "Novos lançamentos" e "Em alta" desabilitadas ("Em breve").
- Login e cadastro: seguem os frames mobile do Figma; no desktop reutilizam o mesmo layout centralizado. Botões de login social e "esqueci a senha" ficam desativados.
- Favorito nos cards: só na versão mobile (como no Figma mobile); no desktop o favoritar fica no detalhe. Na barra inferior mobile, "Favoritos" está desativado ("Em breve").
- Detalhe: avaliações (19), chips de edição, miniaturas, atributos e textos de contrato/direitos são **conteúdo estático**, como no Figma; o ícone de X foi substituído pelo do Twitter em SVG; os títulos "Contrato" e "Direitos autorais" foram corrigidos para casar com o texto.
- Pagamento: os campos do Figma sem equivalente no contrato (nome de usuário, nome do perfil, ENS/carteira secundária, código de indicação, nome ENS, "usar outra carteira" e observação) são exibidos mas não enviados nem validados; telefone não é coletado. No mobile, a lista de provedores de carteira é apenas visual.
- Perfil e Carteiras: o menu lateral "Meu perfil" mostra todos os itens do Figma, mas só **Dados do perfil** e **Carteiras** têm tela; Atividade, Lista de interesse, Ofertas, Arquivos baixados e Suporte ficam desativados ("Em breve"). "Apelido da carteira" (Perfil) edita o apelido da carteira principal. A troca de senha fica no mesmo formulário e só roda se os campos forem preenchidos.
- Carteiras: "Tipo de carteira", "Código de indicação" e "ENS ou carteira secundária (opcional)" não têm equivalente no contrato e aparecem desativados. Nome de exibição, nome do perfil, e-mail e ENS dessa tela editam o perfil junto da carteira. O **Adicionar** do topo cadastra uma nova carteira principal; "Igual à carteira principal" é só estado local (desativa o botão Adicionar da secundária).
- Mobile: o Figma traz frames mobile de Início, Detalhes, Carrinho, Pagamento, Login e Cadastro, e a versão de 375 px segue esses frames. Confirmação do pedido, Perfil e Carteiras não têm frame mobile: são adaptações próprias (coluna única; o menu lateral vira abas).