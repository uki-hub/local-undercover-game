import { create } from 'zustand'

type Area = 'localStorage' | 'sessionStorage'
export const useStorageStatus = create<{ failed: boolean }>(() => ({ failed: false }))
function failed() {
  if (typeof window !== 'undefined') useStorageStatus.setState({ failed: true })
}
export function readStorage(area: Area, key: string) {
  try { return window[area].getItem(key) }
  catch { failed(); return null }
}
export function writeStorage(area: Area, key: string, data: unknown) {
  try {
    if (data === null) window[area].removeItem(key)
    else window[area].setItem(key, JSON.stringify(data))
  } catch { failed() }
}
