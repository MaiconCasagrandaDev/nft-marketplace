import { setupWorker } from "msw/browser"
import { authHandlers } from "./authHandlers"
import { cartHandlers } from "./cartHandlers"
import { contentHandlers } from "./contentHandlers"
import { controls, type Controls } from "./controls"
import { favoriteHandlers } from "./favoriteHandlers"
import { handlers } from "./handlers"
import { orderHandlers } from "./orderHandlers"
import { realtimeHandlers } from "./realtime"
import { walletHandlers } from "./walletHandlers"
import { accountHandlers } from "./accountHandlers"

export const worker = setupWorker(
  ...handlers,
  ...cartHandlers,
  ...authHandlers,
  ...favoriteHandlers,
  ...contentHandlers,
  ...walletHandlers,
  ...accountHandlers,
  ...orderHandlers,
  ...realtimeHandlers,
)

declare global {
  interface Window {
    kurioMock?: Controls
  }
}

window.kurioMock = controls