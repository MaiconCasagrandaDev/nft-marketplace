import { Link, useNavigate } from "@tanstack/react-router"
import {
  AlertTriangle,
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react"
import { useEffect, type ReactNode } from "react"
import { useLogout, useSession } from "@/features/auth/useAuth"
import { cn } from "@/lib/utils"

type Section = "profile" | "wallets" | "favorites"
type Path = "/profile" | "/wallets" | "/favorites"
type Item = { key: string; label: string; Icon: LucideIcon; to?: Path }

const row =
  "flex h-[45px] w-full items-center gap-2.5 border-l-[6px] pl-[10px] pr-3 text-left text-sm text-brand"
const icon = "size-[18px] shrink-0"

const items: Item[] = [
  { key: "profile", label: "Dados do perfil", Icon: User, to: "/profile" },
  { key: "wallets", label: "Carteiras", Icon: MapPin, to: "/wallets" },
  { key: "activity", label: "Atividade", Icon: ShoppingCart },
  { key: "favorites", label: "Lista de interesse", Icon: Heart, to: "/favorites" },
  { key: "offers", label: "Ofertas", Icon: TrendingUp },
  { key: "downloads", label: "Arquivos baixados", Icon: Download },
  { key: "support", label: "Suporte", Icon: AlertTriangle },
]

export function AccountShell({ active, children }: { active: Section; children: ReactNode }) {
  const navigate = useNavigate()
  const logout = useLogout()
  const { user, isLoading } = useSession()

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/" })
  }, [isLoading, user, navigate])

  return (
    <div className="grid gap-6 pb-12 md:grid-cols-[310px_minmax(0,1fr)] md:gap-7 md:pt-6">
      <nav aria-label="Menu do perfil" className="self-start bg-card max-md:hidden">
        <p className="flex h-11 items-center px-2.5 text-lg font-bold text-foreground">Meu perfil</p>
        <ul>
          {items.map(({ key, label, Icon, to }) => (
            <li key={key}>
              {to ? (
                <Link
                  to={to}
                  aria-current={active === key ? "page" : undefined}
                  className={cn(row, active === key ? "border-brand" : "border-transparent")}
                >
                  <Icon className={icon} aria-hidden="true" />
                  {label}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Em breve"
                  className={cn(row, "cursor-not-allowed border-transparent")}
                >
                  <Icon className={icon} aria-hidden="true" />
                  {label}
                </button>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate({ to: "/" }) })}
          className="flex h-12 w-full items-center gap-2.5 border-t border-border pl-4 pr-3 text-sm font-bold text-brand hover:text-brand-hover"
        >
          <LogOut className={icon} aria-hidden="true" />
          Sair
        </button>
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  )
}