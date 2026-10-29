import { Link, useRouterState } from "@tanstack/react-router"
import { LogIn, Search, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart } from "@/features/cart/useCart"

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isHome = pathname === "/"
  const isMarket = ["/nft", "/cart", "/checkout"].some((p) => pathname.startsWith(p))
  const { data: cart } = useCart()
  const cartCount = cart?.itemCount ?? 0

  const item = "flex items-center border-b-2 border-transparent text-base"
  const active = "border-brand text-brand-hover"

  return (
    <header className="mx-auto w-full max-w-[1200px] px-4 pt-6 xl:px-0">
      <div className="flex h-11 items-stretch justify-between border-b-[0.3px] border-brand">
        <Link to="/" className="flex items-center text-sm font-bold tracking-wider">
          KURIO
        </Link>

        <nav aria-label="Principal" className="hidden items-stretch gap-10 md:flex">
          <Link to="/" className={cn(item, isHome && active)}>Início</Link>
          <Link to="/" className={cn(item, isMarket && active)}>Mercado</Link>
          <button type="button" disabled title="Em breve" className={cn(item, "opacity-60")}>
            Criadores
          </button>
          <button type="button" disabled title="Em breve" className={cn(item, "opacity-60")}>
            Aprenda
          </button>
        </nav>

        <div className="flex items-center gap-5">
          <button type="button" aria-label="Buscar" className="hover:text-brand-hover">
            <Search className="size-5" />
          </button>
          <Link
            to="/cart"
            aria-label={`Carrinho, ${cartCount} itens`}
            className="relative hover:text-brand-hover"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 rounded bg-brand px-3 py-1.5 text-sm font-bold text-primary-foreground hover:bg-brand-hover"
          >
            <LogIn className="size-4" /> Entrar
          </button>
        </div>
      </div>
    </header>
  )
}