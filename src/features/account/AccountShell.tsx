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
} from "lucide-react"
import { useEffect, type ReactNode } from "react"
import { useLogout, useSession } from "@/features/auth/useAuth"
import { cn } from "@/lib/utils"

type Section = "profile" | "wallets"

const row =
  "flex h-[45px] w-full items-center gap-2.5 border-l-[6px] pl-[10px] pr-3 text-left text-sm text-brand"
const icon = "size-[18px] shrink-0"

const soon = [
  { label: "Atividade", Icon: ShoppingCart },
  { label: "Lista de interesse", Icon: Heart },
  { label: "Ofertas", Icon: TrendingUp },
  { label: "Arquivos baixados", Icon: Download },
  { label: "Suporte", Icon: AlertTriangle },
]

export function AccountShell({ active, children }: { active: Section; children: ReactNode }) {
  const navigate = useNavigate()
  const logout = useLogout()
  const { user, isLoading } = useSession()

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/" })
  }, [isLoading, user, navigate])

  const tab = (current: boolean) =>
    cn(
      "rounded-full border px-4 py-2 text-sm",
      current
        ? "border-brand bg-brand font-bold text-primary-foreground"
        : "border-border text-text-soft",
    )

  return (
    <div className="grid gap-6 pb-12 md:grid-cols-[310px_minmax(0,1fr)] md:gap-7 md:pt-6">
      <nav aria-label="Menu do perfil" className="self-start bg-card max-md:hidden">
        <p className="flex h-11 items-center px-2.5 text-lg font-bold text-foreground">Meu perfil</p>
        <ul>
          <li>
            <Link
              to="/profile"
              aria-current={active === "profile" ? "page" : undefined}
              className={cn(row, active === "profile" ? "border-brand" : "border-transparent")}
            >
              <User className={icon} aria-hidden="true" />
              Dados do perfil
            </Link>
          </li>
          <li>
            <Link
              to="/wallets"
              aria-current={active === "wallets" ? "page" : undefined}
              className={cn(row, active === "wallets" ? "border-brand" : "border-transparent")}
            >
              <MapPin className={icon} aria-hidden="true" />
              Carteiras
            </Link>
          </li>
          {soon.map(({ label, Icon }) => (
            <li key={label}>
              <button
                type="button"
                disabled
                title="Em breve"
                className={cn(row, "cursor-not-allowed border-transparent")}
              >
                <Icon className={icon} aria-hidden="true" />
                {label}
              </button>
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

      <div className="grid content-start gap-4">
        <nav aria-label="Seções do perfil" className="flex gap-2 md:hidden">
          <Link
            to="/profile"
            aria-current={active === "profile" ? "page" : undefined}
            className={tab(active === "profile")}
          >
            Dados do perfil
          </Link>
          <Link
            to="/wallets"
            aria-current={active === "wallets" ? "page" : undefined}
            className={tab(active === "wallets")}
          >
            Carteiras
          </Link>
        </nav>
        {children}
      </div>
    </div>
  )
}