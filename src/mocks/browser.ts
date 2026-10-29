import { setupWorker } from "msw/browser"
import { authHandlers } from "./authHandlers"
import { cartHandlers } from "./cartHandlers"
import { expireSessions, resetDb } from "./db"
import { handlers } from "./handlers"

export const worker = setupWorker(...handlers, ...cartHandlers, ...authHandlers)

declare global {
  interface Window {
    kurioMock?: { reset: () => void; expireSessions: () => void }
  }
}

window.kurioMock = {
  reset: () => {
    resetDb()
    location.reload()
  },
  expireSessions,
}