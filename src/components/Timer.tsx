import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { playCue } from '../services/audio'
import { readStorage, writeStorage } from '../services/storage'
const memory = new Map<string, number>()
export function Timer({ seconds, token }: { seconds: number; token: string }) {
  const { t } = useTranslation()
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
        playCue('timer')
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
  }, [seconds, token])
  return seconds ? (
    <p className={'timer' + (!left ? ' timer-expired' : '')} role="timer" data-urgent={left > 0 && left <= 5}>
      <svg className="timer-ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="timer-track" cx="50" cy="50" r="45" />
        <circle className="timer-remaining" cx="50" cy="50" r="45" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - left / seconds} />
      </svg>
      <span>{left ? t('seconds', { count: left }) : t('timeUp')}</span>
    </p>
  ) : null
}
