import { z } from 'zod'
import type { Random } from '../engine/random'
import labels from '../locales/id/common.json' with { type: 'json' }

export const normalize = (s: string) =>
  s.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('id')
export const categories = Object.keys(labels.categories)
export const difficulties = ['easy', 'medium', 'hard'] as const
const word = z.string().trim().min(1).max(80)
export const tripleSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
    categoryId: z.string().refine((s) => categories.includes(s)),
    difficulty: z.enum(difficulties),
    wordA: word,
    wordB: word,
    foolWord: word,
    aliasesA: z.array(word).optional(),
    aliasesB: z.array(word).optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    const seen = new Set<string>()
    for (const field of ['wordA', 'wordB', 'foolWord', 'aliasesA', 'aliasesB'] as const) {
      const items = s[field]
      for (const value of typeof items === 'string' ? [items] : items || []) {
        const key = normalize(value)
        if (!key || seen.has(key))
          ctx.addIssue({ code: 'custom', path: [field], message: 'duplicateOrEmpty' })
        seen.add(key)
      }
    }
  })
export const setsSchema = z.array(tripleSchema).superRefine((sets, ctx) => {
  const ids = new Set<string>()
  sets.forEach((s, i) => {
    if (ids.has(s.id)) ctx.addIssue({ code: 'custom', path: [i, 'id'], message: 'duplicateId' })
    ids.add(s.id)
  })
})
export const packSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: word,
  locale: z.string().min(1),
  sets: setsSchema.nonempty(),
})
export type Triple = z.infer<typeof tripleSchema>
export type Pack = z.infer<typeof packSchema>
export async function loadPack(locale: string, path: string): Promise<Pack> {
  const res = await fetch(import.meta.env.BASE_URL + path)
  if (!res.ok) throw Error('pack')
  const pack = packSchema.parse(await res.json())
  if (pack.locale !== locale) throw Error('locale')
  return pack
}
export function filtered(sets: Triple[], category: string, difficulty: string) {
  return sets.filter(
    (s) =>
      (category === 'all' || s.categoryId === category) &&
      (difficulty === 'all' || s.difficulty === difficulty),
  )
}
export function wordPool(pack: Pack, custom: Triple[], settings: {
  category: string; difficulty: string; wordSource: 'all' | 'custom'
}) {
  return filtered(settings.wordSource === 'custom' ? custom : [...pack.sets, ...custom],
    settings.category, settings.difficulty)
}
export function chooseTriple(pool: Triple[], history: string[], rng: Random) {
  if (!pool.length) throw Error('pool')
  const recent = history.slice(-20)
  const oldest = Math.min(...pool.map((s) => recent.lastIndexOf(s.id)))
  const available = pool.filter((s) => recent.lastIndexOf(s.id) === oldest)
  return structuredClone(available[rng(available.length)])
}
