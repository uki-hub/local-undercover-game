import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { start } from '../../src/engine/game'
import { defaults, type Match, type Person } from '../../src/engine/model'
import { packSchema } from '../../src/content/words'
import raw from '../../public/words/id.json' with { type: 'json' }

const pack = packSchema.parse(raw), key = 'undercover.match.v1'
const button = (p: Page, name: string) => p.getByRole('button', { name, exact: true })
const snapshot = (p: Page): Promise<Match> => p.evaluate(k => JSON.parse(sessionStorage.getItem(k)!), key)
const animals = ['cat', 'pig', 'monkey', 'chicken', 'bear', 'raccoon', 'dog', 'snake', 'owl', 'rat'] as const
function tied(kind: 'action' | 'target', count: number, index: number) {
  const people: Person[] = Array.from({ length: Math.max(6, count) }, (_, i) => ({
    id: 'p' + i, name: ['Adit', 'Bima', 'Citra', 'Dina', 'Eko', 'Fani'][i] ?? 'Pemain ' + (i + 1), avatar: animals[i % 10],
  }))
  const m = start(people, defaults, pack, [], [], () => 0)
  m.phase = 'wheel'; m.ballot = kind
  m.candidates = kind === 'action' ? ['eliminate', 'extra'] : people.slice(0, count).map(p => p.id)
  m.outcome = m.candidates[index]
  return m
}
async function seed(p: Page, m: Match) {
  await p.goto('./')
  await p.evaluate(([key, json]) => sessionStorage.setItem(key, json), [key, JSON.stringify(m)])
  await p.reload()
  await button(p, 'Lanjutkan permainan').click()
}
async function centered(p: Page, id: string) {
  const card = p.locator('.reel-card[data-landed="true"]')
  await expect(card).toHaveCount(1)
  await expect(card).toHaveAttribute('data-entry', id)
  const [a, b] = await Promise.all([card.boundingBox(), p.locator('.reel-pointer').boundingBox()])
  expect(Math.abs(a!.x + a!.width / 2 - (b!.x + b!.width / 2))).toBeLessThan(1.5)
}
async function noSecrets(p: Page, m: Match) {
  await expect(p.locator('[data-private], .secret-word, .reel-track [data-role]')).toHaveCount(0)
  for (const word of [m.triple.wordA, m.triple.wordB, m.triple.foolWord]) await expect(p.getByText(word, { exact: true })).toHaveCount(0)
}
async function seek(p: Page, time: number) {
  await p.locator('.reel-track').evaluate((el, time) => {
    const animation = el.getAnimations()[0]
    animation.pause()
    animation.currentTime = time
  }, time)
  await p.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  return p.locator('.reel-track').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)
}

test('static reel centers every small tie outcome and both ends of a 20-player tie at phone sizes', async ({ page }) => {
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height })
    for (const [kind, count, index] of [
      ['action', 2, 0], ['action', 2, 1], ['target', 3, 0], ['target', 3, 1], ['target', 3, 2], ['target', 20, 0], ['target', 20, 19],
    ] as const) {
      const m = tied(kind, count, index)
      if (count === 20) m.players[19].name = 'W'.repeat(20)
      await seed(page, m)
      await expect(page.locator('.tie-reel')).toHaveAttribute('data-stage', 'revealed')
      await centered(page, m.outcome)
      await noSecrets(page, m)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(button(page, 'Lihat hasil')).toBeInViewport()
      expect(await page.locator('.reel-track').evaluate(el => el.getAnimations().length)).toBe(0)
      expect(await page.locator('.reel-camera').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
      expect((await snapshot(page)).phase).toBe('wheel')
    }
  }
})

test('reel decelerates, red heartbeat and zoom intensify, then committed card lands with an impact', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL!, viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference', serviceWorkers: 'block' })
  const p = await context.newPage(), m = tied('target', 3, 1)
  const errors: string[] = []
  p.on('pageerror', e => errors.push(e.message))
  await seed(p, m)
  await expect(p.locator('.tie-reel')).toHaveAttribute('data-stage', 'racing')
  const earlyA = await seek(p, 500), earlyB = await seek(p, 1500)
  const lateA = await seek(p, 4300)
  await expect(p.locator('.tie-reel')).toHaveAttribute('data-stage', 'tension')
  expect(await p.locator('main').evaluate(el => getComputedStyle(el, '::before').animationDuration)).toBe('1.35s')
  const lateB = await seek(p, 5300)
  expect(Math.abs(lateB - lateA)).toBeLessThan(Math.abs(earlyB - earlyA) / 4)
  await expect(p.locator('.tie-reel')).toHaveAttribute('data-stage', 'critical')
  expect(await p.locator('main').evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('suspense-heartbeat')
  expect(await p.locator('main').evaluate(el => getComputedStyle(el, '::before').animationDuration)).toBe('1.05s')
  expect(await p.locator('.reel-camera').evaluate(el => getComputedStyle(el).animationName)).toBe('reel-heartbeat')
  await noSecrets(p, m)
  await p.evaluate(() => {
    for (const animation of document.getAnimations()) if ('animationName' in animation && ['suspense-heartbeat', 'reel-heartbeat'].includes(String(animation.animationName))) { animation.pause(); animation.currentTime = 350 }
  })
  await p.evaluate(() => document.fonts.ready)
  mkdirSync('docs/evidence', { recursive: true })
  await p.screenshot({ path: 'docs/evidence/tie-reel-intense-390.png' })
  await p.locator('.reel-track').evaluate(el => el.getAnimations()[0].play())
  await expect(p.locator('.tie-reel')).toHaveAttribute('data-stage', 'revealed', { timeout: 3500 })
  await expect(p.locator('.reel-result-name')).toHaveText('Bima')
  await p.locator('.reel-camera').evaluate(el => el.getAnimations().forEach(a => { a.pause(); a.currentTime = 600 }))
  await centered(p, m.outcome)
  await p.locator('.reel-status').evaluate(el => el.getAnimations().forEach(a => { a.pause(); a.currentTime = 450 }))
  await p.locator('.reel-burst i').evaluateAll(elements => elements.forEach(el => el.getAnimations().forEach(a => { a.pause(); a.currentTime = 220 })))
  await p.screenshot({ path: 'docs/evidence/tie-reel-result-390.png' })
  expect((await snapshot(p)).deaths).toEqual([])
  await button(p, 'Lihat hasil').click()
  expect((await snapshot(p)).deaths[0].id).toBe(m.outcome)
  expect(errors).toEqual([])
  await context.close()
})

test('skip, replay, resize and app reduced motion preserve action/player tie outcomes', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL!, viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference', serviceWorkers: 'block' })
  const p = await context.newPage()
  for (const kind of ['action', 'target'] as const) {
    const m = tied(kind, kind === 'action' ? 2 : 4, 1)
    await seed(p, m)
    await seek(p, 5400)
    await button(p, 'Lewati putaran').click()
    await expect(p.locator('.tie-reel')).toHaveAttribute('data-stage', 'revealed')
    await p.locator('.reel-camera').evaluate(el => el.getAnimations().forEach(a => { a.pause(); a.currentTime = 600 }))
    await centered(p, m.outcome)
    expect((await snapshot(p)).revision).toBe(m.revision)
    await p.setViewportSize({ width: 320, height: 568 })
    await p.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
    await centered(p, m.outcome)
    await p.locator('.reel-burst i').evaluateAll(elements => elements.forEach(el => el.getAnimations().forEach(a => { a.pause(); a.currentTime = 800 })))
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await p.reload()
    await button(p, 'Lanjutkan permainan').click()
    expect((await snapshot(p)).outcome).toBe(m.outcome)
    await button(p, 'Pengaturan').click()
    await p.getByRole('checkbox', { name: 'Kurangi gerakan' }).check()
    await button(p, 'Selesai').click()
    await expect(p.locator('.tie-reel')).toHaveAttribute('data-stage', 'revealed')
    await centered(p, m.outcome)
    expect(await p.locator('.reel-camera').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
    await noSecrets(p, m)
    await button(p, 'Lihat hasil').click()
    const after = await snapshot(p)
    expect(kind === 'action' ? after.phase : after.deaths[0].id).toBe(kind === 'action' ? 'actionResult' : m.outcome)
    if (kind === 'action') expect(after.outcome).toBe('extra')
    // Reset the preference so the next case exercises real animation again.
    await p.evaluate(() => { const key = 'undercover.profile.v1', profile = JSON.parse(localStorage.getItem(key)!); profile.reduced = false; localStorage.setItem(key, JSON.stringify(profile)) })
  }
  await context.close()
})
