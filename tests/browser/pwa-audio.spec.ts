import { expect, test as base, type Page } from '@playwright/test'

declare global {
  interface Window {
    soundStats: { loops: number; stops: number; cues: number; duration: number }
  }
}

const button = (p: Page, name: string | RegExp) => p.getByRole('button', { name, exact: true })

// Chrome disables installation in the default incognito test context.
const test = base.extend<{ installPage: Page }>({
  installPage: async ({ playwright, launchOptions, baseURL }, runTest) => {
    const profile = await playwright.chromium.launchPersistentContext('', {
      ...launchOptions, baseURL, reducedMotion: 'reduce',
    })
    try {
      await runTest(await profile.newPage())
    } finally {
      await profile.close()
    }
  },
})

test('production manifest, offline icons and one-use installation prompt', async ({ installPage: page }) => {
  const context = page.context()
  await page.goto('./')
  await expect(page.getByRole('status')).toHaveText('Siap main offline')
  const client = await context.newCDPSession(page)
  const { url, errors, data } = await client.send('Page.getAppManifest')
  expect(errors).toEqual([])
  expect((await client.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([])
  const manifest = JSON.parse(data!)
  for (const path of [manifest.id, manifest.start_url, manifest.scope]) expect(new URL(path, url).href).toBe(page.url())
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
    expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
    expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
  ]))
  await context.setOffline(true)
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
  for (const icon of [...manifest.icons, { src: apple, sizes: '180x180' }]) {
    const dimensions = await page.evaluate(async src => {
      const image = new Image()
      image.src = src
      await image.decode()
      return image.naturalWidth + 'x' + image.naturalHeight
    }, new URL(icon.src, url).href)
    expect(dimensions).toBe(icon.sizes)
  }
  await page.evaluate(() => window.dispatchEvent(Object.assign(
    new Event('beforeinstallprompt', { cancelable: true }),
    { prompt: async () => { document.title = 'Prompt opened' } },
  )))
  await expect(button(page, 'Pasang game')).toBeVisible()
  await button(page, 'Pengaturan').click()
  await button(page, 'Pasang game').click()
  await expect(page).toHaveTitle('Prompt opened')
  await expect(button(page, 'Pasang game')).toHaveCount(0)
  await page.getByText('Cara pasang game', { exact: true }).click()
  await expect(page.getByText(/Tambah ke Layar Utama/)).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))
  await expect(page.getByText('Cara pasang game')).toHaveCount(0)
})

// Observe the real audio nodes while retaining Chromium's decoder, clock and autoplay policy.
function observeAudio() {
  const stats = { loops: 0, stops: 0, cues: 0, duration: 0 }
  window.soundStats = stats
  const source = AudioBufferSourceNode.prototype
  const start = source.start, stop = source.stop, tone = OscillatorNode.prototype.start
  source.start = function (...args) {
    if (this.loop) { stats.loops++; stats.duration = this.buffer!.duration }
    start.apply(this, args)
  }
  source.stop = function (...args) {
    if (this.loop) stats.stops++
    stop.apply(this, args)
  }
  OscillatorNode.prototype.start = function (...args) {
    stats.cues++
    tone.apply(this, args)
  }
}
const stats = (p: Page) => p.evaluate(() => window.soundStats)

test('offline music follows gestures, settings, visibility and spoken turns', async ({ page, context }) => {
  await page.addInitScript(observeAudio)
  await page.goto('./')
  await expect(page.getByRole('status')).toHaveText('Siap main offline')
  expect(await stats(page)).toMatchObject({ loops: 0, cues: 0 })
  await context.setOffline(true)
  await button(page, 'Pengaturan').click()
  await expect.poll(() => stats(page)).toMatchObject({ loops: 1 })
  expect((await stats(page)).duration).toBeCloseTo(20, 1)
  const music = page.getByLabel('Musik latar')
  await music.uncheck()
  await expect.poll(() => stats(page)).toMatchObject({ stops: 1 })
  await music.check()
  await expect.poll(() => stats(page)).toMatchObject({ loops: 2 })
  for (const hidden of [true, false]) {
    await page.evaluate(value => {
      Object.defineProperty(document, 'hidden', { configurable: true, value })
      document.dispatchEvent(new Event('visibilitychange'))
    }, hidden)
    await expect.poll(() => stats(page)).toMatchObject(hidden ? { stops: 2 } : { loops: 3 })
  }
  await page.getByLabel('Bunyi pengingat waktu').check()
  await button(page, 'Selesai').click()
  for (const name of ['Mulai bermain', 'Waktu', 'Bagikan peran']) await button(page, name).click()
  await page.evaluate(() => {
    const key = 'undercover.match.v1'
    const m = JSON.parse(sessionStorage.getItem(key)!)
    m.cursor = m.players.length - 1
    m.settings.clueSeconds = 2
    sessionStorage.setItem(key, JSON.stringify(m))
  })
  await page.reload()
  await button(page, 'Lanjutkan permainan').click()
  await expect.poll(() => stats(page)).toMatchObject({ loops: 1 })
  const before = (await stats(page)).cues
  await button(page, /^Saya .+, siap$/).click()
  await button(page, 'Tahan untuk melihat').press('Space')
  expect((await stats(page)).cues).toBe(before)
  await button(page, 'Selesai, oper ponsel').click()
  expect((await stats(page)).cues).toBe(before + 1)
  await button(page, 'Mulai petunjuk').click()
  await expect.poll(() => stats(page)).toMatchObject({ stops: 1 })
  await expect(page.getByRole('timer')).toContainText('Waktu habis')
  expect((await stats(page)).cues).toBe(before + 2)
})

test('older profiles retain their timer preference and play with unavailable audio', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'AudioContext', { value: undefined }))
  await page.goto('./')
  await button(page, 'Pengaturan').click()
  await page.getByLabel('Bunyi pengingat waktu').check()
  await page.evaluate(() => {
    const key = 'undercover.profile.v1'
    const p = JSON.parse(localStorage.getItem(key)!)
    delete p.music
    delete p.effects
    p.roster[0].name = 'Rani'
    localStorage.setItem(key, JSON.stringify(p))
  })
  await page.reload()
  await button(page, 'Pengaturan').click()
  await expect(page.getByLabel('Bunyi pengingat waktu')).toBeChecked()
  await expect(page.getByLabel('Musik latar')).not.toBeChecked()
  await expect(page.getByLabel('Efek suara')).not.toBeChecked()
  await page.getByLabel('Musik latar').check()
  await page.getByLabel('Efek suara').check()
  await button(page, 'Selesai').click()
  await button(page, 'Mulai bermain').click()
  await expect(button(page, 'Rani')).toBeVisible()
})
