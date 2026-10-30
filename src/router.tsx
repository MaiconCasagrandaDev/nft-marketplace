import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  lazyRouteComponent,
} from "@tanstack/react-router"
import { Layout } from "@/components/layout/Layout"
import { HomePage } from "@/routes/home"
import { catalogSearchSchema } from "@/lib/search"
import { authSearchSchema, redirectIfAuthed, requireAuth } from "@/lib/guards"

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

function Pending() {
  return <div className="shimmer my-8 h-64 bg-card" aria-busy="true" />
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
  component: lazyRouteComponent(() => import("@/routes/nft-detail"), "NftDetailPage"),
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: lazyRouteComponent(() => import("@/routes/cart"), "CartPage"),
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  beforeLoad: requireAuth,
  component: lazyRouteComponent(() => import("@/routes/checkout"), "CheckoutPage"),
})

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order/$id",
  beforeLoad: requireAuth,
  component: lazyRouteComponent(() => import("@/routes/order"), "OrderPage"),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: authSearchSchema,
  beforeLoad: redirectIfAuthed,
  component: lazyRouteComponent(() => import("@/routes/login"), "LoginPage"),
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  validateSearch: authSearchSchema,
  beforeLoad: redirectIfAuthed,
  component: lazyRouteComponent(() => import("@/routes/register"), "RegisterPage"),
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: requireAuth,
  component: lazyRouteComponent(() => import("@/routes/profile"), "ProfilePage"),
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallets",
  beforeLoad: requireAuth,
  component: lazyRouteComponent(() => import("@/routes/wallets"), "WalletsPage"),
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  nftRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  walletsRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingMs: 200,
  defaultPendingComponent: Pending,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}