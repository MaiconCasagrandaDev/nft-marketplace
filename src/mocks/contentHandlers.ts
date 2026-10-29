import { delay, http, HttpResponse } from "msw"
import { apiError } from "./auth"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const contentHandlers = [
  http.post("/api/newsletter", async ({ request }) => {
    await delay(300)
    const { email } = (await request.json()) as { email?: string }
    if (!email || !EMAIL_RE.test(email)) {
      return apiError("VALIDATION", "Informe um e-mail válido", 422)
    }
    return HttpResponse.json({ ok: true }, { status: 201 })
  }),
]