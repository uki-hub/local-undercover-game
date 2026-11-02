import { describe, expect, it } from 'vitest'
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

describe('Fool options', () => {
  it.each([
    [true, true], [true, false], [false, true], [false, false],
  ])('word=%s and opener eligibility=%s are independent and survive reload/rematch', (foolHasWord, foolCanStart) => {
    const settings = { ...defaults, fool: true, foolHasWord, foolCanStart }
    const m = start(people, settings, pack, [], [], first)
    const fool = m.players.find((p) => p.role === 'fool')!
    expect(assigned(m, fool)).toBe(foolHasWord ? m.triple.foolWord : null)
    expect(assigned(m, { role: 'white' })).toBeNull()
    expect(assigned(m, { role: 'civilian' })).toBe(m.triple.wordA)
    expect(assigned(m, { role: 'undercover' })).toBe(m.triple.wordB)
    expect(m.order[0] === fool.id).toBe(foolCanStart)
    expect(new Set(m.order)).toEqual(new Set(people.map((p) => p.id)))
    // Options belong to the match snapshot rather than the mutable setup object.
    settings.foolHasWord = !foolHasWord
    settings.foolCanStart = !foolCanStart
    const restored = matchSchema.parse(JSON.parse(JSON.stringify(m)))
    expect(restored).toEqual(m)
    expect(coherent(restored)).toBe(true)
    const rematch = start(restored.players, restored.settings, pack, [], [m.triple.id], first)
    expect(rematch.settings.foolHasWord).toBe(foolHasWord)
    expect(rematch.settings.foolCanStart).toBe(foolCanStart)
    expect(assigned(rematch, { role: 'fool' })).toBe(foolHasWord ? rematch.triple.foolWord : null)
    let ready = restored
    for (let i = 0; i < people.length; i++) ready = next(ready)
    expect(ready.phase).toBe('ready')
    expect(next(ready).order).toEqual(m.order)
  })

  it('excluded Fool keeps a clue turn, extra-round order and normal later-cycle rotation', () => {
    let m = start(people, { ...defaults, fool: true, foolCanStart: false }, pack, [], [], first)
    const fool = m.players.find((p) => p.role === 'fool')!
    expect(m.order.at(-1)).toBe(fool.id)
    const openingOrder = [...m.order]
    for (let i = 0; i < people.length; i++) m = next(m)
    m = next(m)
    const speakers: string[] = []
    while (m.phase === 'clue') {
      speakers.push(m.order[m.cursor])
      m = next(m)
    }
    expect(speakers).toEqual(openingOrder)
    m = next(m)
    while (m.phase === 'action')
      m = transition(m, m.revision, { type: 'choose', actor: m.order[m.cursor], value: 'extra' }, first)
    m = next(m)
    expect(m.phase).toBe('clue')
    expect(m.order).toEqual(openingOrder)
    // At a later cycle the ordinary rotation may put Fool first.
    m.order = [openingOrder[0], fool.id, ...openingOrder.slice(1, -1)]
    const victim = m.players.find((p) => p.role === 'civilian' && p.id !== openingOrder[0])!.id
    m.players.find((p) => p.id === victim)!.alive = false
    m.deaths = [{ id: victim, cause: 'revengeKill' }]
    m.phase = 'death'
    m = next(m)
    expect(m.phase).toBe('ready')
    expect(m.round).toBe(2)
    expect(m.order[0]).toBe(fool.id)
    expect(coherent(m)).toBe(true)
  })

  it('opener restrictions leave every non-Fool eligible, including Mr. White', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 100; seed++) {
      let state = seed
      const rng = (n: number) => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        return Math.floor(state / 4294967296 * n)
      }
      const m = start(people, { ...defaults, fool: true, white: true, foolCanStart: false }, pack, [], [], rng)
      const opener = m.players.find((p) => p.id === m.order[0])!
      expect(opener.role).not.toBe('fool')
      seen.add(opener.role)
      const index = m.players.indexOf(opener)
      expect(m.order).toEqual([...people.slice(index), ...people.slice(0, index)].map((p) => p.id))
    }
    expect(seen).toEqual(new Set(['civilian', 'undercover', 'white']))
  })

  it('options have no effect without Fool, and old settings/matches retain previous behavior', () => {
    const m = start(people, defaults, pack, [], [], first)
    const withoutFool = start(people, { ...defaults, foolHasWord: false, foolCanStart: false }, pack, [], [], first)
    expect(withoutFool.players).toEqual(m.players)
    expect(withoutFool.order).toEqual(m.order)
    const legacy: Partial<Settings> = { ...defaults, fool: true }
    delete legacy.foolHasWord
    delete legacy.foolCanStart
    expect(settingsSchema.parse(legacy)).toMatchObject({ foolHasWord: true, foolCanStart: true })
    const legacyMatch = start(people, settingsSchema.parse(legacy), pack, [], [], first)
    const restored = matchSchema.parse({ ...legacyMatch, settings: legacy })
    expect(restored.settings).toMatchObject({ foolHasWord: true, foolCanStart: true })
    expect(assigned(restored, { role: 'fool' })).toBe(legacyMatch.triple.foolWord)
    expect(coherent(restored)).toBe(true)
    for (const key of ['foolHasWord', 'foolCanStart'])
      expect(settingsSchema.safeParse({ ...defaults, [key]: 'false' }).success).toBe(false)
  })
})
