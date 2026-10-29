import { redirect } from "@tanstack/react-router"
import { z } from "zod"
import { getToken } from "./auth-store"

export const authSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  expired: z.boolean().optional().catch(undefined),
})

export function requireAuth({ location }: { location: { href: string } }) {
  if (!getToken()) {
    throw redirect({ to: "/login", search: { redirect: location.href } })
  }
}

export function redirectIfAuthed() {
  if (getToken()) throw redirect({ to: "/" })
}

export function safeRedirect(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/"
  if (value.startsWith("/login") || value.startsWith("/register")) return "/"
  return value
}