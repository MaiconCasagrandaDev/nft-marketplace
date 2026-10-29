import { setupWorker } from "msw/browser"
import { authHandlers } from "./authHandlers"
import { cartHandlers } from "./cartHandlers"
import { expireSessions, resetDb } from "./db"
import { favoriteHandlers } from "./favoriteHandlers"
import { handlers } from "./handlers"
import { scenarios, type ScenarioName } from "./scenarios"
import { contentHandlers } from "./contentHandlers"

export const worker = setupWorker(
  ...handlers,
  ...cartHandlers,
  ...authHandlers,
  ...favoriteHandlers,
  ...contentHandlers,
)

declare global {
  interface Window {
    kurioMock?: {
      reset: () => void
      expireSessions: () => void
      setScenario: (name: ScenarioName, value: boolean) => void
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