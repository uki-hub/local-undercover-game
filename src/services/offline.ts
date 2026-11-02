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
    const worker = navigator.serviceWorker
    const script = new URL(import.meta.env.BASE_URL + 'sw.js', location.href).href
    const controlsGame = () => worker.controller?.scriptURL === script
    const checkControl = () => {
      if (controlsGame()) set('offline')
    }
    worker.addEventListener('controllerchange', checkControl)
    checkControl()
    registerSW({
      immediate: true,
      onOfflineReady: checkControl,
      onNeedRefresh: () => wait(true),
      onRegisterError: () => set(controlsGame() ? 'offline' : 'onlineOnly'),
      onRegisteredSW: checkControl,
    })
    // Leave waiting workers untouched. Normal activation waits for every old client to close.
    return () => worker.removeEventListener('controllerchange', checkControl)
  }, [])
  return { status, waiting }
}
