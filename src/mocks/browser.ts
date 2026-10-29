import { setupWorker } from "msw/browser"
import { authHandlers } from "./authHandlers"
import { cartHandlers } from "./cartHandlers"
import { contentHandlers } from "./contentHandlers"
import { expireSessions, resetDb } from "./db"
import { favoriteHandlers } from "./favoriteHandlers"
import { handlers } from "./handlers"
import { orderHandlers } from "./orderHandlers"
import { scenarios, type ScenarioName, type Scenarios } from "./scenarios"
import { walletHandlers } from "./walletHandlers"

export const worker = setupWorker(
  ...handlers,
  ...cartHandlers,
  ...authHandlers,
  ...favoriteHandlers,
  ...contentHandlers,
  ...walletHandlers,
  ...orderHandlers,
)

declare global {
  interface Window {
    kurioMock?: {
      reset: () => void
      expireSessions: () => void
      setScenario: <K extends ScenarioName>(name: K, value: Scenarios[K]) => void
    }
  }
}

window.kurioMock = {
  reset: () => {
    resetDb()
    location.reload()
  },
  expireSessions,
  setScenario: (name, value) => {
    scenarios[name] = value
  },
}