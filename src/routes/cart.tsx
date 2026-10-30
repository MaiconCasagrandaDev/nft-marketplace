import { Link, useRouter } from "@tanstack/react-router"
import { ChevronLeft, Minus, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  useApplyCoupon,
  useCart,
  useRemoveCoupon,
  useRemoveItem,
  useUpdateQuantity,
} from "@/features/cart/useCart"
import { getApiError } from "@/lib/api"
import { formatEth } from "@/lib/format"
import { NftCarousel } from "@/features/catalog/NftCarousel"

// mesma grade no cabeçalho e nas linhas para alinhar as colunas
const ROW = "md:grid-cols-[70px_minmax(0,1fr)_100px_110px_100px_32px]"

function Breadcrumb() {
  return (
    <nav aria-label="Navegação" className="hidden pt-8 text-sm font-bold md:block">
      <Link to="/" className="hover:text-brand-hover">Início</Link>
      {" / "}
      <Link to="/" hash="catalogo" className="hover:text-brand-hover">Mercado</Link>
      {" / "}
      <span>Carrinho</span>
    </nav>
  )
}

function MobileTop() {
  const router = useRouter()
  return (
    <div className="relative flex items-center justify-center py-4 md:hidden">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => router.history.back()}
        className="absolute left-0 grid size-9 place-items-center rounded-full bg-[#3a2217] text-brand"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h1 className="text-lg font-bold">Carrinho de NFTs</h1>
    </div>
  )
}

export function CartPage() {
  const { data: cart, isPending, isError, refetch } = useCart()
  const update = useUpdateQuantity()
  const remove = useRemoveItem()
  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()
  const [code, setCode] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const run = (mutate: (cb: { onError: (e: unknown) => void }) => void) => {
    setMessage(null)
    mutate({ onError: (e) => setMessage(getApiError(e).message) })
  }

  if (isPending) {
    return (
      <div aria-busy="true">
        <Breadcrumb />
        <MobileTop />
        <div className="grid gap-8 py-6 lg:grid-cols-[1fr_332px]">
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => <div key={i} className="shimmer h-[100px] bg-card md:h-[70px]" />)}
          </div>
          <div className="shimmer h-80 bg-card" />
        </div>
      </div>
    )
  }

  if (isError || !cart) {
    return (
      <div role="alert" className="py-16 text-center">
        <p className="mb-4">Não foi possível carregar o carrinho.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded bg-brand px-4 py-2 font-bold text-primary-foreground hover:bg-brand-hover"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div>
        <Breadcrumb />
        <MobileTop />
        <div className="py-16 text-center">
          <h2 className="mb-2 text-2xl font-bold">Seu carrinho está vazio</h2>
          <Link to="/" className="text-brand hover:text-brand-hover">Continuar explorando</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb />
      <MobileTop />
      <div className="grid gap-6 pb-0 pt-1 md:pb-12 md:pt-3 lg:grid-cols-[1fr_332px] lg:gap-[86px]">
        <section aria-label="Itens do carrinho">
          <div
            aria-hidden="true"
            className={`hidden border-b border-border px-2 pb-3 text-sm font-bold md:grid md:gap-4 ${ROW}`}
          >
            <span className="col-span-2">NFTs</span>
            <span>Preço</span>
            <span>Edições</span>
            <span>Total</span>
            <span />
          </div>

          <ul className="mt-1 grid gap-3 md:mt-3">
            {cart.items.map(({ nft, quantity, lineTotal }) => (
              <li
                key={nft.id}
                className={`grid grid-cols-[100px_1fr] items-center gap-x-4 overflow-hidden rounded-xl bg-card md:gap-y-0 md:rounded-none md:p-2 ${ROW}`}
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="row-span-2 h-full min-h-[100px] w-full object-cover md:row-span-1 md:size-[70px] md:min-h-0 md:rounded"
                />
                <div className="min-w-0 pr-3 pt-3 md:p-0">
                  <Link to="/nft/$id" params={{ id: nft.id }} className="font-bold hover:text-brand-hover">
                    {nft.name}
                  </Link>
                  <p className="text-sm text-text-soft">ID do token: {nft.tokenId}</p>
                </div>

                <div className="flex items-center justify-between gap-3 pb-3 pr-3 md:contents">
                  <span className="hidden text-sm text-brand md:inline">{formatEth(nft.price)} ETH</span>

                  <span className="order-first text-lg font-bold text-brand md:order-none md:text-sm">
                    {formatEth(lineTotal)} ETH
                  </span>

                  <div className="flex items-center gap-2 md:order-none">
                    <button
                      type="button"
                      aria-label={`Diminuir quantidade de ${nft.name}`}
                      disabled={quantity <= 1 || update.isPending}
                      onClick={() => run((cb) => update.mutate({ nftId: nft.id, quantity: quantity - 1 }, cb))}
                      className="grid size-6 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40 md:size-5"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-4 text-center text-sm">{quantity}</span>
                    <button
                      type="button"
                      aria-label={`Aumentar quantidade de ${nft.name}`}
                      disabled={update.isPending}
                      onClick={() => run((cb) => update.mutate({ nftId: nft.id, quantity: quantity + 1 }, cb))}
                      className="grid size-6 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40 md:size-5"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remover ${nft.name}`}
                    onClick={() => run((cb) => remove.mutate(nft.id, cb))}
                    className="justify-self-end text-text-soft hover:text-brand-hover"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {message && <p role="alert" className="mt-3 text-red-400">{message}</p>}
        </section>

        <aside
          aria-label="Resumo da carteira"
          className="-mx-4 grid content-start gap-4 rounded-t-3xl bg-[#1d120d] px-6 pb-28 pt-6 md:mx-0 md:rounded-none md:bg-transparent md:p-0"
        >
          <h2 className="hidden border-b border-border pb-3 text-lg font-bold md:block">Resumo da carteira</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!code.trim()) return
              run((cb) => applyCoupon.mutate(code, { ...cb, onSuccess: () => setCode("") }))
            }}
            className="grid gap-2"
          >
            <label htmlFor="coupon" className="sr-only text-sm font-bold md:not-sr-only">
              Código promocional
            </label>
            <div className="flex items-center rounded-full border border-brand/30 bg-[#241612] p-1 md:rounded-none md:border-0 md:bg-transparent md:p-0">
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite o código promocional..."
                className="h-10 min-w-0 flex-1 text-ellipsis bg-transparent px-4 text-xs outline-none placeholder:text-text-soft md:rounded-none md:border md:border-brand md:bg-background md:px-3"
              />
              <button
                type="submit"
                disabled={applyCoupon.isPending}
                className="h-10 rounded-full bg-gradient-to-r from-[#c98a4f] to-[#8a5530] px-6 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 md:rounded-none md:bg-brand md:bg-none md:px-4 md:text-primary-foreground md:hover:bg-brand-hover"
              >
                Aplicar
              </button>
            </div>
          </form>

          {cart.coupon && (
            <p className="flex items-center justify-between text-sm">
              <span>Cupom {cart.coupon.code} ({cart.coupon.percent}%)</span>
              <button
                type="button"
                onClick={() => run((cb) => removeCoupon.mutate(undefined, cb))}
                className="text-brand hover:text-brand-hover"
              >
                Remover
              </button>
            </p>
          )}

          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatEth(cart.subtotal)} ETH</dd></div>
            <div className="flex justify-between"><dt>Desconto do lançamento</dt><dd>(-) {formatEth(cart.discount)}</dd></div>
            <div className="flex justify-between"><dt>Taxa de rede</dt><dd>{formatEth(cart.networkFee)} ETH</dd></div>
            <p className="-mt-2 text-right text-xs text-text-soft">Taxa estimada</p>
            <div className="mt-1 flex justify-between pt-3 font-bold">
              <dt>Total</dt>
              <dd className="text-brand">{formatEth(cart.total)} ETH</dd>
            </div>
          </dl>

          <Link
            to="/checkout"
            className="rounded-full bg-brand py-4 text-center text-base font-bold text-primary-foreground hover:bg-brand-hover md:rounded md:py-3 md:text-sm"
          >
            Conectar e finalizar
          </Link>
          <Link to="/" className="hidden text-center text-sm text-brand hover:text-brand-hover md:block">
            Continuar explorando
          </Link>
        </aside>
      </div>
      <div className="hidden md:block">
        <NftCarousel title="Colecionadores também viram" />
      </div>
    </div>
  )
}