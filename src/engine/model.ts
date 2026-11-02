import { z } from 'zod'
import { ANIMALS } from '../avatars/manifest'
import { difficulties, tripleSchema, normalize } from '../content/words'

export const personSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(20),
  avatar: z.enum(ANIMALS),
})
export type Person = z.infer<typeof personSchema>
export const rosterSchema = z
  .array(personSchema)
  .min(3)
  .max(20)
  .refine(
    (list) =>
      new Set(list.map((p) => normalize(p.name))).size === list.length &&
      new Set(list.map((p) => p.id)).size === list.length,
  )
export const settingsSchema = z.object({
  undercover: z.number().int().min(1).max(9),
  white: z.boolean(),
  whiteCanStart: z.boolean().default(true),
  fool: z.boolean(),
  foolHasWord: z.boolean().default(true),
  foolCanStart: z.boolean().default(true),
  couple: z.boolean(),
  justice: z.boolean(),
  revenger: z.boolean(),
  mime: z.boolean(),
  category: z.string(),
  difficulty: z.enum(['all', ...difficulties]),
  wordSource: z.enum(['all', 'custom']).default('all'),
  clueSeconds: z.number().int().min(0).max(600),
  discussionSeconds: z.number().int().min(0).max(600),
})
export type Settings = z.infer<typeof settingsSchema>
export const defaults: Settings = {
  undercover: 1,
  white: false,
  whiteCanStart: true,
  fool: false,
  foolHasWord: true,
  foolCanStart: true,
  couple: false,
  justice: false,
  revenger: false,
  mime: false,
  category: 'all',
  difficulty: 'all',
  wordSource: 'all',
  clueSeconds: 0,
  discussionSeconds: 0,
}
export const presets = [
  { id: 'classic', size: 6, roles: {} },
  { id: 'light', size: 6, roles: { fool: true, mime: true } },
  {
    id: 'medium',
    size: 8,
    roles: { undercover: 2, fool: true, mime: true, justice: true, revenger: true },
  },
  {
    id: 'full',
    size: 10,
    roles: {
      undercover: 2,
      white: true,
      fool: true,
      mime: true,
      justice: true,
      revenger: true,
      couple: true,
    },
  },
] as const

export function setupIssue(list: Person[], settings: Settings, poolSize: number) {
  if (!rosterSchema.safeParse(list).success) return 'roster'
  if (!settingsSchema.safeParse(settings).success) return 'settings'
  const impostors = settings.undercover + Number(settings.white)
  if (list.length - impostors - Number(settings.fool) <= impostors) return 'balance'
  if (
    Number(settings.couple) * 2 + Number(settings.justice) + Number(settings.revenger) >
    list.length
  )
    return 'modifiers'
  return poolSize ? null : 'pool'
}

const roleSchema = z.enum(['civilian', 'undercover', 'white', 'fool'])
const playerSchema = personSchema.extend({
  role: roleSchema,
  modifier: z.enum(['couple', 'justice', 'revenger']).nullable(),
  alive: z.boolean(),
})
export type Role = z.infer<typeof roleSchema>
export type Player = z.infer<typeof playerSchema>
export const phases = [
  'intro',
  'word',
  'mimeReveal',
  'ready',
  'clue',
  'discussion',
  'action',
  'actionResult',
  'target',
  'wheel',
  'justice',
  'justiceCall',
  'death',
  'guess',
  'guessResult',
  'revenge',
  'revengeCall',
  'victory',
  'result',
] as const
const ids = z.array(z.string())
const effectSchema = z.object({
  kind: z.enum(['partner', 'revengeKill', 'revengeChoice']),
  id: z.string(),
})
export const matchSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  revision: z.number().int().nonnegative(),
  phase: z.enum(phases),
  round: z.number().int().positive(),
  settings: settingsSchema,
  players: z.array(playerSchema).min(3).max(20),
  // The active card stays valid if a later dictionary retires its category.
  triple: tripleSchema.safeExtend({ categoryId: z.string().min(1) }),
  locale: z.string(),
  contentVersion: z.string(),
  swapped: z.boolean(),
  order: ids.min(1),
  cursor: z.number().int().nonnegative(),
  extra: z.boolean(),
  mime: z.string().nullable(),
  mimeHistory: ids,
  votes: z.record(z.string(), z.string()),
  candidates: ids,
  outcome: z.string(),
  ballot: z.enum(['action', 'target']),
  actor: z.string(),
  deaths: z.array(z.object({ id: z.string(), cause: z.enum(['vote', 'partner', 'revengeKill']) })),
  queue: z.array(effectSchema),
  foolWin: z.string().nullable(),
  whiteWin: z.string().nullable(),
  winner: z.enum(['civilian', 'impostor', 'couple', 'white', 'fool', 'draw']).nullable(),
})
export type Match = z.infer<typeof matchSchema>
export const living = (m: Match) => m.players.filter((p) => p.alive)
export const player = (m: Match, id: string) => m.players.find((p) => p.id === id)!
export function assigned(m: Match, p: Pick<Player, 'role'>) {
  if (p.role === 'white') return null
  if (p.role === 'fool') return m.settings.foolHasWord ? m.triple.foolWord : null
  return (p.role === 'civilian') !== m.swapped ? m.triple.wordA : m.triple.wordB
}
export const isPrivate = (phase: Match['phase']) =>
  (
    ['intro', 'word', 'action', 'target', 'justice', 'guess', 'revenge'] as Match['phase'][]
  ).includes(phase)
export function actorId(m: Match) {
  if (['intro', 'word'].includes(m.phase)) return m.players[m.cursor].id
  if (['clue', 'action', 'target'].includes(m.phase)) return m.order[m.cursor]
  return m.actor
}
