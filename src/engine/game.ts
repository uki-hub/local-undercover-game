import { chooseTriple, wordPool, normalize, type Pack, type Triple } from '../content/words'
import {
  actorId,
  assigned,
  living,
  player,
  setupIssue,
  type Match,
  type Person,
  type Player,
  type Role,
  type Settings,
} from './model'
import { newId, random, shuffle, type Random } from './random'

export function start(
  list: Person[],
  settings: Settings,
  pack: Pack,
  custom: Triple[],
  history: string[],
  rng: Random = random,
): Match {
  const pool = wordPool(pack, custom, settings)
  const issue = setupIssue(list, settings, pool.length)
  if (issue) throw Error(issue)
  const roles: Role[] = [...Array<Role>(settings.undercover).fill('undercover')]
  if (settings.white) roles.push('white')
  if (settings.fool) roles.push('fool')
  while (roles.length < list.length) roles.push('civilian')
  const deals = shuffle(roles, rng)
  const players: Player[] = list.map((p, i) => ({
    ...p,
    name: p.name.trim(),
    role: deals[i],
    modifier: null,
    alive: true,
  }))
  if (settings.couple)
    shuffle(
      players.filter((p) => p.role !== 'fool'),
      rng,
    )
      .slice(0, 2)
      .forEach((p) => {
        p.modifier = 'couple'
      })
  const free = shuffle(
    players.filter((p) => !p.modifier),
    rng,
  )
  if (settings.justice) free.pop()!.modifier = 'justice'
  if (settings.revenger) free.pop()!.modifier = 'revenger'
  const first = rng(players.length)
  return {
    version: 1,
    id: newId(),
    revision: 0,
    phase: 'intro',
    round: 1,
    settings: { ...settings },
    players,
    triple: chooseTriple(pool, history, rng),
    locale: pack.locale,
    contentVersion: pack.contentVersion,
    swapped: rng(2) === 1,
    order: [...players.slice(first), ...players.slice(0, first)].map((p) => p.id),
    cursor: 0,
    extra: false,
    mime: null,
    mimeHistory: [],
    votes: {},
    candidates: [],
    outcome: '',
    ballot: 'action',
    actor: '',
    deaths: [],
    queue: [],
    foolWin: null,
    whiteWin: null,
    winner: null,
  }
}

export function victory(m: Match): Match['winner'] {
  const alive = living(m)
  if (m.whiteWin) return 'white'
  if (!alive.length) return 'draw'
  if (alive.filter((p) => p.modifier === 'couple').length === 2)
    return alive.length === 2 ? 'couple' : null
  const civilians = alive.filter((p) => p.role === 'civilian').length
  const impostors = alive.filter((p) => p.role === 'undercover' || p.role === 'white').length
  if (!civilians && !impostors) return 'draw'
  if (!impostors) return 'civilian'
  return impostors >= civilians ? 'impostor' : null
}
export function awardIds(m: Match) {
  if (!m.winner) return []
  return m.players
    .filter((p) => {
      if (p.id === m.foolWin) return true
      if (m.winner === 'white') return p.id === m.whiteWin
      if (p.modifier === 'couple') return m.winner === 'couple'
      if (m.winner === 'civilian') return p.role === 'civilian'
      return m.winner === 'impostor' && (p.role === 'white' || p.role === 'undercover')
    })
    .map((p) => p.id)
}
function rotateMime(m: Match, rng: Random) {
  if (!m.settings.mime) return
  const eligible = living(m).filter((p) => p.role !== 'white')
  let pool = eligible.filter((p) => !m.mimeHistory.includes(p.id))
  if (!pool.length) {
    m.mimeHistory = []
    pool = eligible.filter((p) => eligible.length === 1 || p.id !== m.mime)
  }
  m.mime = pool.length ? pool[rng(pool.length)].id : null
  if (m.mime) m.mimeHistory.push(m.mime)
}
function recordDeath(m: Match, id: string, cause: Match['deaths'][number]['cause']) {
  const p = player(m, id)
  p.alive = false
  m.deaths.push({ id, cause })
  if (cause === 'vote' && p.role === 'fool') m.foolWin = id
  if (p.modifier === 'couple') {
    const partner = living(m).find((other) => other.modifier === 'couple')
    if (partner) m.queue.push({ kind: 'partner', id: partner.id })
  }
  if (p.modifier === 'revenger') m.queue.push({ kind: 'revengeChoice', id })
  m.phase = 'death'
}
function drain(m: Match, rng: Random) {
  while (m.queue.length) {
    const e = m.queue.shift()!
    if (e.kind === 'revengeChoice') {
      if (!living(m).length) continue
      m.actor = e.id
      m.phase = 'revenge'
      return
    }
    if (player(m, e.id).alive) {
      recordDeath(m, e.id, e.kind)
      return
    }
  }
  m.winner = victory(m)
  if (m.winner) {
    m.phase = 'result'
    return
  }
  const rotated = [...m.order.slice(1), m.order[0]]
  m.order = rotated.filter((id) => player(m, id).alive)
  m.round++
  m.cursor = 0
  m.extra = false
  m.deaths = []
  rotateMime(m, rng)
  m.phase = 'ready'
}
function beginBallot(m: Match, kind: Match['ballot']) {
  m.phase = m.ballot = kind
  m.cursor = 0
  m.votes = {}
  m.candidates = []
  m.outcome = ''
}
function finalizeBallot(m: Match, rng: Random) {
  const counts = new Map<string, number>()
  for (const choice of Object.values(m.votes)) counts.set(choice, (counts.get(choice) || 0) + 1)
  const high = Math.max(...counts.values())
  // Roster order is public. Never order candidates by first vote received.
  m.candidates = (m.ballot === 'action' ? ['eliminate', 'extra'] : m.order).filter(
    (id) => counts.get(id) === high,
  )
  m.votes = {}
  if (m.candidates.length > 1) {
    const justice = living(m).find((p) => p.modifier === 'justice')
    if (m.ballot === 'target' && justice && !m.candidates.includes(justice.id)) {
      m.phase = 'justice'
      m.actor = justice.id
      return
    }
    m.outcome = m.candidates[rng(m.candidates.length)]
    m.phase = 'wheel'
    return
  }
  m.outcome = m.candidates[0]
  applyOutcome(m)
}
function applyOutcome(m: Match) {
  if (m.ballot === 'action') m.phase = 'actionResult'
  else recordDeath(m, m.outcome, 'vote')
}
export type Command = { type: 'next' } | { type: 'choose'; actor: string; value: string }
export function choices(m: Match): string[] {
  if (m.phase === 'action') return ['eliminate', 'extra']
  if (m.phase === 'target') return m.order.filter((id) => id !== actorId(m))
  if (m.phase === 'justice') return m.candidates
  if (m.phase === 'revenge') return living(m).map((p) => p.id)
  return []
}
// Every control captures its rendered revision. Stale/double submissions are inert.
export function transition(
  current: Match,
  revision: number,
  cmd: Command,
  rng: Random = random,
): Match {
  if (current.revision !== revision || current.winner) return current
  const m = structuredClone(current)
  if (cmd.type === 'choose') {
    if (cmd.actor !== actorId(m)) return current
    if (m.phase === 'guess') {
      const guess = normalize(cmd.value)
      if (!guess || guess.length > 160) return current
      const aliases = (m.swapped ? m.triple.aliasesB : m.triple.aliasesA) || []
      if ([assigned(m, { role: 'civilian' })!, ...aliases].some((w) => normalize(w) === guess))
        m.whiteWin = m.actor
      m.phase = 'guessResult'
    } else {
      if (!choices(m).includes(cmd.value)) return current
      if (m.phase === 'action' || m.phase === 'target') {
        if (Object.hasOwn(m.votes, cmd.actor)) return current
        m.votes[cmd.actor] = cmd.value
        if (m.cursor === m.order.length - 1) finalizeBallot(m, rng)
        else m.cursor++
      } else if (m.phase === 'justice') recordDeath(m, cmd.value, 'vote')
      else if (m.phase === 'revenge') recordDeath(m, cmd.value, 'revengeKill')
    }
  } else {
    switch (m.phase) {
      case 'intro':
      case 'word':
        if (++m.cursor === m.players.length) {
          m.cursor = 0
          if (m.phase === 'intro') m.phase = 'word'
          else {
            rotateMime(m, rng)
            m.phase = 'ready'
          }
        }
        break
      case 'ready':
        m.phase = 'clue'
        m.cursor = 0
        break
      case 'clue':
        if (++m.cursor === m.order.length) {
          m.cursor = 0
          m.phase = 'discussion'
        }
        break
      case 'discussion':
        beginBallot(m, m.extra ? 'target' : 'action')
        break
      case 'wheel':
        applyOutcome(m)
        break
      case 'actionResult':
        if (m.outcome === 'extra') {
          m.extra = true
          m.cursor = 0
          m.phase = 'clue'
        } else beginBallot(m, 'target')
        break
      case 'death': {
        const last = m.deaths.at(-1)!
        if (last.cause === 'vote' && player(m, last.id).role === 'white') {
          m.actor = last.id
          m.phase = 'guess'
        } else drain(m, rng)
        break
      }
      case 'guessResult':
        drain(m, rng)
        break
      default:
        return current
    }
  }
  m.revision++
  return m
}
