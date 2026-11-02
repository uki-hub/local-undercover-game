import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { start } from '../../src/engine/game'
import { assigned, defaults, type Match, type Person } from '../../src/engine/model'
import { packSchema } from '../../src/content/words'
import raw from '../../public/words/id.json' with { type: 'json' }

const pack = packSchema.parse(raw)
const people: Person[] = ['Adit', 'Bima', 'Citra', 'Dina', 'Eko', 'Fani'].map((name, i) => ({
  id: 'p' + (i + 1), name, avatar: 'cat',
}))
const key = 'undercover.match.v1', local = 'undercover.profile.v1'
const button = (p: Page, name: string | RegExp) => p.getByRole('button', { name, exact: typeof name === 'string' })
const handoff = (p: Page) => button(p, /^Saya .+, siap$/).click()
const snapshot = (p: Page): Promise<Match> => p.evaluate(k => JSON.parse(sessionStorage.getItem(k)!), key)
function fresh() {
  const m = start(people, defaults, pack, [], [], () => 0)
  m.players.forEach(p => { p.role = 'civilian' })
  m.players[5].role = 'undercover'
  m.order = people.map(p => p.id)
  return m
}
async function seed(p: Page, m: Match) {
  await p.goto('./')
  await p.evaluate(([k, data]) => sessionStorage.setItem(k, data), [key, JSON.stringify(m)])
  await p.reload()
  await button(p, 'Lanjutkan permainan').click()
}
async function noSecrets(p: Page, m: Match) {
  await expect(p.locator('[data-private]')).toHaveCount(0)
  for (const word of [m.triple.wordA, m.triple.wordB, m.triple.foolWord])
    await expect(p.getByText(word, { exact: true })).toHaveCount(0)
}

test('setup emblems and combined role/word/partner card remain private', async ({ page }) => {
  await page.goto('./')
  for (const name of ['Mulai bermain', 'Lanjut']) await button(page, name).click()
  for (const role of ['civilian', 'undercover', 'white', 'fool', 'couple', 'revenger', 'justice', 'mime'])
    await expect(page.locator(`[data-role="${role}"]`)).toBeVisible()
  await button(page, 'Bagikan peran').click()
  expect((await snapshot(page)).phase).toBe('word')
  await expect(page.getByRole('heading', { name: 'Oper ke Adit' })).toBeVisible()
  const m = fresh()
  m.players[0].modifier = m.players[1].modifier = 'couple'
  await seed(page, m)
  await noSecrets(page, m)
  await expect(page.locator('[data-role]')).toHaveCount(0)
  await handoff(page)
  await button(page, 'Tahan untuk melihat').focus()
  await page.keyboard.down('Space')
  await expect(page.locator('[data-private] [data-role="civilian"]')).toHaveCount(0)
  await expect(page.locator('[data-private] [data-role="couple"]')).toBeVisible()
  await expect(page.getByText('Pasanganmu adalah Bima.')).toBeVisible()
  await expect(page.locator('.secret-word')).toHaveText(assigned(m, m.players[0])!)
  await page.keyboard.up('Space')
  await noSecrets(page, m)
  await expect(page.locator('[data-role]')).toHaveCount(0)
  await button(page, 'Selesai, oper ponsel').click()
  await expect(page.getByRole('heading', { name: 'Oper ke Bima' })).toBeVisible()
})

test('word cards hide ordinary factions while keeping special roles and abilities visible', async ({ page }) => {
  for (const [role, modifier] of [
    ['civilian', null], ['undercover', null], ['undercover', 'justice'],
    ['civilian', 'revenger'], ['fool', null], ['white', 'couple'],
  ] as const) {
    const m = fresh()
    m.players[0].role = role
    m.players[0].modifier = modifier
    if (modifier === 'couple') m.players[1].modifier = 'couple'
    await seed(page, m)
    await handoff(page)
    await button(page, 'Tahan untuk melihat').focus()
    await page.keyboard.down('Space')
    const card = page.locator('[data-private]')
    await expect(card.locator('[data-role="civilian"], [data-role="undercover"]')).toHaveCount(0)
    await expect(card.locator('.private-role b').filter({ hasText: /^(Warga|Undercover)$/ })).toHaveCount(0)
    if (role === 'fool' || role === 'white') await expect(card.locator(`[data-role="${role}"]`)).toBeVisible()
    if (modifier) await expect(card.locator(`[data-role="${modifier}"]`)).toBeVisible()
    if (role !== 'white') await expect(card.locator('.secret-word')).toHaveText(assigned(m, m.players[0])!)
    await page.keyboard.up('Space')
    await noSecrets(page, m)
  }
})

test('Mime has a named splash after the last word and on reassignment, with safe reload', async ({ page }) => {
  const m = fresh()
  m.settings.mime = true
  m.cursor = m.players.length - 1
  await seed(page, m)
  await handoff(page)
  await button(page, 'Tahan untuk melihat').focus()
  await page.keyboard.down('Space')
  await page.keyboard.up('Space')
  await button(page, 'Selesai, oper ponsel').click()
  const announced = await snapshot(page)
  const mime = announced.players.find(p => p.id === announced.mime)!
  expect(announced.phase).toBe('mimeReveal')
  await expect(page.getByRole('heading', { name: mime.name + ' jadi Pantomim!' })).toBeVisible()
  await expect(page.getByText('Gunakan gerakan saja. Dilarang berbicara atau menulis.')).toBeVisible()
  await noSecrets(page, m)
  await page.reload()
  await button(page, 'Lanjutkan permainan').click()
  expect(await snapshot(page)).toEqual(announced)
  await expect(page.getByRole('heading', { name: mime.name + ' jadi Pantomim!' })).toBeVisible()
  await button(page, 'Mulai petunjuk').click()
  expect((await snapshot(page)).phase).toBe('clue')
  expect((await snapshot(page)).mime).toBe(mime.id)
  const eliminated = fresh()
  eliminated.phase = 'death'
  eliminated.settings.mime = true
  eliminated.mime = mime.id
  eliminated.mimeHistory = [mime.id]
  eliminated.players[0].alive = false
  eliminated.deaths = [{ id: 'p1', cause: 'vote' }]
  await seed(page, eliminated)
  await button(page, 'Lanjut').click()
  const reassigned = await snapshot(page)
  expect(reassigned.phase).toBe('mimeReveal')
  expect(reassigned.round).toBe(2)
  expect(reassigned.mime).not.toBe(mime.id)
  await expect(page.getByText('Pantomim ronde 2')).toBeVisible()
  await expect(page.getByRole('heading', { name: reassigned.players.find(p => p.id === reassigned.mime)!.name + ' jadi Pantomim!' })).toBeVisible()
})

test('partner elimination summary names the player, role and cause', async ({ page }) => {
  const m = fresh()
  m.phase = 'death'
  m.players[0].modifier = m.players[1].modifier = 'couple'
  m.players[0].alive = m.players[1].alive = false
  m.players[1].role = 'undercover'
  m.deaths = [{ id: 'p1', cause: 'vote' }, { id: 'p2', cause: 'partner' }]
  await page.setViewportSize({ width: 320, height: 568 })
  await seed(page, m)
  await expect(page.getByRole('heading', { name: 'Bima tersingkir!' })).toBeVisible()
  await expect(page.getByText('Bima ikut tersingkir karena pasangannya gugur. Perannya: Undercover · Pasangan.')).toBeVisible()
  await expect(page.getByText('Adit · Warga · Hasil voting')).toBeVisible()
  await noSecrets(page, m)
  await button(page, 'Lanjut').scrollIntoViewIfNeeded()
  await expect(button(page, 'Lanjut')).toBeInViewport()
})

test('Fool vote ends play before revenge, keeps golden victory on reload and scores once', async ({ page }) => {
  const m = fresh()
  m.players[0].role = 'fool'
  m.players[0].modifier = 'revenger'
  m.phase = m.ballot = 'target'
  m.cursor = 5
  m.votes = { p1: 'p2', p2: 'p1', p3: 'p1', p4: 'p1', p5: 'p1' }
  await seed(page, m)
  await handoff(page)
  await button(page, 'Adit').click()
  await button(page, 'Konfirmasi pilihan').click()
  await expect(page.getByRole('heading', { name: 'Adit tersingkir!' })).toBeVisible()
  await expect(page.getByText('Adit dieliminasi lewat voting. Perannya: Fool · Pembalas.')).toBeVisible()
  await expect(page.locator('main')).toHaveAttribute('data-theme', 'gold')
  await noSecrets(page, m)
  await button(page, 'Lanjut').click()
  expect((await snapshot(page)).winner).toBe('fool')
  expect((await snapshot(page)).queue).toEqual([])
  for (let i = 0; i < 2; i++) {
    await page.reload()
    await button(page, 'Lanjutkan permainan').click()
    await expect(page.getByRole('heading', { name: 'Fool menang!' })).toBeVisible()
    await noSecrets(page, m)
    expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)!).scores, local)).toEqual({ p1: 1 })
  }
  await button(page, 'Lihat peran dan skor').click()
  await expect(page.getByRole('heading', { name: 'Tiga kata rahasia' })).toBeVisible()
  await button(page, 'Main lagi').click()
  expect((await snapshot(page)).phase).toBe('word')
})

test('Justice summons, revenge summons and target selection have distinct public scenes and resume safely', async ({ page }) => {
  const m = fresh()
  m.phase = 'justiceCall'
  m.ballot = 'target'
  m.actor = 'p2'
  m.candidates = ['p1', 'p3']
  m.players[1].modifier = 'justice'
  m.players[0].modifier = 'revenger'
  await seed(page, m)
  await expect(page.locator('main')).toHaveAttribute('data-theme', 'justice')
  await expect(page.locator('.justice-wings')).toBeVisible()
  await expect(page.locator('.player-card')).toHaveCount(0)
  await noSecrets(page, m)
  await page.reload()
  await button(page, 'Lanjutkan permainan').click()
  await expect(page.getByRole('heading', { name: 'Hakim dipanggil!' })).toBeVisible()
  await button(page, 'Serahkan ke Hakim').click()
  await handoff(page)
  await expect(page.locator('.player-card')).toHaveCount(2)
  await button(page, 'Adit').click()
  await button(page, 'Konfirmasi pilihan').click()
  await expect(page.getByRole('heading', { name: 'Adit tersingkir!' })).toBeVisible()
  await expect(page.getByText('Adit dieliminasi lewat voting. Perannya: Warga · Pembalas.')).toBeVisible()
  await button(page, 'Lanjut').click()
  await expect(page.getByRole('heading', { name: 'Saatnya membalas!' })).toBeVisible()
  await expect(page.locator('main')).toHaveAttribute('data-theme', 'danger')
  await button(page, 'Pilih korban balasan').click()
  await handoff(page)
  await expect(page.locator('main')).toHaveAttribute('data-theme', 'danger')
  await expect(button(page, 'Adit')).toHaveCount(0)
  await button(page, 'Fani').click()
  await button(page, 'Konfirmasi pilihan').click()
  await expect(page.getByRole('heading', { name: 'Fani tersingkir!' })).toBeVisible()
  await expect(page.getByText('Fani menjadi korban balasan Pembalas. Perannya: Undercover.')).toBeVisible()
  await noSecrets(page, m)
  await button(page, 'Lanjut').click()
  await expect(page.getByRole('heading', { name: 'Warga menang!' })).toBeVisible()
})

test('event gallery fits short phones, includes every victory, and reduced motion removes effects', async ({ page }) => {
  const scenes: { label: string; match: Match }[] = []
  for (const winner of ['civilian', 'impostor', 'fool', 'white', 'couple', 'draw'] as const) {
    const m = fresh()
    m.phase = 'victory'; m.winner = winner
    if (winner === 'fool') { m.foolWin = 'p1'; m.players[0].role = 'fool' }
    if (winner === 'white') { m.whiteWin = 'p1'; m.players[0].role = 'white' }
    scenes.push({ label: 'win-' + winner, match: m })
  }
  for (const phase of ['justiceCall', 'revengeCall', 'actionResult', 'guessResult', 'ready', 'mimeReveal'] as const) {
    const m = fresh()
    m.phase = phase; m.actor = 'p2'
    if (phase === 'justiceCall') { m.ballot = 'target'; m.candidates = ['p1', 'p3']; m.players[1].modifier = 'justice' }
    if (phase === 'revengeCall') { m.players[1].modifier = 'revenger'; m.players[1].alive = false }
    if (phase === 'actionResult') m.outcome = 'extra'
    if (phase === 'ready' || phase === 'mimeReveal') { m.settings.mime = true; m.mime = 'p1' }
    scenes.push({ label: phase, match: m })
  }
  const death = fresh()
  death.phase = 'death'; death.players[0].alive = false
  death.deaths = [{ id: 'p1', cause: 'vote' }]
  scenes.push({ label: 'villager-eliminated', match: death })
  const voting = fresh()
  voting.phase = 'actionResult'; voting.outcome = 'eliminate'
  scenes.push({ label: 'decision-vote', match: voting })
  const frames: { label: string; src: string }[] = []
  for (const [width, height] of [[320, 568], [390, 844]]) {
    await page.setViewportSize({ width, height })
    for (const { label, match } of scenes) {
      await seed(page, match)
      await noSecrets(page, match)
      await expect(page.locator('.event-scene')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(page.locator('.event-scene .primary')).toBeInViewport()
      await expect(page.locator('.scene-effects')).toBeHidden()
      expect(await page.locator('.event-symbol').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
      await page.evaluate(() => document.fonts.ready)
      if (width === 390) frames.push({ label, src: 'data:image/png;base64,' + (await page.screenshot({ animations: 'disabled' })).toString('base64') })
    }
  }
  const data = await page.evaluate(async frames => {
    const canvas = document.createElement('canvas'), w = 195, h = 422, cols = 4
    canvas.width = cols * w; canvas.height = Math.ceil(frames.length / cols) * (h + 24)
    const c = canvas.getContext('2d')!
    c.fillStyle = '#25263b'; c.fillRect(0, 0, canvas.width, canvas.height)
    for (const [i, frame] of frames.entries()) {
      const img = new Image(); img.src = frame.src; await img.decode()
      const x = i % cols * w, y = Math.floor(i / cols) * (h + 24)
      c.drawImage(img, x, y, w, h); c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif'
      c.fillText(frame.label, x + 8, y + h + 16)
    }
    return canvas.toDataURL('image/webp', .88).split(',')[1]
  }, frames)
  mkdirSync('docs/evidence', { recursive: true })
  writeFileSync('docs/evidence/events-gallery.webp', Buffer.from(data, 'base64'))
})

test('normal motion animates wings and emblems; app motion setting freezes both', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL!, viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference', serviceWorkers: 'block' })
  const page = await context.newPage()
  const m = fresh()
  m.phase = 'justiceCall'; m.ballot = 'target'; m.actor = 'p2'; m.candidates = ['p1', 'p3']; m.players[1].modifier = 'justice'
  await seed(page, m)
  await expect(page.locator('.scene-effects')).toBeVisible()
  expect(await page.locator('.wing-left').evaluate(el => getComputedStyle(el).animationName)).toBe('wing-left')
  await page.locator('.event-symbol').evaluate(el => el.getAnimations().forEach(a => { a.pause(); a.currentTime = 900 }))
  const before = await page.locator('.event-symbol').evaluate(el => getComputedStyle(el).transform)
  await page.locator('.event-symbol').evaluate(el => el.getAnimations().forEach(a => { a.currentTime = 1600 }))
  expect(await page.locator('.event-symbol').evaluate(el => getComputedStyle(el).transform)).not.toBe(before)
  await page.evaluate(() => document.fonts.ready)
  mkdirSync('docs/evidence', { recursive: true })
  await page.screenshot({ path: 'docs/evidence/justice-motion.png' })
  await button(page, 'Pengaturan').click()
  await page.getByRole('checkbox', { name: 'Kurangi gerakan' }).check()
  await button(page, 'Selesai').click()
  await expect(page.locator('.scene-effects')).toBeHidden()
  expect(await page.locator('.wing-left').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  await context.close()
})
