import { Link, useRouterState } from "@tanstack/react-router"
import { Heart, Home, ScanLine, ShoppingCart, User } from "lucide-react"
import { useCart } from "@/features/cart/useCart"
import { cn } from "@/lib/utils"

const side = "relative grid size-12 place-items-center rounded-full"

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: cart } = useCart()
  const count = cart?.itemCount ?? 0
  if (["/nft", "/cart", "/checkout"].some((p) => pathname.startsWith(p))) return null

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      <div className="relative mx-auto flex h-16 max-w-md items-center justify-between rounded-t-[32px] bg-[#1d120d] px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        <Link
          to="/"
          aria-label="Início"
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(side, pathname === "/" ? "text-brand" : "text-text-soft")}
        >
          <Home className="size-5" />
        </Link>
        <button
          type="button"
          disabled
          title="Em breve"
          aria-label="Favoritos (em breve)"
          className={cn(side, "text-text-soft opacity-60")}
        >
          <Heart className="size-5" />
        </button>

        <Link
          to="/"
          aria-label="Explorar"
          className="absolute left-1/2 -top-7 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-brand text-primary-foreground shadow-lg ring-4 ring-background"
        >
          <ScanLine className="size-6" />
        </Link>

        <span className="w-14" aria-hidden="true" />

        <Link
          to="/cart"
          aria-label={`Carrinho, ${count} itens`}
          aria-current={pathname.startsWith("/cart") ? "page" : undefined}
          className={cn(side, pathname.startsWith("/cart") ? "text-brand" : "text-text-soft")}
        >
          <ShoppingCart className="size-5" />
          {count > 0 && (
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
        <Link to="/login" aria-label="Perfil" className={cn(side, "text-text-soft")}>
          <User className="size-5" />
        </Link>
      </div>
    </nav>
  )
}