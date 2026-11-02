import { expect, it } from 'vitest'
import { start, transition } from '../../src/engine/game'
import { assigned, defaults, matchSchema, settingsSchema, type Person, type Settings } from '../../src/engine/model'
import { packSchema } from '../../src/content/words'
import { coherent } from '../../src/store/session'
import raw from '../../public/words/id.json'

const pack = packSchema.parse(raw)
const people: Person[] = Array.from({ length: 6 }, (_, i) => ({
  id: 'p' + i, name: 'Pemain ' + i, avatar: 'cat',
}))
const first = () => 0
const next = (m: ReturnType<typeof start>) => transition(m, m.revision, { type: 'next' }, first)

it.each([true, false])('Mr. White opener=%s retains no-word cards, clue turns and rematch settings', (whiteCanStart) => {
  const settings = { ...defaults, white: true, whiteCanStart }
  const m = start(people, settings, pack, [], [], first)
  const white = m.players.find((p) => p.role === 'white')!
  expect(m.order[0] === white.id).toBe(whiteCanStart)
  expect(assigned(m, white)).toBeNull()
  settings.whiteCanStart = !whiteCanStart
  let restored = matchSchema.parse(JSON.parse(JSON.stringify(m)))
  expect(restored.settings.whiteCanStart).toBe(whiteCanStart)
  expect(restored.order).toEqual(m.order)
  expect(coherent(restored)).toBe(true)
  for (let i = 0; i < people.length; i++) restored = next(restored)
  restored = next(restored)
  const speakers: string[] = []
  while (restored.phase === 'clue') {
    speakers.push(restored.order[restored.cursor])
    restored = next(restored)
  }
  expect(speakers).toEqual(m.order)
  expect(speakers).toContain(white.id)
  const rematch = start(restored.players, restored.settings, pack, [], [m.triple.id], first)
  expect(rematch.settings.whiteCanStart).toBe(whiteCanStart)
  expect(assigned(rematch, { role: 'white' })).toBeNull()
  expect(rematch.players.find((p) => p.id === rematch.order[0])!.role === 'white').toBe(whiteCanStart)
})

it.each([
  [true, true], [true, false], [false, true], [false, false],
])('White opener=%s and Fool opener=%s independently control the eligible draw', (whiteCanStart, foolCanStart) => {
  const seen = new Set<string>()
  for (let seed = 1; seed <= 100; seed++) {
    let state = seed
    const rng = (n: number) => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return Math.floor(state / 4294967296 * n)
    }
    const m = start(people, { ...defaults, white: true, fool: true, whiteCanStart, foolCanStart }, pack, [], [], rng)
    const opener = m.players.find((p) => p.id === m.order[0])!
    if (!whiteCanStart) expect(opener.role).not.toBe('white')
    if (!foolCanStart) expect(opener.role).not.toBe('fool')
    seen.add(opener.role)
    const index = m.players.indexOf(opener)
    expect(m.order).toEqual([...people.slice(index), ...people.slice(0, index)].map((p) => p.id))
  }
  expect(seen).toEqual(new Set([
    'civilian', 'undercover', ...(whiteCanStart ? ['white'] : []), ...(foolCanStart ? ['fool'] : []),
  ]))
})

it('old profiles/matches retain White eligibility; the option has no effect without White', () => {
  const legacy: Partial<Settings> = { ...defaults, white: true }
  delete legacy.whiteCanStart
  const settings = settingsSchema.parse(legacy)
  expect(settings.whiteCanStart).toBe(true)
  const m = start(people, settings, pack, [], [], first)
  const restored = matchSchema.parse({ ...m, settings: legacy })
  expect(restored).toEqual(m)
  expect(coherent(restored)).toBe(true)
  expect(settingsSchema.safeParse({ ...defaults, whiteCanStart: 'false' }).success).toBe(false)
  const normal = start(people, defaults, pack, [], [], first)
  const disabled = start(people, { ...defaults, whiteCanStart: false }, pack, [], [], first)
  expect(disabled.players).toEqual(normal.players)
  expect(disabled.order).toEqual(normal.order)
})
