import { test, expect, type Page } from '@playwright/test'
import { start } from '../../src/engine/game'
import { defaults, type Match, type Person } from '../../src/engine/model'
import { packSchema } from '../../src/content/words'
import raw from '../../public/words/id.json' with { type: 'json' }

const pack = packSchema.parse(raw)
const people: Person[] = Array.from({ length: 6 }, (_, i) => ({
  id: 'p' + i, name: 'Pemain ' + i, avatar: 'cat',
}))
const key = 'undercover.match.v1'
const button = (p: Page, name: string | RegExp) => p.getByRole('button', { name, exact: typeof name === 'string' })
const snapshot = (p: Page): Promise<Match> => p.evaluate((k) => JSON.parse(sessionStorage.getItem(k)!), key)
async function seed(p: Page, m: Match) {
  await p.goto('./')
  await p.evaluate(([k, data]) => sessionStorage.setItem(k, data), [key, JSON.stringify(m)])
  await p.reload()
  await button(p, 'Lanjutkan permainan').click()
}
const handoff = (p: Page) => button(p, /^Saya .+, siap$/).click()

test('Fool options persist through setup, presets, reload and rematch', async ({ page }) => {
  await page.goto('./')
  await button(page, 'Mulai bermain').click()
  await button(page, 'Lanjut').click()
  await expect(page.getByRole('checkbox', { name: /^Fool mendapat kata/ })).toHaveCount(0)
  await page.getByRole('checkbox', { name: /^Fool Bisa/ }).check()
  const word = page.getByRole('checkbox', { name: /^Fool mendapat kata/ })
  const opener = page.getByRole('checkbox', { name: /^Fool boleh mulai dulu/ })
  await expect(word).toBeChecked()
  await expect(opener).toBeChecked()
  await word.uncheck()
  await expect(opener).toBeChecked()
  await opener.uncheck()
  await page.getByRole('checkbox', { name: /^Fool Bisa/ }).uncheck()
  await page.getByRole('checkbox', { name: /^Fool Bisa/ }).check()
  await expect(word).not.toBeChecked()
  await expect(opener).not.toBeChecked()
  await button(page, /Kacau ringan/).click()
  await expect(word).not.toBeChecked()
  await expect(opener).not.toBeChecked()
  await page.setViewportSize({ width: 320, height: 568 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/fool-options-320.png', fullPage: true })
  await page.reload()
  await button(page, 'Mulai bermain').click()
  await button(page, 'Lanjut').click()
  await expect(word).not.toBeChecked()
  await expect(opener).not.toBeChecked()
  await button(page, 'Bagikan peran').click()
  let m = await snapshot(page)
  expect(m.settings).toMatchObject({ fool: true, foolHasWord: false, foolCanStart: false })
  expect(m.players.find((p) => p.id === m.order[0])!.role).not.toBe('fool')
  m.phase = 'result'
  m.winner = 'civilian'
  await seed(page, m)
  await expect(page.locator('.row').filter({ hasText: 'Fool' })).toContainText('Tanpa kata')
  await button(page, 'Main lagi').click()
  m = await snapshot(page)
  expect(m.settings).toMatchObject({ fool: true, foolHasWord: false, foolCanStart: false })
  expect(m.players.find((p) => p.id === m.order[0])!.role).not.toBe('fool')
})

for (const foolHasWord of [true, false]) {
  test(`Fool word=${foolHasWord} cards/reminders retain role, concealment and pinned settings`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    const m = start(people, { ...defaults, fool: true, foolHasWord }, pack, [], [], () => 0)
    const fool = m.players.find((p) => p.role === 'fool')!
    fool.modifier = 'justice'
    m.cursor = m.players.indexOf(fool)
    await seed(page, m)
    await handoff(page)
    const hold = button(page, 'Tahan untuk melihat')
    await hold.focus()
    await page.keyboard.down('Space')
    await expect(page.locator('.private-role')).toHaveText('Fool')
    await expect(page.locator('[data-private]')).toContainText('Hakim')
    if (foolHasWord) await expect(page.locator('.secret-word')).toHaveText(m.triple.foolWord)
    else {
      await expect(page.locator('.secret-word')).toHaveCount(0)
      await expect(page.locator('[data-private]')).toContainText('Tanpa kata.')
      await expect(page.getByText(m.triple.foolWord, { exact: true })).toHaveCount(0)
    }
    const bounds = await page.locator('.secret-card').evaluate((el) => ({ client: el.clientHeight, scroll: el.scrollHeight }))
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.client + 1)
    await page.screenshot({ path: `test-results/fool-word-${foolHasWord}-320.png` })
    await page.keyboard.up('Space')
    await expect(page.locator('[data-private]')).toHaveCount(0)
    await page.reload()
    await button(page, 'Lanjutkan permainan').click()
    await expect(page.locator('[data-private]')).toHaveCount(0)
    expect((await snapshot(page)).settings.foolHasWord).toBe(foolHasWord)
    m.phase = 'ready'
    m.cursor = 0
    await seed(page, m)
    await button(page, 'Lihat kartu pribadi').click()
    await button(page, fool.name).click()
    await handoff(page)
    await button(page, 'Tahan untuk melihat').focus()
    await page.keyboard.down('Space')
    await expect(page.locator('.private-role')).toHaveText('Fool')
    if (foolHasWord) await expect(page.locator('.secret-word')).toHaveText(m.triple.foolWord)
    else await expect(page.locator('[data-private]')).toContainText('Tanpa kata.')
    await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    await expect(page.locator('[data-private]')).toHaveCount(0)
    await page.keyboard.up('Space')
    expect(await snapshot(page)).toEqual(m)
  })
}
