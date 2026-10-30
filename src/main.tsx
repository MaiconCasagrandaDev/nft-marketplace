import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import "@fontsource-variable/roboto-mono"
import "./index.css"

const queryClient = new QueryClient()

async function startMocks() {
  if (import.meta.env.VITE_USE_MOCKS === "false") return
  const { worker } = await import("./mocks/browser")
  await worker.start({ onUnhandledRequest: "bypass", quiet: true })
}

// o app e a API simulada são baixados em paralelo; a tela só monta com os dois prontos
async function bootstrap() {
  const [{ router }] = await Promise.all([import("./router"), startMocks()])
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

bootstrap()