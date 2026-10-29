import { setupWorker } from "msw/browser"
import { cartHandlers } from "./cartHandlers"
import { handlers } from "./handlers"

export const worker = setupWorker(...handlers, ...cartHandlers)