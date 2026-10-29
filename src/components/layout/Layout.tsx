import { Outlet } from "@tanstack/react-router"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { SessionGuard } from "@/features/auth/SessionGuard"

export function Layout() {
  return (
    <div className="min-h-screen">
      <SessionGuard />
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-4 xl:px-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}