import { useRouterState } from "@tanstack/react-router"
import { dismissNotice, useNotices } from "./notices"

export function LiveNotices() {
  const notices = useNotices()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const visible = notices.filter(
    (n) =>
      pathname.startsWith("/cart") ||
      pathname.startsWith("/checkout") ||
      pathname === `/nft/${n.nftId}`,
  )

  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 grid max-w-sm gap-2">
      {visible.map((n) => (
        <div key={n.id} className="flex items-start gap-3 border border-brand bg-card p-3 text-sm">
          <p className="flex-1">{n.text}</p>
          <button
            type="button"
            aria-label="Dispensar aviso"
            onClick={() => dismissNotice(n.id)}
            className="text-text-soft hover:text-brand-hover"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}