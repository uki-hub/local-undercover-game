import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { assigned, defaults, type Match, type Person } from '../../src/engine/model'
import { start } from '../../src/engine/game'
import { packSchema } from '../../src/content/words'
import raw from '../../public/words/id.json' with { type: 'json' }
const pack = packSchema.parse(raw)
const roster: Person[] = ['Adit', 'Bima', 'Citra', 'Dina', 'Eko', 'Fani'].map((name, i) => ({
  id: 'p' + (i + 1),
  name,
  avatar: (['cat', 'pig', 'monkey', 'chicken', 'bear', 'raccoon'] as const)[i],
}))
const key = 'undercover.match.v1',
  local = 'undercover.profile.v1'
const button = (p: Page, name: string | RegExp) =>
  p.getByRole('button', { name, exact: typeof name === 'string' })
const snapshot = (p: Page): Promise<Match> =>
  p.evaluate((k) => JSON.parse(sessionStorage.getItem(k)!), key)
async function painted(p: Page) {
  await p.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(Array.from(document.images, (img) => img.decode()))
    await new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())))
  })
}
const shot = async (p: Page, name: string) => {
  mkdirSync('docs/evidence', { recursive: true })
  await painted(p)
  await p.screenshot({ path: 'docs/evidence/' + name + '.png', animations: 'disabled', fullPage: name === 'results-390' })
}
async function handoff(p: Page) {
  await button(p, /^Saya .+, siap$/).click()
}
async function hold(p: Page) {
  const b = button(p, 'Tahan untuk melihat')
  await b.focus()
  await p.keyboard.down('Space')
  await expect(p.locator('[data-private]')).toBeVisible()
}
async function resume(p: Page) {
  await p.reload()
  await button(p, 'Lanjutkan permainan').click()
}
async function seed(p: Page, m: Match) {
  await p.goto('./')
  await p.evaluate(([k, data]) => sessionStorage.setItem(k, data), [key, JSON.stringify(m)])
  await resume(p)
}
const fresh = () => start(roster, defaults, pack, [], [], () => 0)

test('classic match, sealed interruptions, cold offline reopen, rematch and Pages assets', async ({
  page,
  context,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('./')
  await expect(page.getByRole('status')).toHaveText('Siap main offline')
  await page.reload()
  const base = new URL('./', page.url()).href
  expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)).toBe(base)
  for (const path of [
    'manifest.webmanifest',
    'assets/fonts/nunito.woff2',
    'words/id.json',
    ...['cat', 'pig', 'monkey', 'chicken', 'bear', 'raccoon', 'dog', 'snake', 'owl', 'rat'].map(
      (x) => 'assets/avatars/' + x + '.webp',
    ),
  ]) {
    expect(await page.evaluate(async (u) => (await fetch(u)).ok, base + path)).toBeTruthy()
  }
  await button(page, 'Mulai bermain').click()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('heading', { name: 'Siap bermain?' })).toBeVisible()
  await shot(page, 'setup-390')
  await button(page, 'Lanjut').click()
  await page.getByRole('button', { name: 'Waktu', exact: true }).click()
  await button(page, 'Bagikan peran').click()
  await context.setOffline(true)
  await resume(page)
  let m = await snapshot(page)
  const triple = m.triple
  expect(m.phase).toBe('word')
  for (const phase of ['word']) {
    for (let i = 0; i < 6; i++) {
      await handoff(page)
      await expect(page.locator('[data-private]')).toHaveCount(0)
      await hold(page)
      if (phase === 'word' && i === 0) {
        const secret = assigned(m, m.players[0])!
        await expect(page.locator('.secret-word')).toHaveText(secret)
        await shot(page, 'reveal-390')
        await page.keyboard.up('Space')
        await expect(page.getByText(secret, { exact: true })).toHaveCount(0)
        const box = (await button(page, 'Tahan untuk melihat').boundingBox())!
        await page.mouse.move(box.x + 8, box.y + 8)
        await page.mouse.down()
        await expect(page.locator('[data-private]')).toBeVisible()
        await page.dispatchEvent('.hold', 'pointercancel')
        await expect(page.locator('[data-private]')).toHaveCount(0)
        await page.mouse.up()
        await hold(page)
        await page.evaluate(() => window.dispatchEvent(new Event('blur')))
        await expect(page.getByRole('heading', { name: /Oper ke/ })).toBeVisible()
        await page.keyboard.up('Space')
        await handoff(page)
        await hold(page)
        await resume(page)
        await page.keyboard.up('Space')
        await expect(page.locator('[data-private]')).toHaveCount(0)
        await handoff(page)
        await hold(page)
      }
      await page.keyboard.up('Space')
      await expect(page.locator('[data-private]')).toHaveCount(0)
      await button(page, 'Selesai, oper ponsel').click()
    }
  }
  await button(page, 'Mulai petunjuk').click()
  for (let i = 0; i < 6; i++) await button(page, 'Lanjut').click()
  await button(page, 'Pilih langkah berikutnya').click()
  for (let i = 0; i < 6; i++) {
    await handoff(page)
    await expect(button(page, 'Pilih ini')).toBeDisabled()
    if (i === 0) {
      await shot(page, 'action-390')
      await button(page, /^Petunjuk lagi/).click()
      await resume(page)
      await handoff(page)
      await expect(button(page, 'Pilih ini')).toBeDisabled()
    }
    await button(page, /^Voting Pilih/).click()
    await button(page, 'Pilih ini').click()
  }
  await button(page, 'Lanjut').click()
  m = await snapshot(page)
  const spy = m.players.find((p) => p.role === 'undercover')!
  for (const id of m.order) {
    await handoff(page)
    const voter = m.players.find((p) => p.id === id)!
    await expect(button(page, voter.name)).toHaveCount(0)
    await button(page, spy.id === id ? m.players.find((p) => p.id !== id)!.name : spy.name).click()
    await button(page, 'Pilih ini').click()
  }
  await expect(page.getByRole('heading', { name: spy.name + ' tersingkir!' })).toBeVisible()
  await shot(page, 'elimination-390')
  await button(page, 'Lanjut').click()
  await expect(page.getByRole('heading', { name: 'Warga menang!' })).toBeVisible()
  await button(page, 'Lihat peran dan skor').click()
  await shot(page, 'results-390')
  const profile = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), local)
  expect(Object.values(profile.scores)).toEqual(Array(5).fill(1))
  await resume(page)
  expect((await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), local)).scores).toEqual(
    profile.scores,
  )
  await button(page, 'Main lagi').click()
  const rematch = await snapshot(page)
  expect(rematch.triple.id).not.toBe(triple.id)
  expect(rematch.players.map((p) => p.name)).toEqual(m.players.map((p) => p.name))
  expect(rematch.phase).toBe('word')
  expect(errors).toEqual([])
  // A new tab has no session snapshot and can still start from the precached shell.
  const cold = await context.newPage()
  await cold.goto(base)
  await button(cold, 'Mulai bermain').click()
  await button(cold, 'Lanjut').click()
  await cold.getByRole('button', { name: 'Waktu', exact: true }).click()
  await expect(button(cold, 'Bagikan peran')).toBeEnabled()
  await cold.close()
})

test('refresh private choices and wheel preserves sealed outcomes', async ({ page }) => {
  for (const phase of ['justice', 'revenge', 'guess', 'target', 'action'] as const) {
    const m = fresh()
    m.phase = phase
    m.actor = m.players[1].id
    if (phase === 'revenge' || phase === 'guess') m.players[1].alive = false
    if (phase === 'justice') {
      m.ballot = 'target'
      m.candidates = ['p1', 'p3']
      m.players[1].modifier = 'justice'
    }
    if (phase === 'target') m.ballot = 'target'
    await seed(page, m)
    await handoff(page)
    if (phase === 'guess') await page.getByRole('textbox').fill('uji pribadi')
    else
      await page
        .locator(phase === 'action' ? '.action-choice' : '.player-card')
        .first()
        .click()
    await resume(page)
    await expect(page.getByRole('heading', { name: /Oper ke/ })).toBeVisible()
    expect((await snapshot(page)).revision).toBe(m.revision)
    await handoff(page)
    if (phase === 'guess') await expect(page.getByRole('textbox')).toHaveValue('')
    else {
      await expect(button(page, 'Pilih ini')).toBeDisabled()
      await expect(page.locator('.player-card[aria-pressed="true"], .action-choice[aria-pressed="true"]')).toHaveCount(0)
    }
  }
  const m = fresh()
  m.phase = 'wheel'
  m.ballot = 'target'
  m.candidates = ['p2', 'p3', 'p4']
  m.outcome = 'p3'
  await seed(page, m)
  await resume(page)
  await button(page, /Lewati putaran|Lihat hasil/).click()
  expect((await snapshot(page)).deaths[0].id).toBe('p3')
})
test('small screens, long roster and custom word CRUD', async ({ page }) => {
  await page.goto('./')
  await button(page, 'Pengaturan').click()
  await button(page, 'Paket kata pribadi').click()
  await button(page, 'Buat set kata').click()
  for (const [l, w] of [
    ['Kata A', 'Uji satu'],
    ['Kata B', 'Uji dua'],
    ['Kata Fool', 'Uji tiga'],
  ])
    await page.getByLabel(l, { exact: true }).fill(w)
  await button(page, 'Simpan').click()
  await expect(page.getByText(/Uji satu · Uji dua/)).toBeVisible()
  await button(page, 'Ubah').click()
  await page.getByLabel('Kata A', { exact: true }).fill('Uji baru')
  await button(page, 'Simpan').click()
  page.once('dialog', (d) => d.accept())
  await button(page, 'Hapus').click()
  await expect(page.getByText('Belum ada set kata pribadi.')).toBeVisible()
  await page.evaluate((k) => {
    const p = JSON.parse(localStorage.getItem(k)!)
    p.roster = Array.from({ length: 20 }, (_, i) => ({
      id: 'r' + i,
      name: 'Nama sangat panjang' + String.fromCharCode(65 + i),
      avatar: 'cat',
    }))
    p.uiLocale = 'unsupported'
    localStorage.setItem(k, JSON.stringify(p))
  }, local)
  await page.reload()
  await button(page, 'Mulai bermain').click()
  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    await expect(page.locator('.player-card')).toHaveCount(20)
    await button(page, 'Lanjut').scrollIntoViewIfNeeded()
    await expect(button(page, 'Lanjut')).toBeInViewport()
  }
  await page.locator('.player-card').last().click()
  await expect(page.locator('.animal-picker button')).toHaveCount(10)
  await page.getByRole('textbox').fill('Nama baru')
  await button(page, 'Simpan').click()
  await expect(button(page, 'Nama baru')).toBeVisible()
})
test('word load error, retry, corrupt save and denied storage', async ({ browser }) => {
  const ctx = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.route('**/words/id.json', (r) =>
    r.fulfill({ body: '{"sets":[]}', contentType: 'application/json' }),
  )
  await p.goto(test.info().project.use.baseURL!)
  await p.evaluate(() => {
    sessionStorage.setItem('undercover.match.v1', '{')
    localStorage.setItem('undercover.profile.v1', '{}')
  })
  await p.reload()
  await button(p, 'Mulai bermain').click()
  await button(p, 'Lanjut').click()
  await p.getByRole('button', { name: 'Waktu', exact: true }).click()
  await expect(button(p, 'Bagikan peran')).toBeDisabled()
  await expect(p.getByRole('status')).toContainText('Kata gagal dimuat')
  await p.unroute('**/words/id.json')
  await button(p, 'Coba lagi').click()
  await p.getByRole('button', { name: 'Waktu', exact: true }).click()
  await expect(button(p, 'Bagikan peran')).toBeEnabled()
  const previous = fresh()
  previous.phase = 'result'
  previous.winner = 'civilian'
  previous.settings.category = previous.triple.categoryId = 'retired'
  await p.evaluate(([k,data]) => sessionStorage.setItem(k,data), [key,JSON.stringify(previous)])
  await resume(p)
  await expect(p.getByRole('status')).toContainText('Tidak ada set kata yang cocok. Coba ubah pilihan kata.')
  await expect(button(p, 'Main lagi')).toBeDisabled()
  await expect(p.getByText(previous.triple.wordA, {exact:true})).toBeVisible()
  await ctx.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw Error('denied')
      },
    })
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw Error('denied')
      },
    })
  })
  await p.reload()
  await button(p, 'Mulai bermain').click()
  await button(p, 'Lanjut').click()
  await p.getByRole('button', { name: 'Waktu', exact: true }).click()
  await button(p, 'Bagikan peran').click()
  await handoff(p)
  await hold(p)
  await p.keyboard.up('Space')
  await ctx.close()
})
test('visibility clears held card, hidden timers pause and never auto-advance', async ({
  page,
}) => {
  const m = fresh()
  m.phase = 'word'
  await seed(page, m)
  await handoff(page)
  await hold(page)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('[data-private]')).toHaveCount(0)
  await page.keyboard.up('Space')
  m.phase = 'clue'
  m.settings.clueSeconds = 2
  await seed(page, m)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(2200)
  await expect(page.getByRole('timer')).toHaveText('2 detik')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.getByRole('timer')).toContainText('Waktu habis')
  expect((await snapshot(page)).phase).toBe('clue')
})

test('classic impostor victory through repeated cycles and the one extra clue round', async ({
  page,
}) => {
  await page.goto('./')
  for (const name of ['Mulai bermain', 'Lanjut', 'Lanjut', 'Lanjut', 'Bagikan peran']) await button(page, name).click()
  for (let i = 0; i < 6; i++) {
    await handoff(page)
    await hold(page)
    await page.keyboard.up('Space')
    await button(page, 'Selesai, oper ponsel').click()
  }
  for (let round = 1; round <= 4; round++) {
    let m = await snapshot(page)
    expect(m.round).toBe(round)
    const target = m.players.find((p) => p.alive && p.role === 'civilian')!
    await button(page, 'Mulai petunjuk').click()
    for (let i = 0; i < m.order.length; i++) await button(page, 'Lanjut').click()
    await button(page, 'Pilih langkah berikutnya').click()
    for (let i = 0; i < m.order.length; i++) {
      await handoff(page)
      await button(page, round === 1 ? /^Petunjuk lagi/ : /^Voting Pilih/).click()
      await button(page, 'Pilih ini').click()
    }
    await button(page, 'Lanjut').click()
    if (round === 1) {
      for (let i = 0; i < m.order.length; i++) await button(page, 'Lanjut').click()
      await button(page, 'Mulai voting pemain').click()
    }
    m = await snapshot(page)
    for (const id of m.order) {
      await handoff(page)
      const other = m.players.find((p) => p.id !== id && p.alive)!
      await button(page, id === target.id ? other.name : target.name).click()
      await button(page, 'Pilih ini').click()
    }
    await button(page, 'Lanjut').click()
  }
  await expect(page.getByRole('heading', { name: 'Penyusup menang!' })).toBeVisible()
})

test('correct White guess cancels revenge and solo points survive splash and scoreboard reload', async ({
  page,
}) => {
  const m = fresh()
  m.players.forEach((p) => {
    p.role = 'civilian'
  })
  m.players[0].role = 'white'
  m.players[0].modifier = 'revenger'
  m.players[0].alive = false
  m.players[1].modifier = m.players[2].modifier = 'couple'
  m.players[3].role = 'fool'
  m.players[3].alive = false
  m.players[5].role = 'undercover'
  m.phase = 'death'
  m.deaths = [{ id: 'p1', cause: 'vote' }]
  m.queue = [{ kind: 'revengeChoice', id: 'p1' }]
  await seed(page, m)
  await button(page, 'Lanjut').click()
  await handoff(page)
  await page.getByRole('textbox').fill(assigned(m, { role: 'civilian' })!)
  await button(page, 'Kunci tebakan').click()
  await expect(page.getByRole('heading', { name: 'Tebakan tepat!' })).toBeVisible()
  await button(page, 'Lanjut').click()
  await resume(page)
  await expect(page.getByRole('heading', { name: 'Mr. White menang!' })).toBeVisible()
  expect((await snapshot(page)).queue).toEqual([])
  expect((await snapshot(page)).players.filter(p => p.alive)).toHaveLength(4)
  await expect(page.getByText(assigned(m, { role: 'civilian' })!, { exact: true })).toHaveCount(0)
  await button(page, 'Lihat peran dan skor').click()
  await resume(page)
  await expect(page.getByRole('heading', { name: 'Mr. White menang!' })).toBeVisible()
  expect((await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), local)).scores).toEqual({
    p1: 1,
  })
})

test('touch release and touchcancel conceal immediately; double tap cannot advance two actors', async ({
  page,
  context,
}) => {
  const m = fresh()
  m.phase = 'word'
  await seed(page, m)
  await handoff(page)
  const b = (await button(page, 'Tahan untuk melihat').boundingBox())!
  const cdp = await context.newCDPSession(page)
  for (const end of ['touchCancel', 'touchEnd'] as const) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }],
    })
    await expect(page.locator('[data-private]')).toBeVisible()
    await cdp.send('Input.dispatchTouchEvent', { type: end, touchPoints: [] })
    await expect(page.locator('[data-private]')).toHaveCount(0)
  }
  await button(page, 'Selesai, oper ponsel').dblclick()
  await expect(page.getByRole('heading', { name: 'Oper ke Bima' })).toBeVisible()
  expect((await snapshot(page)).cursor).toBe(1)
})

test('every screen renders at phone size, including private abilities and long multiword cards', async ({
  page,
}) => {
  const frames: { label: string; src: string }[] = []
  async function capture(label: string) {
    await painted(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    frames.push({
      label,
      src:
        'data:image/png;base64,' +
        (await page.screenshot({ animations: 'disabled' })).toString('base64'),
    })
  }
  await page.goto('./')
  await capture('Home')
  await button(page, 'Cara bermain').click()
  await capture('Rules')
  await button(page, 'Kembali').first().click()
  await button(page, 'Pengaturan').click()
  await capture('Settings')
  await button(page, 'Paket kata pribadi').click()
  await button(page, 'Buat set kata').click()
  await capture('Custom words')
  await page.goto('./')
  await button(page, 'Mulai bermain').click()
  await button(page, 'Adit').click()
  await capture('Avatar picker')
  await button(page, 'Simpan').click()
  await button(page, 'Lanjut').click()
  await capture('Role settings')
  for (const phase of [
    'intro',
    'word',
    'mimeReveal',
    'ready',
    'clue',
    'discussion',
    'action',
    'target',
    'wheel',
    'justice',
    'justiceCall',
    'death',
    'revenge',
    'revengeCall',
    'guess',
    'guessResult',
    'actionResult',
    'result',
    'victory',
  ] as const) {
    const m = fresh()
    m.phase = phase
    m.actor = 'p2'
    m.settings.mime = true
    m.mime = 'p1'
    m.players[0].modifier = m.players[2].modifier = 'couple'
    m.triple.wordA =
      m.triple.wordB === 'stasiun kereta bawah tanah' ? 'uji' : 'stasiun kereta bawah tanah'
    if (phase === 'justice' || phase === 'justiceCall' || phase === 'wheel') {
      m.ballot = 'target'
      m.candidates = ['p1', 'p3', 'p4']
      m.outcome = 'p3'
    }
    if (phase === 'target') m.ballot = 'target'
    if (phase === 'guess' || phase === 'revenge' || phase === 'death') {
      m.players[1].alive = false
      m.players[1].role = 'white'
      m.players[1].modifier = 'revenger'
      m.deaths = [{ id: 'p2', cause: 'vote' }]
    }
    if (phase === 'result' || phase === 'victory') m.winner = 'couple'
    if (phase === 'actionResult') m.outcome = 'extra'
    await seed(page, m)
    if (['intro', 'word', 'action', 'justice', 'revenge', 'guess', 'target'].includes(phase)) {
      if (phase === 'intro') await capture('Named handoff')
      await handoff(page)
      if (phase === 'word' || phase === 'intro') {
        await hold(page)
        await capture(phase)
        await page.keyboard.up('Space')
        continue
      }
    }
    await capture(phase)
  }
  // Join captures without adding an image-processing dependency to the game.
  const data = await page.evaluate(async (frames) => {
    const canvas = document.createElement('canvas'),
      w = 195,
      h = 422,
      cols = 5
    canvas.width = w * cols
    canvas.height = (h + 21) * Math.ceil(frames.length / cols)
    const c = canvas.getContext('2d')!
    c.fillStyle = '#e4edf7'
    c.fillRect(0, 0, canvas.width, canvas.height)
    for (const [i, f] of frames.entries()) {
      const img = new Image()
      img.src = f.src
      await img.decode()
      const x = (i % cols) * w,
        y = Math.floor(i / cols) * (h + 21)
      c.drawImage(img, x, y, w, h)
      c.fillStyle = '#193350'
      c.font = 'bold 12px sans-serif'
      c.fillText(f.label, x + 7, y + h + 15)
    }
    return canvas.toDataURL('image/webp', 0.86).split(',')[1]
  }, frames)
  mkdirSync('docs/evidence', { recursive: true })
  writeFileSync('docs/evidence/screens.webp', Buffer.from(data, 'base64'))
})
