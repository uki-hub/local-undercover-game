import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Action, ChoiceArt, Footer, Icon, Title } from './ui'
import { RoleEmblem, type RoleKind } from './RoleEmblem'
import type { Match } from '../engine/model'

export type SceneTheme = 'village' | 'shadow' | 'frost' | 'gold' | 'rose' | 'justice' | 'danger' | 'sky' | 'night' | 'suspense'
export const roleTheme: Record<RoleKind, SceneTheme> = {
  civilian: 'village', undercover: 'shadow', white: 'frost', fool: 'gold',
  couple: 'rose', justice: 'justice', revenger: 'danger', mime: 'sky',
}
export const winnerRole = (winner: Match['winner']): RoleKind | undefined =>
  winner === 'impostor' ? 'undercover' : winner && winner !== 'draw' ? winner : undefined

export function matchTheme(m: Match): SceneTheme | undefined {
  if (m.phase === 'wheel') return 'suspense'
  if (m.phase === 'victory' || m.phase === 'result') return m.winner === 'draw' ? 'night' : roleTheme[winnerRole(m.winner) ?? 'white']
  if (['revengeCall', 'revenge'].includes(m.phase)) return 'danger'
  if (['justiceCall', 'justice'].includes(m.phase)) return 'justice'
  if (['guess', 'guessResult'].includes(m.phase)) return m.whiteWin ? 'frost' : 'night'
  if (m.phase === 'actionResult') return m.outcome === 'extra' ? 'sky' : 'shadow'
  if (m.phase === 'ready' || m.phase === 'mimeReveal') return 'sky'
  if (m.phase === 'death') {
    const death = m.deaths.at(-1), dead = m.players.find((p) => p.id === death?.id)
    if (dead?.role === 'fool' && m.foolWin === dead.id) return 'gold'
    if (dead?.modifier === 'revenger') return 'danger'
    return death?.cause === 'partner' ? 'rose' : 'danger'
  }
}

type Effect = 'confetti' | 'blood' | 'wings' | 'hearts' | 'sparks'
export function SceneEffects({ effect }: { effect: Effect }) {
  return <div className={'scene-effects effect-' + effect} aria-hidden="true">
    {Array.from({ length: effect === 'confetti' ? 32 : 14 }, (_, i) => <i key={i} style={{
      '--i': i, '--x': `${(i * 37 + 7) % 100}%`, '--delay': `${(i % 6) * .04}s`,
      '--drift': `${((i * 19) % 90) - 45}px`, '--spin': `${i * 47}deg`,
    } as CSSProperties} />)}
  </div>
}

export function EventArt({ role, art, effect = 'sparks' }: {
  role?: RoleKind; art?: 'vote' | 'extra' | 'draw'; effect?: Effect
}) {
  return <div className={'event-art art-' + (role ?? art) + ' art-' + effect} aria-hidden="true">
    <div className="event-halo" /><div className="event-orbit" />
    {effect === 'wings' && <svg className="justice-wings" viewBox="0 0 400 230">
      <path className="wing-left" d="M185 147C142 75 94 65 22 21c0 42 24 59 52 76L33 79c15 40 43 44 67 55l-47-6c21 27 54 35 83 34l-42 10c31 20 65 7 91-25Z" />
      <path className="wing-right" d="M215 147C258 75 306 65 378 21c0 42-24 59-52 76l41-18c-15 40-43 44-67 55l47-6c-21 27-54 35-83 34l42 10c-31 20-65 7-91-25Z" />
    </svg>}
    <div className="event-symbol">
      {role ? <RoleEmblem role={role} /> : art === 'draw' ? <Icon name="people" size={100} /> : <ChoiceArt chat={art === 'extra'} />}
    </div>
    <span className="art-star star-a">✦</span><span className="art-star star-b">✧</span><span className="art-star star-c">✦</span>
  </div>
}

export function EventScene({ title, tag, sub, role, art, effect = 'sparks', children, next, action, compact = false }: {
  title: string; tag: string; sub?: string; role?: RoleKind; art?: 'vote' | 'extra' | 'draw';
  effect?: Effect; children?: ReactNode; next: () => void; action?: string; compact?: boolean
}) {
  const { t } = useTranslation()
  return <div className={'event-scene' + (compact ? ' round-scene' : '')} data-event={role ?? art}>
    <SceneEffects effect={effect} />
    <div className="event-kicker"><span />{tag}<span /></div>
    <EventArt role={role} art={art} effect={effect} />
    <Title title={title} sub={sub} />
    {children && <div className="event-details">{children}</div>}
    <Footer><Action onClick={next}>{action ?? t('next')}<Icon name="next" size={19} /></Action></Footer>
  </div>
}
