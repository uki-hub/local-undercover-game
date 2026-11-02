import { create } from 'zustand'
import { z } from 'zod'
import { readStorage, writeStorage as write } from '../services/storage'
import { setsSchema, type Pack, type Triple } from '../content/words'
import { awardIds, start, transition, type Command } from '../engine/game'
import {
  defaults,
  matchSchema,
  rosterSchema,
  settingsSchema,
  type Match,
  type Person,
  type Settings,
} from '../engine/model'

const profileSchema = z.object({
  version: z.literal(1),
  roster: rosterSchema,
  settings: settingsSchema,
  reduced: z.boolean(),
  audio: z.boolean(),
  uiLocale: z.string(),
  wordLocale: z.string(),
  scores: z.record(z.string(), z.number().int().nonnegative()),
  scored: z.array(z.string()),
  history: z.record(z.string(), z.array(z.string())),
  custom: z.record(z.string(), setsSchema),
})
export type Profile = z.infer<typeof profileSchema>
export const LOCAL_KEY = 'undercover.profile.v1',
  MATCH_KEY = 'undercover.match.v1'
function read<T>(area: 'localStorage' | 'sessionStorage', key: string, schema: z.ZodType<T>) {
  try {
    const raw = readStorage(area, key)
    return raw ? schema.parse(JSON.parse(raw)) : null
  } catch {
    return null
  }
}
const initial: Profile = {
  version: 1,
  roster: [
    { id: 'p1', name: 'Adit', avatar: 'cat' },
    { id: 'p2', name: 'Bima', avatar: 'pig' },
    { id: 'p3', name: 'Citra', avatar: 'monkey' },
    { id: 'p4', name: 'Dina', avatar: 'chicken' },
    { id: 'p5', name: 'Eko', avatar: 'bear' },
    { id: 'p6', name: 'Fani', avatar: 'raccoon' },
  ],
  settings: defaults,
  reduced: false,
  audio: false,
  uiLocale: 'id',
  wordLocale: 'id',
  scores: {},
  scored: [],
  history: {},
  custom: {},
}
export function score(p: Profile, m: Match): Profile {
  if (!m.winner || p.scored.includes(m.id)) return p
  const scores = { ...p.scores }
  for (const id of awardIds(m)) scores[id] = (scores[id] || 0) + 1
  return { ...p, scores, scored: [...p.scored, m.id] }
}
// Validate cross-references before any screen can dereference a saved actor or candidate.
export function coherent(m: Match) {
  const ids = new Set(m.players.map((p) => p.id))
  const unique = (list: string[]) => new Set(list).size === list.length
  const known = (id: string) => ids.has(id)
  if (!rosterSchema.safeParse(m.players).success || !unique(m.order) || !m.order.every(known))
    return false
  if (
    (m.actor && !known(m.actor)) ||
    (m.mime && !known(m.mime)) ||
    (m.foolWin && !known(m.foolWin)) ||
    (m.whiteWin && !known(m.whiteWin))
  )
    return false
  if (
    !m.queue.every((e) => known(e.id)) ||
    !m.deaths.every((e) => known(e.id)) ||
    !unique(m.deaths.map((e) => e.id))
  )
    return false
  if (['intro', 'word'].includes(m.phase) && m.cursor >= m.players.length) return false
  if (['clue', 'action', 'target'].includes(m.phase) && m.cursor >= m.order.length) return false
  if (['guess', 'revenge', 'justice', 'revengeCall', 'justiceCall'].includes(m.phase) && !known(m.actor)) return false
  if ((m.phase === 'death' && !m.deaths.length) || ['victory', 'result'].includes(m.phase) !== Boolean(m.winner))
    return false
  const valid = (s: string) =>
    m.ballot === 'action' ? ['extra', 'eliminate'].includes(s) : known(s)
  if (
    !m.candidates.every(valid) ||
    !Object.entries(m.votes).every(([id, v]) => known(id) && valid(v))
  )
    return false
  if (m.phase === 'wheel' && (!m.candidates.includes(m.outcome) || m.candidates.length < 2))
    return false
  if (m.phase === 'actionResult' && !['eliminate', 'extra'].includes(m.outcome)) return false
  if (m.phase === 'mimeReveal' && (!m.settings.mime || !m.mime || !m.players.some((p) => p.id === m.mime && p.alive && p.role !== 'white'))) return false
  if (['justice', 'justiceCall'].includes(m.phase) && (m.candidates.length < 2 || m.candidates.includes(m.actor)))
    return false
  if (m.phase === 'target' || m.phase === 'action') {
    const eligible = m.order.slice(0, m.cursor)
    if (m.ballot !== m.phase || Object.keys(m.votes).length !== eligible.length) return false
    if (!eligible.every((id) => Object.hasOwn(m.votes, id))) return false
    if (
      m.phase === 'target' &&
      Object.entries(m.votes).some(([id, v]) => id === v || !m.order.includes(v))
    )
      return false
  }
  if (['ready', 'mimeReveal', 'clue', 'discussion', 'action', 'target'].includes(m.phase)) {
    const alive = m.players.filter((p) => p.alive)
    if (m.order.length !== alive.length || !alive.every((p) => m.order.includes(p.id))) return false
  }
  return true
}
function restore() {
  const m = read('sessionStorage', MATCH_KEY, matchSchema)
  return m && coherent(m) ? m : null
}
const active = restore()
let saved = read('localStorage', LOCAL_KEY, profileSchema) ?? initial
if (active) {
  saved = score(saved, active)
  write('localStorage', LOCAL_KEY, saved)
}
type Store = {
  profile: Profile
  match: Match | null
  update: (
    changes: Partial<
      Pick<
        Profile,
        'roster' | 'settings' | 'reduced' | 'audio' | 'custom' | 'uiLocale' | 'wordLocale'
      >
    >,
  ) => void
  launch: (pack: Pack, roster?: Person[], settings?: Settings) => void
  cmd: (rev: number, command: Command) => void
  clear: () => void
  resetScores: () => void
}
export const useGame = create<Store>((set, get) => ({
  profile: saved,
  match: active,
  update: (changes) => {
    const profile = profileSchema.parse({ ...get().profile, ...changes })
    write('localStorage', LOCAL_KEY, profile)
    set({ profile })
  },
  launch: (pack, roster, settings) => {
    const p = get().profile,
      locale = pack.locale
    const match = start(
      roster ?? p.roster,
      settings ?? p.settings,
      pack,
      p.custom[locale] || [],
      p.history[locale] || [],
    )
    const history = {
      ...p.history,
      [locale]: [...(p.history[locale] || []), match.triple.id].slice(-20),
    }
    const profile = { ...p, history }
    write('sessionStorage', MATCH_KEY, match)
    write('localStorage', LOCAL_KEY, profile)
    set({ profile, match })
  },
  cmd: (rev, command) => {
    const s = get()
    if (!s.match) return
    const match = transition(s.match, rev, command)
    if (match === s.match) return
    write('sessionStorage', MATCH_KEY, match)
    const profile = score(s.profile, match)
    if (profile !== s.profile) write('localStorage', LOCAL_KEY, profile)
    set({ match, profile })
  },
  clear: () => {
    write('sessionStorage', MATCH_KEY, null)
    set({ match: null })
  },
  resetScores: () => {
    const { profile, match } = get()
    if (match && !match.winner) return
    // Retain the ledger: reloading an old result must not re-award cleared points.
    const next = { ...profile, scores: {} }
    write('localStorage', LOCAL_KEY, next)
    set({ profile: next })
  },
}))
export function saveCustom(items: Triple[]) {
  const { profile, update } = useGame.getState()
  update({ custom: { ...profile.custom, [profile.wordLocale]: setsSchema.parse(items) } })
}
