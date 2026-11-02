import { describe, expect, it } from 'vitest'
import { start, transition, choices, victory, awardIds } from '../../src/engine/game'
import {
  actorId,
  assigned,
  defaults,
  matchSchema,
  setupIssue,
  type Match,
  type Person,
  type Role,
} from '../../src/engine/model'
import {
  chooseTriple,
  filtered,
  normalize,
  packSchema,
  tripleSchema,
  type Pack,
} from '../../src/content/words'
import { coherent, score, useGame } from '../../src/store/session'
import dictionary from '../../public/words/id.json'
const pack: Pack = packSchema.parse(dictionary)
const roster: Person[] = Array.from({ length: 10 }, (_, i) => ({
  id: 'p' + i,
  name: 'Orang ' + i,
  avatar: 'cat',
}))
const first = () => 0,
  last = (n: number) => n - 1
function base(n = 6): Match {
  return start(roster.slice(0, n), defaults, pack, [], [], first)
}
const next = (m: Match) => transition(m, m.revision, { type: 'next' }, first)
const vote = (m: Match, value: string) =>
  transition(m, m.revision, { type: 'choose', actor: actorId(m), value }, first)
function ballot(m: Match, kind: 'action' | 'target', values: string[]) {
  m.phase = m.ballot = kind
  m.cursor = 0
  m.votes = {}
  for (const value of values) {
    const prev = m
    m = vote(m, value)
    expect(m).not.toBe(prev)
  }
  return m
}
function stage(roles: Role[]) {
  const m = base(roles.length)
  m.players.forEach((p, i) => {
    p.role = roles[i]
    p.modifier = null
  })
  m.order = m.players.map((p) => p.id)
  return m
}
function eliminate(m: Match, target: string) {
  return ballot(
    m,
    'target',
    m.order.map((id) => (id === target ? m.order.find((o) => o !== id)! : target)),
  )
}
describe('assignment and content', () => {
  it('R01 validates names, counts, balance, modifier allocation and filters', () => {
    expect(setupIssue(roster.slice(0, 2), defaults, 1)).toBe('roster')
    for (const name of [' ', ' ORANG 1 ', 'a'.repeat(21)])
      expect(setupIssue([{ ...roster[0], name }, ...roster.slice(1)], defaults, 1)).toBe('roster')
    expect(setupIssue(roster, { ...defaults, undercover: 0 }, 1)).toBe('settings')
    expect(setupIssue(roster, { ...defaults, undercover: 5 }, 1)).toBe('balance')
    expect(
      setupIssue(
        roster.slice(0, 3),
        { ...defaults, couple: true, justice: true, revenger: true },
        1,
      ),
    ).toBe('modifiers')
    expect(setupIssue(roster, defaults, 0)).toBe('pool')
  })
  it('R02 draws exclusive modifiers and exact words in both mappings', () => {
    for (const rng of [first, last]) {
      const m = start(
        roster,
        {
          ...defaults,
          undercover: 2,
          couple: true,
          revenger: true,
          justice: true,
          fool: true,
          white: true,
        },
        pack,
        [],
        [],
        rng,
      )
      expect(m.players.filter((p) => p.modifier === 'couple' && p.role !== 'fool')).toHaveLength(2)
      expect(m.players.filter((p) => p.modifier)).toHaveLength(4)
      expect(m.players.filter((p) => p.role === 'undercover')).toHaveLength(2)
      for (const p of m.players)
        expect(assigned(m, p)).toBe(
          {
            civilian: m.swapped ? m.triple.wordB : m.triple.wordA,
            undercover: m.swapped ? m.triple.wordA : m.triple.wordB,
            fool: m.triple.foolWord,
            white: null,
          }[p.role],
        )
      expect(matchSchema.parse(m)).toEqual(m)
      expect(coherent(m)).toBe(true)
    }
  })
  it('R15–18 recent IDs, filters, aliases, malformed content and snapshots', () => {
    const pool = pack.sets.slice(0, 3)
    expect(chooseTriple(pool, [pool[0].id, pool[2].id], first).id).toBe(pool[1].id)
    expect(chooseTriple(pool, pool.map((s) => s.id).reverse(), last).id).toBe(pool[2].id)
    expect(filtered(pool, 'invalid', 'all')).toEqual([])
    for (const diff of ['easy', 'medium', 'hard'])
      expect(filtered(pack.sets, 'all', diff).every((s) => s.difficulty === diff)).toBe(true)
    for (const change of [
      { wordA: ' ' },
      { categoryId: 'unknown' },
      { foolWord: pool[0].wordB.toUpperCase() },
      { aliasesB: [' '] },
    ])
      expect(tripleSchema.safeParse({ ...pool[0], ...change }).success).toBe(false)
    expect(packSchema.safeParse({ ...pack, sets: [pool[0], pool[0]] }).success).toBe(false)
    const edited = { ...pack, sets: [{ ...pool[0], wordA: 'uji pertama' }] }
    const m = start(roster, defaults, edited, [], [], first)
    edited.sets[0].wordA = 'uji kedua'
    expect(m.triple.wordA).toBe('uji pertama')
    expect(start(roster, defaults, edited, [], [], first).triple.wordA).toBe('uji kedua')
    expect(normalize(' Ａ  B  ')).toBe('a b')
  })
})
describe('sealed voting', () => {
  it('R03,06 action ties ignore Justice and extra clue forces a target ballot', () => {
    let m = base(4)
    m.players[1].modifier = 'justice'
    m = ballot(m, 'action', ['extra', 'extra', 'eliminate', 'eliminate'])
    expect(m.phase).toBe('wheel')
    expect(m.candidates).toEqual(['eliminate', 'extra'])
    expect(m.votes).toEqual({})
    expect(next(matchSchema.parse(JSON.parse(JSON.stringify(m)))).outcome).toBe(m.outcome)
    m = ballot(base(4), 'action', Array(4).fill('extra'))
    m = next(m)
    expect(m.phase).toBe('clue')
    for (let i = 0; i < 4; i++) m = next(m)
    m = next(m)
    expect(m.phase).toBe('target')
    expect(m.extra).toBe(true)
  })
  it('R04 rejects self, wrong actor, stale revision, wrong phase and dead targets', () => {
    let m = base(6)
    m.phase = m.ballot = 'target'
    m.players[5].alive = false
    m.order = m.order.filter((id) => id !== 'p5')
    expect(vote(m, m.order[0])).toBe(m)
    expect(vote(m, 'p5')).toBe(m)
    expect(transition(m, 0, { type: 'choose', actor: m.order[1], value: m.order[0] })).toBe(m)
    const done = vote(m, m.order[1])
    expect(transition(done, 0, { type: 'choose', actor: m.order[0], value: m.order[1] })).toBe(done)
    m = base()
    expect(vote(m, 'extra')).toBe(m)
  })
  it('R05 live Justice outside a tie decides only among leaders', () => {
    for (const [idx, alive, phase] of [
      [2, true, 'justiceCall'],
      [0, true, 'wheel'],
      [2, false, 'wheel'],
    ] as const) {
      const m = base(6)
      m.players[idx].modifier = 'justice'
      m.players[idx].alive = alive
      // Dead Justice case has four living voters.
      if (!alive) m.players[5].alive = false
      m.order = m.players.filter((p) => p.alive).map((p) => p.id)
      const tied = ballot(
        m,
        'target',
        m.order.map((_, i) => (i % 2 ? 'p0' : 'p1')),
      )
      expect(tied.phase).toBe(phase)
      expect(tied.candidates.sort()).toEqual(['p0', 'p1'])
      if (phase === 'justiceCall') {
        expect(vote(tied, 'p1')).toBe(tied)
        const decision = next(tied)
        expect(vote(decision, 'p3')).toBe(decision)
        expect(vote(decision, 'p1').deaths[0].id).toBe('p1')
      }
    }
  })
})
describe('death queue, victory and scoring', () => {
  it('R07 direct voting ends the game for Fool, cancels revenge and scores only Fool', () => {
    let m = stage(['fool', 'civilian', 'civilian', 'civilian', 'undercover'])
    m.players[0].modifier = 'revenger'
    m = eliminate(m, 'p0')
    expect(m.foolWin).toBe('p0')
    expect(m.queue).toEqual([])
    m = next(m)
    expect(m.phase).toBe('victory')
    expect(m.winner).toBe('fool')
    expect(awardIds(m)).toEqual(['p0'])
    expect(vote(m, 'p1')).toBe(m)
    const profile = useGame.getState().profile
    const scored = score(profile, m)
    expect(score(scored, next(m))).toBe(scored)
    expect(next(m).phase).toBe('result')
    m = stage(['fool', 'civilian', 'civilian', 'civilian', 'undercover'])
    m.players[1].modifier = 'revenger'
    m = vote(next(next(eliminate(m, 'p1'))), 'p0')
    expect(m.foolWin).toBeNull()
    expect(next(m).winner).toBeNull()
  })
  it.each([true, false])('R08–09 White guess before revenge, correct=%s', (correct) => {
    let m = stage(['white', 'civilian', 'civilian', 'undercover', 'civilian', 'civilian'])
    m.players[0].modifier = 'revenger'
    m.swapped = true
    m.triple.aliasesB = ['uji tebak']
    m = next(eliminate(m, 'p0'))
    expect(m.phase).toBe('guess')
    m = vote(m, correct ? '  ＵＪＩ   tebak ' : 'salah')
    expect(m.phase).toBe('guessResult')
    expect(vote(m, 'ulang')).toBe(m)
    m = next(m)
    if (correct) {
      expect(m.phase).toBe('victory')
      expect(m.winner).toBe('white')
      expect(m.queue).toEqual([])
      expect(m.deaths).toHaveLength(1)
      expect(awardIds(m)).toEqual(['p0'])
    } else {
      expect(m.phase).toBe('revengeCall')
      m = next(m)
      expect(choices(m)).not.toContain('p0')
      m = next(vote(m, 'p3'))
      expect(m.winner).toBe('civilian')
    }
  })
  it('R10,11 Revenger kills Couple and drains once to a zero-survivor draw, linked White cannot guess', () => {
    let m = stage(['civilian', 'white', 'undercover'])
    m.players[0].modifier = 'revenger'
    m.players[1].modifier = m.players[2].modifier = 'couple'
    expect(victory(m)).toBeNull()
    m = next(eliminate(m, 'p0'))
    expect(m.phase).toBe('revengeCall')
    m = next(m)
    m = vote(m, 'p2')
    m = next(m)
    expect(m.deaths.map((d) => d.cause)).toEqual(['vote', 'revengeKill', 'partner'])
    m = next(m)
    expect(m.winner).toBe('draw')
  })
  it('R10 final partners win even at parity; coupled members excluded from faction scores', () => {
    const m = stage(['civilian', 'undercover', 'civilian', 'fool'])
    m.players[0].modifier = m.players[1].modifier = 'couple'
    m.players[2].alive = false
    expect(victory(m)).toBeNull()
    m.players[3].alive = false
    m.winner = victory(m)
    expect(m.winner).toBe('couple')
    expect(awardIds(m)).toEqual(['p0', 'p1'])
    m.players[1].alive = false
    m.winner = 'civilian'
    m.foolWin = 'p3'
    expect(awardIds(m)).toEqual(['p2'])
  })
  it('R12 rotates Mime and starter once per cycle without repeating eligible survivors', () => {
    let m = stage([
      'white',
      'civilian',
      'civilian',
      'civilian',
      'civilian',
      'civilian',
      'undercover',
      'civilian',
    ])
    m.settings.mime = true
    m.phase = 'word'
    m.cursor = m.players.length - 1
    m = next(m)
    expect(m.mime).toBe('p1')
    expect(m.phase).toBe('mimeReveal')
    const order = [...m.order]
    m = next(eliminate(m, 'p3'))
    expect(m.mime).toBe('p2')
    expect(m.phase).toBe('mimeReveal')
    expect(m.order[0]).toBe(order[1])
    expect(m.round).toBe(2)
    m.mimeHistory = m.order.slice()
    m = next(eliminate(m, 'p4'))
    expect(m.mime).not.toBe('p2')
    expect(m.mime).not.toBe('p0')
  })
  it('R13,14 neutral parity, draw, idempotent scores including eliminated winners', () => {
    const m = stage(['fool', 'civilian', 'undercover', 'undercover'])
    m.players[2].alive = false
    expect(victory(m)).toBe('impostor')
    m.winner = 'impostor'
    const profile = useGame.getState().profile,
      once = score(profile, m)
    expect(score(once, m)).toBe(once)
    expect(once.scores.p2).toBe(1)
    expect(once.scores.p3).toBe(1)
    m.players.slice(1).forEach((p) => {
      p.alive = false
    })
    expect(victory(m)).toBe('draw')
  })
  it('R15 fresh match resets decisions, keeps identity, avoids last word', () => {
    const m = eliminate(base(), 'p1')
    const newMatch = start(m.players, m.settings, pack, [], [m.triple.id], first)
    expect(newMatch.triple.id).not.toBe(m.triple.id)
    expect(newMatch.id).not.toBe(m.id)
    expect(newMatch.players.map((p) => p.id)).toEqual(m.players.map((p) => p.id))
    expect(newMatch.deaths).toEqual([])
    expect(newMatch.phase).toBe('word')
    expect(newMatch.players.every((p) => p.alive)).toBe(true)
  })
})

describe('persisted event presentation', () => {
  it('announces the committed Mime after word dealing, resumes without reroll and begins clues once', () => {
    let m = start(roster, { ...defaults, mime: true, white: true }, pack, [], [], first)
    for (let i = 0; i < roster.length; i++) m = next(m)
    expect(m.phase).toBe('mimeReveal')
    expect(m.players.find(p => p.id === m.mime)!.role).not.toBe('white')
    expect(coherent(m)).toBe(true)
    const restored = matchSchema.parse(JSON.parse(JSON.stringify(m)))
    const advanced = transition(restored, restored.revision, { type: 'next' }, () => { throw Error('must not reroll') })
    expect(advanced.phase).toBe('clue')
    expect(advanced.cursor).toBe(0)
    expect(advanced.mime).toBe(m.mime)
    expect(advanced.mimeHistory).toEqual(m.mimeHistory)
    expect(transition(advanced, restored.revision, { type: 'next' })).toBe(advanced)
    expect(coherent({ ...m, mime: null })).toBe(false)
    expect(coherent({ ...m, mime: m.players.find(p => p.role === 'white')!.id })).toBe(false)
  })
  it('starts directly with word cards and resumes a combined Couple reveal without reassignment', () => {
    const m = start(roster, { ...defaults, couple: true }, pack, [], [], first)
    expect(m.phase).toBe('word')
    const restored = matchSchema.parse(JSON.parse(JSON.stringify(m)))
    expect(coherent(restored)).toBe(true)
    expect(restored.players).toEqual(m.players)
    let after = restored
    for (let i = 0; i < roster.length; i++) after = next(after)
    expect(after.phase).toBe('ready')
  })
  it('Justice and revenge announcements survive reload, reject early choices and advance once', () => {
    let m = stage(['civilian', 'civilian', 'civilian', 'civilian', 'undercover', 'civilian'])
    m.players[2].modifier = 'justice'
    m = ballot(m, 'target', ['p1', 'p0', 'p1', 'p0', 'p1', 'p0'])
    expect(m.phase).toBe('justiceCall')
    const restored = matchSchema.parse(JSON.parse(JSON.stringify(m)))
    expect(coherent(restored)).toBe(true)
    expect(vote(restored, 'p0')).toBe(restored)
    const decision = next(restored)
    expect(decision.phase).toBe('justice')
    expect(transition(decision, restored.revision, { type: 'next' })).toBe(decision)
    m = stage(['civilian', 'civilian', 'civilian', 'civilian', 'undercover', 'civilian'])
    m.players[0].modifier = 'revenger'
    m = next(eliminate(m, 'p0'))
    expect(m.phase).toBe('revengeCall')
    expect(coherent(matchSchema.parse(JSON.parse(JSON.stringify(m))))).toBe(true)
    expect(next(m).phase).toBe('revenge')
  })
  it('solo victory cancels queued partner deaths and wins before faction evaluation', () => {
    let m = stage(['white', 'undercover', 'civilian', 'civilian', 'civilian', 'civilian'])
    m.players[0].modifier = m.players[1].modifier = 'couple'
    m = next(eliminate(m, 'p0'))
    expect(m.queue).toEqual([{ kind: 'partner', id: 'p1' }])
    m = vote(m, assigned(m, { role: 'civilian' })!)
    expect(m.queue).toEqual([])
    m = next(m)
    expect(m.winner).toBe('white')
    expect(m.players[1].alive).toBe(true)
    expect(coherent(m)).toBe(true)
    expect(coherent(next(m))).toBe(true)
  })
})
