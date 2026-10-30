import { createRootRoute, createRoute, createRouter, Link } from "@tanstack/react-router"
import { Layout } from "@/components/layout/Layout"
import { HomePage } from "@/routes/home"
import { NftDetailPage } from "@/routes/nft-detail"
import { catalogSearchSchema } from "@/lib/search"
import { CartPage } from "@/routes/cart"
import { CheckoutPage } from "@/routes/checkout"
import { OrderPage } from "@/routes/order"
import { authSearchSchema, redirectIfAuthed, requireAuth } from "@/lib/guards"
import { LoginPage } from "@/routes/login"
import { RegisterPage } from "@/routes/register"
import { ProfilePage } from "@/routes/profile"
import { WalletsPage } from "@/routes/wallets"

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

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  beforeLoad: requireAuth,
  component: CheckoutPage,
})

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order/$id",
  beforeLoad: requireAuth,
  component: OrderPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: authSearchSchema,
  beforeLoad: redirectIfAuthed,
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  validateSearch: authSearchSchema,
  beforeLoad: redirectIfAuthed,
  component: RegisterPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: requireAuth,
  component: ProfilePage,
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallets",
  beforeLoad: requireAuth,
  component: WalletsPage,
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

export const router = createRouter({ routeTree, defaultPreload: "intent" })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}