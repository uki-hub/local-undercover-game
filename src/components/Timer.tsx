import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '../store/session'
import { readStorage, writeStorage } from '../services/storage'
const memory = new Map<string, number>()
export function Timer({ seconds, token }: { seconds: number; token: string }) {
  const { t } = useTranslation()
  const audio = useGame((s) => s.profile.audio)
  const [left, display] = useState(seconds)
  useEffect(() => {
    if (!seconds) return
    let remaining = memory.get(token) ?? seconds * 1000
    try {
      const stored = JSON.parse(readStorage('sessionStorage', 'undercover.timer') || 'null')
      if (stored?.token === token && Number.isFinite(stored.ms))
        remaining = Math.min(remaining, Math.max(0, stored.ms))
    } catch {
      /* memory fallback */
    }
    let last = document.hidden ? 0 : performance.now()
    let notified = remaining <= 0
    function tick() {
      const now = performance.now()
      if (last) remaining = Math.max(0, remaining - (now - last))
      last = document.hidden ? 0 : now
      display(Math.ceil(remaining / 1000))
      if (!remaining && !notified) {
        notified = true
        if (audio)
          try {
            const ctx = new AudioContext(),
              tone = ctx.createOscillator(),
              gain = ctx.createGain()
            tone.connect(gain)
            gain.connect(ctx.destination)
            gain.gain.value = 0.065
            tone.frequency.value = 660
            tone.start()
            tone.stop(ctx.currentTime + 0.16)
            tone.onended = () => {
              void ctx.close()
            }
          } catch {
            /* Visual expiry is always available. */
          }
      }
    }
    function save() {
      tick()
      memory.clear()
      memory.set(token, remaining)
      writeStorage('sessionStorage', 'undercover.timer', { token, ms: remaining })
    }
    tick()
    const interval = window.setInterval(tick, 200)
    document.addEventListener('visibilitychange', save)
    window.addEventListener('pagehide', save)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', save)
      window.removeEventListener('pagehide', save)
      save()
    }
  }, [seconds, token, audio])
  return seconds ? (
    <p className="timer" role="timer">
      {left ? t('seconds', { count: left }) : t('timeUp')}
    </p>
  ) : null
}
