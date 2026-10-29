import { createRootRoute, createRoute, createRouter, Link } from "@tanstack/react-router"
import { Layout } from "@/components/layout/Layout"
import { HomePage } from "@/routes/home"
import { NftDetailPage } from "@/routes/nft-detail"
import { catalogSearchSchema } from "@/lib/search"

function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold">Página não encontrada</h1>
      <Link to="/" className="text-brand hover:text-brand-hover">
        Voltar ao início
      </Link>
    </div>
  )
}

const rootRoute = createRootRoute({ component: Layout, notFoundComponent: NotFound })

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
  validateSearch: (search: Record<string, unknown>) => catalogSearchSchema.parse(search),
})

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nft/$id",
  component: NftDetailPage,
})

const routeTree = rootRoute.addChildren([homeRoute, nftRoute])

export const router = createRouter({ routeTree, defaultPreload: "intent" })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}