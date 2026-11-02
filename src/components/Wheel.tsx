import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Action, ChoiceArt, Footer, Icon, Portrait, Title } from './ui'
import type { Person } from '../engine/model'
import './tie-reel.css'

export type ReelEntry = { id: string; name: string; person?: Person }
export const REEL_DURATION = 6600
type Stage = 'racing' | 'tension' | 'critical' | 'revealed'

// Repeated cards create suspense around the engine's already committed draw.
export function reelLayout(width: number, count: number, index: number) {
  const card = Math.min(172, Math.max(124, width * .46))
  const stride = card + 12
  const landing = Math.ceil(36 / count) * count + index
  const center = width / 2 - card / 2
  return { card, stride, landing, start: center - 2 * stride, end: center - landing * stride }
}

export function Wheel({ entries, index, kind, next, reduced }: {
  entries: ReelEntry[]; index: number; kind: 'action' | 'target'; next: () => void; reduced: boolean
}) {
  const { t } = useTranslation()
  const viewport = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null)
  const animation = useRef<Animation | null>(null)
  const complete = useRef<() => void>(() => {})
  const [stage, setStage] = useState<Stage>(reduced ? 'revealed' : 'racing')
  const [focused, focus] = useState(reduced ? Math.ceil(36 / entries.length) * entries.length + index : 2)
  const done = stage === 'revealed'
  const landing = Math.ceil(36 / entries.length) * entries.length + index
  const selected = entries[index]

  useEffect(() => {
    const windowEl = viewport.current!, strip = track.current!
    let frame = 0, finished = reduced
    let layout = reelLayout(windowEl.clientWidth, entries.length, index)
    function reveal() {
      finished = true
      animation.current?.cancel()
      animation.current = null
      strip.style.transform = `translate3d(${layout.end}px, 0, 0)`
      focus(layout.landing)
      setStage('revealed')
      cancelAnimationFrame(frame)
    }
    complete.current = reveal
    function position(time = 0) {
      layout = reelLayout(windowEl.clientWidth, entries.length, index)
      strip.style.setProperty('--reel-card-width', `${layout.card}px`)
      strip.style.transform = `translate3d(${layout.end}px, 0, 0)`
      if (finished) return
      const a = strip.animate([
        { transform: `translate3d(${layout.start}px, 0, 0)` },
        { transform: `translate3d(${layout.end}px, 0, 0)` },
      ], { duration: REEL_DURATION, easing: 'cubic-bezier(.12,.72,.12,1)', fill: 'forwards' })
      a.currentTime = time
      a.onfinish = reveal
      animation.current = a
    }
    function tick() {
      if (finished) return
      const a = animation.current
      const elapsed = Number(a?.currentTime ?? 0)
      if (elapsed >= REEL_DURATION) { reveal(); return }
      setStage(elapsed >= 5100 ? 'critical' : elapsed >= 3300 ? 'tension' : 'racing')
      const progress = Number(a?.effect?.getComputedTiming().progress ?? 0)
      const x = layout.start + (layout.end - layout.start) * progress
      const center = windowEl.clientWidth / 2 - layout.card / 2
      focus(Math.round((center - x) / layout.stride))
      frame = requestAnimationFrame(tick)
    }
    position()
    if (reduced) reveal()
    else { setStage('racing'); frame = requestAnimationFrame(tick) }
    const observer = new ResizeObserver(() => {
      const time = Number(animation.current?.currentTime ?? 0)
      animation.current?.cancel()
      position(time)
    })
    observer.observe(windowEl)
    return () => {
      finished = true
      observer.disconnect()
      cancelAnimationFrame(frame)
      animation.current?.cancel()
      animation.current = null
    }
  }, [entries.length, index, reduced])

  return <div className={'tie-reel' + (reduced ? ' reel-reduced' : '')} data-stage={stage}>
    <div className="reel-kicker"><span />{t('game:reel.kicker')}<span /></div>
    <Title title={t('game:reel.title')} sub={t('game:reel.' + (kind === 'target' ? 'targetSub' : 'actionSub'))} />
    <div className="reel-camera" aria-hidden="true">
      <div className="reel-scanline" />
      <div className="reel-pointer"><span /><i /><span /></div>
      <div className="reel-window" ref={viewport}>
        <div className="reel-track" ref={track}>
          {Array.from({ length: landing + 7 }, (_, slot) => {
            const entry = entries[slot % entries.length]
            return <div key={slot} className={'reel-card tone-' + (slot % entries.length % 5)}
              data-entry={entry.id} data-slot={slot} data-focused={slot === focused}
              data-landed={done && slot === landing}>
              <span className="reel-card-top"><i />{t('game:reel.' + (kind === 'target' ? 'player' : 'action'))}</span>
              <div className="reel-portrait">{entry.person ? <Portrait person={entry.person} /> : <ChoiceArt chat={entry.id === 'extra'} />}</div>
              <strong>{entry.name}</strong>
              <div className="reel-card-line" />
            </div>
          })}
        </div>
      </div>
      <div className="reel-edge left" /><div className="reel-edge right" />
      <div className="reel-pin"><Icon name="next" size={17} /></div>
      {done && <div className="reel-burst">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ '--angle': `${i * 22.5}deg` } as CSSProperties} />)}</div>}
    </div>
    <div className="reel-status" role="status" aria-live="polite" aria-atomic="true">
      <div className="reel-ecg" aria-hidden="true"><svg viewBox="0 0 180 36"><path d="M0 20h45l8-8 9 17 12-25 12 30 10-14h84" /></svg></div>
      <span className="reel-stage-label">{t('game:reel.stages.' + stage)}</span>
      {done ? <>
        <strong className="reel-result-name">{selected.name}</strong>
        <p>{t('game:reel.' + (kind === 'target' ? 'targetResult' : 'actionResult'), { name: selected.name })}</p>
      </> : <p>{t('game:reel.' + (stage === 'racing' ? 'racingSub' : 'tensionSub'))}</p>}
    </div>
    <div className="reel-candidates" role="list" aria-label={t('game:reel.candidates')}>
      {entries.map((entry) => <span key={entry.id} role="listitem" className={done && entry.id === selected.id ? 'reel-candidate-picked' : ''}>{entry.name}</span>)}
    </div>
    <Footer><Action onClick={done ? next : () => complete.current()}>{t(done ? 'game:wheelDone' : 'game:wheelSkip')}<Icon name="next" size={18} /></Action></Footer>
  </div>
}
