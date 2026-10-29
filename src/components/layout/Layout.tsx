import { Outlet } from "@tanstack/react-router"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { SessionGuard } from "@/features/auth/SessionGuard"
import { LiveNotices } from "@/features/realtime/LiveNotices"
import { useRealtime } from "@/features/realtime/useRealtime"

export function Layout() {
  useRealtime()
  return (
    <div className="min-h-screen">
      <SessionGuard />
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-4 xl:px-0">
        <Outlet />
      </main>
      <Footer />
      <LiveNotices />
    </div>
  )
}