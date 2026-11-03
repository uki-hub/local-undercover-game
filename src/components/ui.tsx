import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { AvatarBadge } from '../avatars/AvatarBadge'
import type { Person } from '../engine/model'
import { useGame } from '../store/session'

const paths = {
  gear: 'M9.4 3.5 10 2h4l.6 1.5 1.6.9 1.7-.3 2 3.4-1.2 1.3v2l1.2 1.3-2 3.5-1.7-.3-1.6.9L14 18h-4l-.6-1.8-1.6-.9-1.7.3-2-3.5 1.2-1.3v-2L4.1 7.5l2-3.4 1.7.3z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v11H5z M12 14v3',
  next: 'm9 5 7 7-7 7',
  back: 'm15 5-7 7 7 7',
  plus: 'M12 4v16 M4 12h16',
  check: 'm4 12 5 5L20 6',
  book: 'M12 6C8 3 5 4 2 4v14c4-1 7 0 10 2 3-2 6-3 10-2V4c-3 0-6-1-10 2v14',
  finger:
    'M3 10C4 0 20 0 21 11 M6 12c0-8 12-9 12 0 0 4 .5 6 2 8 M9 20c2-4 1-7 2-9 1-2 4-1 4 2 0 4 .5 6 2 9 M5 18c2-2 2-4 2-6 M12 22l1-4',
  trophy: 'M7 3h10v6a5 5 0 0 1-10 0z M7 5H3v2c0 3 2 5 5 5 M17 5h4v2c0 3-2 5-5 5 M12 14v5 M7 21h10',
  people: 'M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M4 21v-2a8 8 0 0 1 16 0v2',
  phone: 'M7 2h10q2 0 2 2v16q0 2-2 2H7q-2 0-2-2V4q0-2 2-2z M10 18h4',
}
export function Icon({ name, size = 22 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  )
}
export function Title({ title, sub, tag }: { title: string; sub?: string; tag?: string }) {
  return (
    <div className="heading">
      {tag && <span className="pill">{tag}</span>}
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
  )
}
export function Footer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const footer = ref.current!, phone = footer.closest<HTMLElement>('.phone')!
    const measure = () => phone.style.setProperty('--dock-height', `${footer.offsetHeight}px`)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className="footer">{children}</div>
}
export function Action({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: ReactNode
  onClick: () => void
  secondary?: boolean
  disabled?: boolean
}) {
  return (
    <motion.button className={secondary ? 'secondary' : 'primary'} onClick={onClick} disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.975 }} transition={{ duration: 0.1 }}>
      {children}
    </motion.button>
  )
}
export function Portrait({
  person,
  live = false,
  selected = false,
}: {
  person: Pick<Person, 'avatar'>
  live?: boolean
  selected?: boolean
}) {
  const reduced = useGame((s) => s.profile.reduced)
  return <AvatarBadge id={person.avatar} live={live} selected={selected} reduced={reduced} />
}
export function CharacterStage({ person, group = false, compact = false }: {
  person: Pick<Person, 'avatar'>; group?: boolean; compact?: boolean
}) {
  return <div className={'character-stage' + (compact ? ' stage-compact' : '')} aria-hidden="true">
    <span className="stage-glow" /><span className="stage-orbit" /><span className="stage-spark" />
    <div className="stage-lead"><Portrait person={person} live /></div>
    {group && <>
      <span className="stage-friend friend-left"><Portrait person={{ avatar: 'pig' }} /></span>
      <span className="stage-friend friend-right"><Portrait person={{ avatar: 'raccoon' }} /></span>
    </>}
  </div>
}

export function Stepper({ value, min, max, onChange, label }: {
  value: number; min: number; max: number; onChange: (value: number) => void; label: string
}) {
  const { t } = useTranslation()
  return <span className="stepper">
    <button type="button" aria-label={t('decrease', { name: label })} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
    <select aria-label={label} value={value} onChange={e => onChange(+e.target.value)}>
      {Array.from({ length: max - min + 1 }, (_, i) => <option key={i} value={i + min}>{i + min}</option>)}
    </select>
    <button type="button" aria-label={t('increase', { name: label })} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
  </span>
}
export function Strip({ people, selected }: { people: Person[]; selected?: string }) {
  const { t } = useTranslation()
  return (
    <div className="strip" role="list" aria-label={t('game:survivors')}>
      {people.map((p) => (
        <div key={p.id} role="listitem">
          <Portrait person={p} selected={p.id === selected} />
          <span className="survivor-name">{p.name}</span>
        </div>
      ))}
    </div>
  )
}
export function PlayerCard({
  p,
  onClick,
  selected = false,
  mark = false,
}: {
  p: Person
  onClick: () => void
  selected?: boolean
  mark?: boolean
}) {
  return (
    <motion.button
      className={'player-card ' + (selected ? 'chosen' : '')}
      aria-pressed={selected}
      onClick={onClick}
      layout="position"
      transition={{ layout: { type: 'spring', stiffness: 420, damping: 34 } }}
    >
      {selected && mark && (
        <i className="tick">
          <Icon name="check" size={14} />
        </i>
      )}
      <span className="portrait">
        <Portrait person={p} selected={selected} />
      </span>
      <strong>{p.name}</strong>
    </motion.button>
  )
}
export function ChoiceArt({ chat }: { chat: boolean }) {
  return (
    <svg className="choice-art" viewBox="0 0 82 84" aria-hidden="true">
      <defs>
        <linearGradient id="paper" x2=".5" y2="1">
          <stop stopColor="white" />
          <stop offset="1" stopColor="#b3c8e1" />
        </linearGradient>
        <linearGradient id="bubble" x2=".4" y2="1">
          <stop stopColor="#69c4ff" />
          <stop offset=".5" stopColor="#238aff" />
          <stop offset="1" stopColor="#0050d7" />
        </linearGradient>
      </defs>
      {chat ? (
        <>
          <path
            d="M15 62C-1 42 7 13 32 9 56 3 77 20 75 42 74 62 55 75 33 69L12 80z"
            fill="url(#bubble)"
            stroke="#419dff"
            strokeWidth="2"
          />
          <path d="M16 31C24 12 43 11 54 16" fill="none" stroke="#9cd7ff" strokeWidth="3" />
          {[25, 41, 57].map((x) => (
            <circle key={x} cx={x} cy="40" r="4.5" fill="white" />
          ))}
        </>
      ) : (
        <>
          <path d="m6 39 34-10 35 10-33 12z" fill="#e6f5ff" />
          <path d="m6 39 36 12v29L7 67z" fill="url(#paper)" />
          <path d="m42 51 33-12-1 29-32 12z" fill="#b9d3ef" />
          <path d="m16 39 24-7 25 7-24 7z" fill="url(#bubble)" />
          <path d="m25 39 13-31q1-3 4-2l20 5-13 31z" fill="url(#paper)" stroke="#fff" />
        </>
      )}
    </svg>
  )
}
