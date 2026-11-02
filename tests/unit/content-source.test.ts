import { expect, it } from 'vitest'
import { start } from '../../src/engine/game'
import { defaults, settingsSchema, type Person } from '../../src/engine/model'
import { packSchema } from '../../src/content/words'
import raw from '../../public/words/id.json'

const pack = packSchema.parse(raw)
const people: Person[] = Array.from({ length: 6 }, (_, i) => ({ id: 'p' + i, name: 'Pemain ' + i, avatar: 'cat' }))

it('legacy settings retain the combined word pool', () => {
  const legacy: Partial<typeof defaults> = { ...defaults }
  delete legacy.wordSource
  const restored = settingsSchema.parse(legacy)
  expect(restored.wordSource).toBe('all')
  expect(start(people, restored, pack, [], [], () => 0).triple.id).toBe(pack.sets[0].id)
})

it('custom-only deals respect filters, recency and pinned snapshots without bundled fallback', () => {
  const settings = { ...defaults, wordSource: 'custom' as const }
  const custom = pack.sets.slice(0, 2).map((s, i) => ({ ...s, id: 'custom-' + i }))
  expect(() => start(people, settings, pack, [], [], () => 0)).toThrow('pool')
  const m = start(people, settings, pack, custom, [custom[0].id], () => 0)
  expect(m.triple.id).toBe(custom[1].id)
  const original = m.triple.wordA
  custom[1].wordA = 'Kata baru'
  expect(m.triple.wordA).toBe(original)
  expect(() => start(people, { ...settings, category: 'retired' }, pack, custom, [], () => 0)).toThrow('pool')
})
