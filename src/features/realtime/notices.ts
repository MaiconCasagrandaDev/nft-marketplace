import { useSyncExternalStore } from "react"

export interface Notice {
  id: string
  nftId: string
  text: string
}

let notices: Notice[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())

export function pushNotice(notice: Notice) {
  notices = [notice, ...notices].slice(0, 3)
  emit()
}

export function dismissNotice(id: string) {
  notices = notices.filter((n) => n.id !== id)
  emit()
}

export function clearNotices() {
  if (notices.length === 0) return
  notices = []
  emit()
}

export function useNotices() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => notices,
    () => notices,
  )
}