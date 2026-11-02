// npm run avatars — compile the real rigs in a local Vite module server, render in Chromium.
import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import { mkdir, writeFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const evidence = resolve(root, 'docs/evidence')
const destination = resolve(root, 'public/assets/avatars')
await Promise.all([mkdir(destination, { recursive: true }), mkdir(evidence, { recursive: true })])
const server = await createServer({
  configFile: false,
  root,
  base: '/',
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'three',
      'react',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@react-three/fiber',
    ],
  },
  plugins: [
    {
      name: 'studio-page',
      configureServer(vite) {
        vite.middlewares.use('/studio', (_, res) => {
          res.setHeader('Content-Type', 'text/html')
          res.end('<!doctype html><html><body></body></html>')
        })
      },
    },
  ],
})

function decode(url) {
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')
}
function chunk(name, content) {
  const header = Buffer.alloc(8)
  header.write(name)
  header.writeUInt32LE(content.length, 4)
  return Buffer.concat([header, content, Buffer.alloc(content.length % 2)])
}

// ANMF wraps complete independently encoded WebP frames. No native encoder dependency.
function webpAnimation(frames, width, height) {
  const vpx = Buffer.alloc(10)
  vpx[0] = 2
  vpx.writeUIntLE(width - 1, 4, 3)
  vpx.writeUIntLE(height - 1, 7, 3)
  const items = [Buffer.from('WEBP'), chunk('VP8X', vpx), chunk('ANIM', Buffer.alloc(6))]
  for (const { encoded, delay } of frames) {
    const full = decode(encoded)
    const bits = []
    for (let offset = 12; offset < full.length;) {
      const size = full.readUInt32LE(offset + 4)
      const end = offset + 8 + size + (size % 2)
      if (['VP8 ', 'VP8L', 'ALPH'].includes(full.toString('ascii', offset, offset + 4)))
        bits.push(full.subarray(offset, end))
      offset = end
    }
    if (!bits.length) throw Error('No picture bitstream in WebP frame')
    const head = Buffer.alloc(16)
    head.writeUIntLE(width - 1, 6, 3)
    head.writeUIntLE(height - 1, 9, 3)
    head.writeUIntLE(delay, 12, 3)
    head[15] = 2
    items.push(chunk('ANMF', Buffer.concat([head, ...bits])))
  }
  return chunk('RIFF', Buffer.concat(items))
}

let browser
try {
  await server.listen()
  let executablePath = process.env.CHROMIUM_EXECUTABLE_PATH
  if (!executablePath && process.platform === 'win32') {
    const system = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    try {
      await access(system)
      executablePath = system
    } catch {
      /* Playwright-managed browser */
    }
  }
  browser = await chromium.launch({ executablePath, args: ['--enable-unsafe-swiftshader'] })
  const page = await browser.newPage()
  page.on('pageerror', (error) => console.error('Studio:', error.message))
  await page.goto(server.resolvedUrls.local[0] + 'studio')
  await page.evaluate(async () => {
    window.studio = await import('/scripts/avatar-studio.ts')
  })
  const portraits = await page.evaluate(() => window.studio.portraits())
  for (const { id, url } of portraits)
    await writeFile(resolve(destination, id + '.webp'), decode(url))
  console.log('Captured', portraits.length, 'transparent model renders')
  const contact = await page.evaluate(() => window.studio.contact('idle', 0))
  await writeFile(resolve(evidence, 'avatar-roster.webp'), decode(contact))
  const report = await page.evaluate(() => window.studio.audit())
  console.log(JSON.stringify(report, null, 2))
  const frames = [{ encoded: contact, delay: 600 }]
  for (const [clip, steps, delay] of [
    ['blink', 5, 53],
    ['yawn', 13, 100],
    ['species', 15, 90],
  ]) {
    for (let i = 1; i <= steps; i++) {
      const encoded = await page.evaluate(
        ([c, t]) => window.studio.contact(c, t),
        [clip, i / steps],
      )
      frames.push({ encoded, delay: i === steps ? 500 : delay })
    }
  }
  await writeFile(resolve(evidence, 'avatar-motion.webp'), webpAnimation(frames, 960, 438))
  // Exercise the production React badge, WebGL context reuse, and both fallback paths.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(async () => {
    window.badges = (await import('/scripts/avatar-badge-harness.tsx')).mountHarness()
  })
  const ready = () =>
    page.waitForFunction(
      () => document.querySelector('.animal-cutout img')?.style.visibility === 'hidden',
    )
  const staticOnly = () =>
    page.waitForFunction(
      () =>
        document.querySelector('.animal-cutout img')?.style.visibility === 'visible' &&
        !document.querySelector('.animal-live canvas'),
    )
  await ready()
  const canvas = await page.locator('.animal-live canvas').elementHandle()
  for (const { id } of portraits) {
    await page.evaluate((id) => window.badges.show(id), id)
    await page.waitForFunction(
      (id) => document.querySelector('.animal-cutout img')?.src.endsWith(id + '.webp'),
      id,
    )
    await ready()
    if (!(await canvas.evaluate((node) => node === document.querySelector('.animal-live canvas'))))
      throw Error('Canvas replaced on ' + id)
  }
  await page.evaluate(() => window.badges.show('cat', false, 'new-screen'))
  await ready()
  if (!(await canvas.evaluate((node) => node === document.querySelector('.animal-live canvas'))))
    throw Error('Canvas replaced between screens')
  await page.waitForTimeout(650)
  await page.locator('.animal-badge').screenshot({ path: resolve(evidence, 'avatar-live.png') })
  await canvas.evaluate((node) => {
    const gl = node.getContext('webgl2')
    window.draws = 0
    for (const key of ['drawElements', 'drawArrays']) {
      const original = gl[key].bind(gl)
      gl[key] = (...args) => {
        window.draws++
        return original(...args)
      }
    }
  })
  async function expectPaused(label) {
    await page.waitForTimeout(140)
    const before = await page.evaluate(() => window.draws)
    await page.waitForTimeout(240)
    if ((await page.evaluate(() => window.draws)) !== before)
      throw Error('Canvas continued drawing ' + label)
  }
  await expectPaused('between clips')
  await page.evaluate(() => {
    window.scrollTo(0, 950)
  })
  await expectPaused('offscreen')
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expectPaused('during simulated visibility change')
  await page.evaluate(() => {
    delete document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.evaluate(() => window.badges.show('cat', true))
  await staticOnly()
  await page.evaluate(() => window.badges.show('chicken'))
  await ready()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await staticOnly()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await ready()
  await canvas.evaluate((node) =>
    node.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext(),
  )
  await staticOnly()
  await page.evaluate(() => window.badges.show('owl', false, 'after-loss'))
  await staticOnly()
  console.log(
    'Verified 10 live badges, shared canvas, hidden/offscreen/idle pause, settings/system reduced motion, context-loss fallback. Saved roster, motion reel and previews.',
  )
} finally {
  await browser?.close()
  await server.close()
}
