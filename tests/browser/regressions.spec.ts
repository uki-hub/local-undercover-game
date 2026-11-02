import { test, expect, type Page } from '@playwright/test'
import { start } from '../../src/engine/game'
import { assigned, defaults, type Match, type Person } from '../../src/engine/model'
import { packSchema } from '../../src/content/words'
import raw from '../../public/words/id.json' with { type: 'json' }

const pack = packSchema.parse(raw)
const people: Person[] = ['Adit', 'Bima', 'Citra', 'Dina', 'Eko', 'Fani'].map((name, i) => ({ id: 'p' + (i + 1), name, avatar: 'cat' }))
const key = 'undercover.match.v1', local = 'undercover.profile.v1'
const button = (p: Page, name: string | RegExp) => p.getByRole('button', { name, exact: typeof name === 'string' })
const snapshot = (p: Page): Promise<Match> => p.evaluate((k) => JSON.parse(sessionStorage.getItem(k)!), key)
const fresh = () => start(people, defaults, pack, [], [], () => 0)
async function seed(p: Page, m: Match) {
  await p.goto('./')
  await p.evaluate(([key, data]) => sessionStorage.setItem(key, data), [key, JSON.stringify(m)])
  await p.reload()
  await button(p, 'Lanjutkan permainan').click()
}
const handoff = (p: Page) => button(p, /^Saya .+, siap$/).click()

test('player and custom drafts survive settings, rules, Back and Escape; explicit cancel discards', async ({ page }) => {
  await page.goto('./')
  await button(page, 'Mulai bermain').click()
  await button(page, 'Adit').click()
  await page.getByRole('textbox').fill('Nama baru')
  await button(page, 'Ayam').click()
  await button(page, 'Pengaturan').click()
  await button(page, 'Cara bermain').click()
  await page.keyboard.press('Escape')
  await button(page, 'Selesai').click()
  await expect(page.getByRole('textbox')).toHaveValue('Nama baru')
  await expect(button(page, 'Ayam')).toHaveAttribute('aria-pressed', 'true')
  await button(page, 'Simpan').click()
  await expect(button(page, 'Nama baru')).toBeVisible()
  await button(page, 'Beranda').click()
  await expect(button(page, 'Mulai bermain')).toBeVisible()
  await button(page, 'Pengaturan').click()
  await button(page, 'Paket kata pribadi').click()
  await button(page, 'Buat set kata').click()
  await page.getByLabel('Kata A', { exact: true }).fill('Draft kata')
  await page.getByLabel('Jawaban lain A (pisahkan dengan koma)', { exact: true }).fill('Draft alias')
  await page.getByRole('combobox', { name: 'Kategori' }).selectOption('home')
  await page.keyboard.press('Escape')
  await button(page, 'Cara bermain').click()
  await button(page, 'Kembali').first().click()
  await button(page, 'Paket kata pribadi').click()
  await expect(page.getByLabel('Kata A', { exact: true })).toHaveValue('Draft kata')
  await expect(page.getByLabel('Jawaban lain A (pisahkan dengan koma)', { exact: true })).toHaveValue('Draft alias')
  await expect(page.getByRole('combobox', { name: 'Kategori' })).toHaveValue('home')
  await button(page, 'Batal').click()
  await expect(page.getByText('Belum ada set kata pribadi.')).toBeVisible()
})

test('held White abilities and long words fit small phones without moving touch controls', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page)
  for (const [width, height] of [[320, 568], [360, 640], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height })
    for (const kind of ['white-justice', 'white-couple', 'long-justice', 'intro-couple']) {
      const m = fresh()
      m.players[0].name = 'M'.repeat(20)
      m.phase = kind === 'intro-couple' ? 'intro' : 'word'
      m.players[0].role = kind.startsWith('white') ? 'white' : 'civilian'
      m.players[0].modifier = kind.endsWith('couple') ? 'couple' : 'justice'
      if (kind.endsWith('couple')) m.players[1].modifier = 'couple'
      m.players[1].name = 'W'.repeat(20)
      if (kind === 'long-justice') { m.triple.wordA = 'W'.repeat(80); m.triple.wordB = 'B'.repeat(80) }
      await seed(page, m)
      await handoff(page)
      const control = button(page, 'Tahan untuk melihat')
      const before = (await control.boundingBox())!
      expect(before.y + before.height).toBeLessThanOrEqual(height)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: before.x + before.width / 2, y: before.y + before.height / 2 }] })
      await expect(page.locator('[data-private]')).toBeVisible()
      const after = (await control.boundingBox())!
      expect(Math.abs(after.y - before.y)).toBeLessThan(1)
      const info = (await page.locator('[data-private]').boundingBox())!
      expect(info.y).toBeGreaterThanOrEqual(0)
      expect(info.y + info.height).toBeLessThanOrEqual(height)
      const card = await page.locator('.secret-card').evaluate((el) => ({ client: el.clientHeight, scroll: el.scrollHeight }))
      expect(card.scroll, `${width}×${height} ${kind}`).toBeLessThanOrEqual(card.client + 1)
      if (width === 320 && kind === 'white-justice') await page.screenshot({ path: 'test-results/reveal-320-white.png' })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await expect(page.locator('[data-private]')).toHaveCount(0)
    }
  }
})

test('custom-only pool blocks empty setup, deals only custom content and survives rematch', async ({ page }) => {
  await page.goto('./')
  await button(page, 'Mulai bermain').click()
  await button(page, 'Lanjut').click()
  await button(page, 'Kata').click()
  await page.getByRole('combobox', { name: 'Sumber kata' }).selectOption('custom')
  await page.getByRole('button', { name: 'Waktu', exact: true }).click()
  await expect(button(page, 'Bagikan peran')).toBeDisabled()
  await expect(page.getByRole('alert')).toContainText('Tidak ada set kata')
  await button(page, 'Pengaturan').click()
  await button(page, 'Paket kata pribadi').click()
  await button(page, 'Buat set kata').click()
  for (const [label, value] of [['Kata A', 'Uji satu'], ['Kata B', 'Uji dua'], ['Kata Fool', 'Uji tiga']])
    await page.getByLabel(label, { exact: true }).fill(value)
  await button(page, 'Simpan').click()
  await button(page, 'Kembali').first().click()
  await button(page, 'Selesai').click()
  await page.getByRole('button', { name: 'Waktu', exact: true }).click()
  await expect(button(page, 'Bagikan peran')).toBeEnabled()
  await page.getByRole('button', { name: 'Waktu', exact: true }).click()
  await button(page, 'Bagikan peran').click()
  let m = await snapshot(page)
  expect(m.triple.id).toMatch(/^custom-/)
  expect(m.settings.wordSource).toBe('custom')
  m.phase = 'result'; m.winner = 'civilian'
  await seed(page, m)
  await button(page, 'Main lagi').click()
  m = await snapshot(page)
  expect(m.triple.wordA).toBe('Uji satu')
  expect(m.settings.wordSource).toBe('custom')
})

test('read-denied and quota-limited storage warn while in-memory gameplay works', async ({ browser }) => {
  for (const mode of ['read', 'write']) {
    const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' })
    await context.addInitScript((mode) => {
      if (mode === 'read') {
        for (const key of ['localStorage', 'sessionStorage'])
          Object.defineProperty(window, key, { get() { throw new Error('denied') } })
      } else Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError') }
    }, mode)
    const page = await context.newPage()
    await page.goto(test.info().project.use.baseURL!)
    await button(page, 'Mulai bermain').click()
    await button(page, 'Lanjut').click()
    await page.getByRole('combobox', { name: 'Undercover', exact: true }).selectOption('1')
    await expect(page.getByText(/Perubahan belum tersimpan/)).toBeVisible()
    await page.getByRole('button', { name: 'Waktu', exact: true }).click()
    await button(page, 'Bagikan peran').click()
    await handoff(page)
    await button(page, 'Tahan untuk melihat').focus()
    await page.keyboard.down('Space')
    await expect(page.locator('[data-private]')).toBeVisible()
    await page.keyboard.up('Space')
    await context.close()
  }
})

test('score reset confirms, is unavailable mid-match and never re-awards on reload', async ({ page }) => {
  const m = fresh()
  await seed(page, m)
  await button(page, 'Pengaturan').click()
  await expect(button(page, 'Nolkan skor sesi')).toHaveCount(0)
  m.phase = 'result'; m.winner = 'civilian'
  await seed(page, m)
  await button(page, 'Pengaturan').click()
  page.once('dialog', (d) => d.dismiss())
  await button(page, 'Nolkan skor sesi').click()
  expect(Object.keys(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).scores, local)).length).toBe(5)
  page.once('dialog', (d) => d.accept())
  await button(page, 'Nolkan skor sesi').click()
  await page.reload()
  await button(page, 'Lanjutkan permainan').click()
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).scores, local)).toEqual({})
  await expect(page.locator('.point-gain')).toHaveCount(0)
  await button(page, 'Main lagi').click()
  expect((await snapshot(page)).players.map((p) => p.name)).toEqual(people.map((p) => p.name))
})

test('private reminder uses the chosen owner, conceals on interruption and preserves match progress', async ({ page }) => {
  await page.clock.install()
  const m = fresh()
  m.phase = 'clue'
  m.cursor = 2
  m.settings.clueSeconds = 15
  await seed(page, m)
  await page.clock.runFor(4000)
  await expect(page.getByRole('timer')).toHaveText('11 detik')
  await button(page, 'Lihat kartu pribadi').click()
  const owner = m.players.find((p) => p.role === 'undercover')!
  await button(page, owner.name).click()
  await expect(page.getByRole('heading', { name: 'Oper ke ' + owner.name })).toBeVisible()
  await expect(page.locator('[data-private]')).toHaveCount(0)
  await handoff(page)
  await button(page, 'Tahan untuk melihat').focus()
  await page.keyboard.down('Space')
  await expect(page.locator('.secret-word')).toHaveText(assigned(m, owner)!)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect(page.locator('[data-private]')).toHaveCount(0)
  await page.keyboard.up('Space')
  await expect(page.getByRole('heading', { name: 'Oper ke ' + owner.name })).toBeVisible()
  await handoff(page)
  await page.clock.runFor(20_000)
  await button(page, 'Kembali ke permainan').click()
  await expect(page.getByRole('timer')).toHaveText('11 detik')
  await page.clock.runFor(1000)
  await expect(page.getByRole('timer')).toHaveText('10 detik')
  expect(await snapshot(page)).toEqual(m)
  await expect(page.getByRole('heading', { name: m.order[m.cursor] === 'p3' ? 'Citra' : m.players.find((p) => p.id === m.order[m.cursor])!.name })).toBeVisible()
  await page.reload()
  await button(page, 'Lanjutkan permainan').click()
  await expect(page.locator('[data-private]')).toHaveCount(0)
  expect(await snapshot(page)).toEqual(m)
})

test('survivor names distinguish repeated avatars and guide returns to setup', async ({ page }) => {
  await page.goto('./')
  await button(page, 'Panduan singkat').click()
  await expect(page.getByText('Langkah 1 dari 4')).toBeVisible()
  await button(page, 'Lanjut').click()
  await button(page, 'Kembali').last().click()
  await expect(page.getByText('Langkah 1 dari 4')).toBeVisible()
  for (let i = 0; i < 3; i++) await button(page, 'Lanjut').click()
  await button(page, 'Mulai bermain').click()
  await expect(page.getByRole('heading', { name: 'Siap bermain?' })).toBeVisible()
  const m = fresh(); m.phase = 'ready'
  await seed(page, m)
  const strip = page.getByRole('list', { name: 'Pemain yang bertahan' })
  for (const name of people.map((p) => p.name)) await expect(strip.getByText(name, { exact: true })).toBeVisible()
})
