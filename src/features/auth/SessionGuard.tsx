import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { onUnauthorized } from "@/lib/api"
import { clearToken } from "@/lib/auth-store"

export function SessionGuard() {
  const qc = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    onUnauthorized((code) => {
      clearToken()
      qc.clear()
      router.navigate({
        to: "/login",
        search: {
          redirect: router.state.location.href,
          expired: code === "SESSION_EXPIRED" ? true : undefined,
        },
      })
    })
    return () => onUnauthorized(null)
  }, [qc, router])

  return null
}