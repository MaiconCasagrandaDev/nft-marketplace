import { Outlet, useRouterState } from "@tanstack/react-router"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { BottomNav } from "./BottomNav"
import { SessionGuard } from "@/features/auth/SessionGuard"
import { LiveNotices } from "@/features/realtime/LiveNotices"
import { useRealtime } from "@/features/realtime/useRealtime"

// telas do Figma mobile que não têm barra inferior nem rodapé
const FOCUSED = ["/nft", "/cart", "/checkout", "/login", "/register"]

export function Layout() {
  useRealtime()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const focused = FOCUSED.some((p) => pathname.startsWith(p))
  const isHome = pathname === "/"

  return (
    <div className={focused ? "min-h-screen" : "min-h-screen pb-24 md:pb-0"}>
      <SessionGuard />
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-4 xl:px-0">
        <Outlet />
      </main>
      <div className={isHome ? undefined : "max-md:hidden"}>
        <Footer />
      </div>
      <LiveNotices />
      <BottomNav />
    </div>
  )
}