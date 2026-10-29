import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import "@fontsource-variable/roboto-mono"
import "./index.css"
import { router } from "./router"

const queryClient = new QueryClient()

async function enableMocks() {
  if (import.meta.env.VITE_USE_MOCKS === "false") return
  const { worker } = await import("./mocks/browser")
  await worker.start({ onUnhandledRequest: "bypass" })
}

enableMocks().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})