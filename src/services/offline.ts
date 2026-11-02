import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function useOffline() {
  const [status, set] = useState(import.meta.env.PROD ? 'caching' : 'onlineOnly')
  const [waiting, wait] = useState(false)
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
      set('onlineOnly')
      return
    }
    registerSW({
      immediate: true,
      onOfflineReady: () => set('offline'),
      onNeedRefresh: () => wait(true),
      onRegisterError: () => set('onlineOnly'),
      onRegisteredSW: (_url, registration) => {
        if (registration) void navigator.serviceWorker.ready.then(() => set('offline'))
      },
    })
    // Leave waiting workers untouched. Normal activation waits for every old client to close.
  }, [])
  return { status, waiting }
}
