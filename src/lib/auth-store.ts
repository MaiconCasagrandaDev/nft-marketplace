const KEY = "kurio:token"
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(KEY, token)
  } catch {
    /* ignora */
  }
  emit()
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignora */
  }
  emit()
}

export function subscribeToken(fn: () => void) {
  listeners.add(fn)
  window.addEventListener("storage", fn)
  return () => {
    listeners.delete(fn)
    window.removeEventListener("storage", fn)
  }
}