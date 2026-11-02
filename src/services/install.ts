import { useEffect, useState } from 'react'

interface InstallPrompt extends Event {
  prompt(): Promise<unknown>
}

function standalone() {
  return matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function useInstall() {
  const [installed, setInstalled] = useState(standalone)
  const [offer, setOffer] = useState<InstallPrompt | null>(null)
  useEffect(() => {
    const mode = matchMedia('(display-mode: standalone)')
    const changed = () => setInstalled(standalone())
    const installed = () => { setInstalled(true); setOffer(null) }
    const offered = (event: Event) => {
      event.preventDefault()
      setOffer(event as InstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', offered)
    window.addEventListener('appinstalled', installed)
    mode.addEventListener('change', changed)
    return () => {
      window.removeEventListener('beforeinstallprompt', offered)
      window.removeEventListener('appinstalled', installed)
      mode.removeEventListener('change', changed)
    }
  }, [])
  return {
    visible: import.meta.env.PROD && window.isSecureContext && !installed,
    prompt: offer && (() => {
      setOffer(null)
      void offer.prompt().catch(() => { /* Browser-menu instructions remain available. */ })
    }),
  }
}
