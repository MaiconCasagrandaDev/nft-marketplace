import { Link } from "@tanstack/react-router"
import { LogIn } from "lucide-react"
import { useLogout, useSession } from "./useAuth"

export function AccountMenu() {
  const { user, isLoading } = useSession()
  const logout = useLogout()

  if (isLoading) {
    return <span className="inline-block h-8 w-24 animate-pulse rounded bg-card" aria-hidden />
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-2 rounded bg-brand px-3 py-1.5 text-sm font-bold text-primary-foreground hover:bg-brand-hover"
      >
        <LogIn className="size-4" /> Entrar
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-text-soft" data-testid="user-name">
        @{user.username}
      </span>
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="rounded border border-brand px-3 py-1.5 text-sm font-bold text-brand hover:text-brand-hover disabled:opacity-60"
      >
        Sair
      </button>
    </div>
  )
}