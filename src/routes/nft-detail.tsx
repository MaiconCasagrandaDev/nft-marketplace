import { useNavigate, useParams, Link } from "@tanstack/react-router";
import axios from "axios";
import { Mail, Minus, Plus, Search, Star } from "lucide-react";
import { useState } from "react";
import { useAddToCart } from "@/features/cart/useCart";
import { NftCarousel } from "@/features/catalog/NftCarousel";
import { useNft } from "@/features/catalog/useNft";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { getApiError } from "@/lib/api";
import { formatEth } from "@/lib/format";
import { categoryLabels, networkLabels } from "@/lib/labels";

const EDITIONS = ["1/1", "1/10", "1/50", "ABERTA"];
const REVIEWS = 19;

function Breadcrumb() {
  return (
    <nav aria-label="Navegação" className="pt-8 text-sm font-bold">
      <Link to="/" className="hover:text-brand-hover">
        Início
      </Link>
      {" / "}
      <Link to="/" hash="catalogo" className="hover:text-brand-hover">
        Mercado
      </Link>
    </nav>
  );
}

export function NftDetailPage() {
  const { id } = useParams({ from: "/nft/$id" });
  const navigate = useNavigate();
  const { data: nft, isPending, error, refetch } = useNft(id);
  const add = useAddToCart();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [edition, setEdition] = useState("1/50");
  const [thumb, setThumb] = useState(0);
  const [tab, setTab] = useState<"details" | "reviews">("details");

  if (isPending) {
    return (
      <div>
        <Breadcrumb />
        <div className="grid gap-8 py-6 md:grid-cols-2" aria-busy="true">
          <div className="shimmer aspect-square bg-card" />
          <div className="grid content-start gap-4">
            <div className="shimmer h-10 w-2/3 bg-card" />
            <div className="shimmer h-6 w-1/4 bg-card" />
            <div className="shimmer h-24 w-full bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">NFT não encontrado</h1>
        <Link to="/" className="text-brand hover:text-brand-hover">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="mb-4">Não foi possível carregar este NFT.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded bg-brand px-4 py-2 font-bold text-primary-foreground hover:bg-brand-hover"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const soldOut = nft.available === 0;
  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent(`${nft.name} na Kurio`);

  const buy = () => {
    setMessage(null);
    add.mutate(
      { nftId: nft.id, quantity: qty },
      {
        onSuccess: () => navigate({ to: "/cart" }),
        onError: (e) => setMessage(getApiError(e).message),
      },
    );
  };

  return (
    <div>
      <Breadcrumb />

      <article className="grid gap-8 pb-16 pt-3 lg:grid-cols-[520px_1fr] lg:gap-[30px]">
        <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-[14px]">
          <div
            className="flex gap-3 md:flex-col"
            role="group"
            aria-label="Miniaturas"
          >
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver imagem ${i + 1}`}
                aria-pressed={thumb === i}
                onClick={() => setThumb(i)}
                className={`size-[89px] shrink-0 overflow-hidden rounded border-2 ${
                  thumb === i ? "border-brand" : "border-transparent"
                }`}
              >
                <img
                  src={nft.image}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="relative min-w-0 flex-1 self-start bg-card p-[18px]">
            <img
              src={nft.image}
              alt={nft.name}
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <a
              href={nft.image}
              target="_blank"
              rel="noreferrer"
              aria-label="Ampliar imagem"
              className="absolute right-5 top-5 grid size-6 place-items-center rounded-full bg-background/80 text-brand hover:text-brand-hover"
            >
              <Search className="size-4" />
            </a>
          </div>
        </div>

        <div className="grid content-start gap-3">
          <h1 className="text-3xl font-bold">{nft.name}</h1>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <p className="text-2xl font-bold text-brand">
              {formatEth(nft.price)} ETH
              {nft.previousPrice && (
                <span className="ml-3 text-base font-normal text-text-soft line-through">
                  {formatEth(nft.previousPrice)} ETH
                </span>
              )}
            </p>
            <p className="flex items-center gap-2 text-xs text-text-soft">
              <span
                role="img"
                aria-label="Nota 5 de 5"
                className="flex gap-0.5 text-brand"
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </span>
              {REVIEWS} avaliações de colecionadores
            </p>
          </div>

          <div>
            <h2 className="mb-1 text-sm font-bold">Sobre este NFT:</h2>
            <p className="text-sm leading-6 text-text-soft">
              {nft.description}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-bold">Edição:</h2>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Edição"
            >
              {EDITIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-pressed={edition === e}
                  onClick={() => setEdition(e)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    edition === e
                      ? "border-brand text-brand"
                      : "border-border text-text-soft"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={qty <= 1}
                onClick={() => setQty((q) => q - 1)}
                className="grid size-8 place-items-center rounded-full bg-brand text-primary-foreground disabled:cursor-not-allowed"
              >
                <Minus className="size-4" />
              </button>
              <span aria-live="polite" className="w-5 text-center">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={qty >= nft.available}
                onClick={() => setQty((q) => q + 1)}
                className="grid size-8 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={buy}
                disabled={soldOut || add.isPending}
                className="h-[34px] w-[115px] rounded bg-brand text-xs font-bold text-primary-foreground hover:bg-brand-hover disabled:opacity-50"
              >
                {add.isPending ? "Adicionando..." : "COMPRAR"}
              </button>
              <div className="[&_button]:inline-flex! [&_button]:h-[34px]! [&_button]:w-[115px]! [&_button]:items-center! [&_button]:justify-center! [&_button]:gap-2! [&_button]:rounded! [&_button]:px-0! [&_button]:text-xs! [&_svg]:size-4!">
                <FavoriteButton nftId={nft.id} nftName={nft.name} showLabel />
              </div>
            </div>
          </div>

          {message && (
            <p role="alert" className="text-red-400">
              {message}
            </p>
          )}

          <dl className="grid gap-3 pt-2 text-sm text-text-soft">
            <div>
              <dt className="inline">ID do token: </dt>
              <dd className="inline">{nft.tokenId}</dd>
            </div>
            <div>
              <dt className="inline">Coleção: </dt>
              <dd className="inline">{categoryLabels[nft.category]}</dd>
            </div>
            <div>
              <dt className="inline">Atributos: </dt>
              <dd className="inline">Verificado, Raro</dd>
            </div>
            <div>
              <dt className="inline">Disponíveis: </dt>
              <dd className="inline">{soldOut ? "Esgotado" : nft.available}</dd>
            </div>
          </dl>

          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold">Compartilhar este NFT:</span>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Compartilhar no LinkedIn"
              className="font-bold hover:text-brand-hover"
            >
              in
            </a>
            <a
              href={`mailto:?subject=${shareText}&body=${shareUrl}`}
              aria-label="Compartilhar por e-mail"
              className="hover:text-brand-hover"
            >
              <Mail className="size-4" />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Compartilhar no Twitter"
              className="hover:text-brand-hover"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4 fill-current"
                aria-hidden="true"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
          </div>
        </div>
      </article>

      <section aria-label="Informações do NFT" className="pb-16">
        <div role="tablist" className="flex gap-8 border-b border-border">
          <button
            type="button"
            role="tab"
            id="tab-details"
            aria-selected={tab === "details"}
            aria-controls="panel-details"
            onClick={() => setTab("details")}
            className={`-mb-px border-b-2 pb-3 text-sm font-bold ${
              tab === "details"
                ? "border-brand text-brand"
                : "border-transparent hover:text-brand-hover"
            }`}
          >
            Detalhes do NFT
          </button>
          <button
            type="button"
            role="tab"
            id="tab-reviews"
            aria-selected={tab === "reviews"}
            aria-controls="panel-reviews"
            onClick={() => setTab("reviews")}
            className={`-mb-px border-b-2 pb-3 text-sm ${
              tab === "reviews"
                ? "border-brand font-bold text-brand"
                : "border-transparent hover:text-brand-hover"
            }`}
          >
            Avaliações de colecionadores ({REVIEWS})
          </button>
        </div>

        {tab === "details" ? (
          <div
            id="panel-details"
            role="tabpanel"
            aria-labelledby="tab-details"
            className="grid gap-4 pt-4 text-xs leading-6 text-text-soft"
          >
            <p>
              {nft.name} é uma obra digital finalizada à mão da coleção Kurio
              Editions. Cada atributo fica armazenado nos metadados do token e
              verificado na {networkLabels[nft.network]}. A obra explora
              identidade, movimento e luz em um mundo digital sem fronteiras.
            </p>
            <p>
              A propriedade inclui a arte em alta resolução, lançamentos
              exclusivos para colecionadores e um registro permanente de
              procedência registrada na rede. Nova Sato recebe 5% de direitos
              autorais nas vendas secundárias, apoiando novos trabalhos e
              lançamentos da comunidade.
            </p>
            <div>
              <h3 className="font-bold text-foreground">Rede:</h3>
              <p>
                Cunhado na {networkLabels[nft.network]} com procedência imutável
                e metadados armazenados no IPFS.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-foreground">Contrato:</h3>
              <p>0x7A42...19E8 · Contrato inteligente ERC-721 verificado.</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground">Direitos autorais:</h3>
              <p>
                Direitos autorais do criador: 5% nas vendas secundárias, pagos
                automaticamente pelos mercados compatíveis.
              </p>
            </div>
          </div>
        ) : (
          <p
            id="panel-reviews"
            role="tabpanel"
            aria-labelledby="tab-reviews"
            className="pt-4 text-sm text-text-soft"
          >
            As avaliações dos colecionadores serão exibidas aqui em breve.
          </p>
        )}
      </section>

      <NftCarousel title="Mais desta coleção" excludeId={nft.id} />
    </div>
  );
}
