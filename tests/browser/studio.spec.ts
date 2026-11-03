import { test, expect, type Page } from '@playwright/test'
import { start } from '../../src/engine/game'
import { defaults, type Match, type Person } from '../../src/engine/model'
import { packSchema } from '../../src/content/words'
import raw from '../../public/words/id.json' with { type: 'json' }

const pack = packSchema.parse(raw)
const key = 'undercover.match.v1'
const people: Person[] = ['Adit', 'Bima', 'Citra', 'Dina', 'Eko', 'Fani'].map((name, i) => ({ id: 'p' + i, name, avatar: 'cat' }))
const button = (p: Page, name: string | RegExp) => p.getByRole('button', { name, exact: typeof name === 'string' })
async function seed(p: Page, m: Match) {
  await p.goto('./')
  await p.evaluate(([k, data]) => sessionStorage.setItem(k, data), [key, JSON.stringify(m)])
  await p.reload()
  await button(p, 'Lanjutkan permainan').click()
}

test('action dock stays reachable with 20 players and expanded roles; last content is uncovered', async ({ page }) => {
  await page.goto('./')
  await button(page, 'Mulai bermain').click()
  await button(page, 'Adit').click()
  await button(page, 'Simpan').click()
  await page.evaluate(() => {
    const key = 'undercover.profile.v1', p = JSON.parse(localStorage.getItem(key)!)
    p.roster = Array.from({ length: 20 }, (_, i) => ({ id: 'p' + i, name: 'Pemain ' + (i + 1), avatar: 'cat' }))
    Object.assign(p.settings, { white: true, fool: true, couple: true, justice: true, revenger: true, mime: true })
    localStorage.setItem(key, JSON.stringify(p))
  })
  await page.reload()
  await button(page, 'Mulai bermain').click()
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height })
    await button(page, 'Pemain').click()
    await expect(button(page, 'Lanjut')).toBeInViewport()
    await button(page, 'Pemain 20').scrollIntoViewIfNeeded()
    const last = (await button(page, 'Pemain 20').boundingBox())!
    const dock = (await page.locator('.footer').boundingBox())!
    expect(last.y + last.height).toBeLessThanOrEqual(dock.y)
    await button(page, 'Lanjut').click()
    await expect(button(page, 'Lanjut')).toBeInViewport()
    for (const control of [button(page, 'Tambah Undercover'), button(page, 'Kurangi Undercover'), page.getByRole('combobox', { name: 'Undercover', exact: true })]) {
      const bounds = (await control.boundingBox())!
      expect(bounds.width).toBeGreaterThanOrEqual(44)
      expect(bounds.height).toBeGreaterThanOrEqual(44)
    }
    await expect(page.getByRole('checkbox', { name: /^Fool boleh mulai dulu/ })).toBeAttached()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('player sheet focuses input, preserves drafts across panels, and Escape returns focus to roster', async ({ page }) => {
  await page.goto('./')
  await button(page, 'Mulai bermain').click()
  await button(page, 'Adit').click()
  const dialog = page.getByRole('dialog', { name: 'Ubah pemain' })
  await expect(dialog.getByRole('textbox')).toBeFocused()
  await dialog.getByRole('textbox').fill('Draft')
  await button(page, 'Pengaturan').click()
  await button(page, 'Selesai').click()
  await expect(dialog.getByRole('textbox')).toHaveValue('Draft')
  await expect(dialog.getByRole('textbox')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(button(page, 'Adit')).toBeFocused()
  await button(page, 'Adit').click()
  await expect(dialog.getByRole('textbox')).toHaveValue('Adit')
})

test('normal motion keeps ballot confirmation stable and clears choices for the next actor', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL!, viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  try {
    const m = start(people, defaults, pack, [], [], () => 0)
    m.phase = 'action'
    await seed(page, m)
    const header = await page.locator('header').elementHandle()
    await button(page, /^Saya .+, siap$/).click()
    const confirm = button(page, 'Pilih ini')
    await expect(confirm).toBeDisabled()
    await expect(page.locator('.action-choice[aria-pressed="true"]')).toHaveCount(0)
    const before = (await confirm.boundingBox())!
    await page.locator('.action-choice').first().click()
    await expect(confirm).toBeEnabled()
    const after = (await confirm.boundingBox())!
    expect(Math.abs(before.y - after.y)).toBeLessThan(1)
    await confirm.click()
    await expect(page.locator('.action-choice')).toHaveCount(0)
    expect(await header!.evaluate(el => el.isConnected)).toBe(true)
    await button(page, /^Saya .+, siap$/).click()
    await expect(confirm).toBeDisabled()
    await expect(page.locator('.action-choice[aria-pressed="true"]')).toHaveCount(0)
  } finally { await context.close() }
})

test('event celebration finishes and leaves controls immediately usable', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL!, viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  try {
    const m = start(people, defaults, pack, [], [], () => 0)
    m.phase = 'victory'; m.winner = 'civilian'
    await seed(page, m)
    await expect(button(page, 'Lihat peran dan skor')).toBeEnabled()
    await expect(button(page, 'Lihat peran dan skor')).toBeInViewport()
    await expect.poll(() => page.locator('.event-scene').evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0)
    await button(page, 'Lihat peran dan skor').click()
    await expect(button(page, 'Main lagi')).toBeEnabled()
  } finally { await context.close() }
})
