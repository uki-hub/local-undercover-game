import { expect, test } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import type { AddressInfo } from 'node:net'

test('installed update waits through active play and activates after the last client closes', async ({
  context,
}) => {
  const base = new URL(test.info().project.use.baseURL!).pathname
  const root = resolve('dist'),
    mime: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.webmanifest': 'application/manifest+json',
      '.css': 'text/css',
      '.json': 'application/json',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
    }
  let generation = 1
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, 'http://localhost')
    const file = resolve(root, url.pathname.slice(base.length) || 'index.html')
    if (!url.pathname.startsWith(base) || !file.startsWith(root + sep)) {
      res.writeHead(404).end()
      return
    }
    try {
      const bytes = await readFile(file)
      res.writeHead(200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      res.end(
        file === resolve(root, 'sw.js')
          ? Buffer.concat([bytes, Buffer.from('\n// release ' + generation)])
          : bytes,
      )
    } catch {
      res.writeHead(404).end()
    }
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const url = 'http://127.0.0.1:' + (server.address() as AddressInfo).port + base
  try {
    const page = await context.newPage()
    await page.goto(url)
    await expect(page.getByRole('status')).toContainText('Siap dimainkan luring')
    await page.reload()
    for (const name of ['Mulai bermain', 'Lanjut', 'Bagikan peran'])
      await page.getByRole('button', { name, exact: true }).click()
    generation++
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.ready
      await r.update()
    })
    await expect
      .poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting))
      .toBe(true)
    await page.getByRole('button', { name: /Saya .+, siap/ }).click()
    const hold = page.getByRole('button', { name: 'Tahan untuk melihat' })
    await hold.focus()
    await page.keyboard.down('Space')
    await page.keyboard.up('Space')
    await page.getByRole('button', { name: 'Selesai, oper ponsel' }).click()
    await expect(page.getByRole('heading', { name: 'Oper ke Bima' })).toBeVisible()
    expect(await page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting)).toBe(
      true,
    )
    await page.close()
    const other = await context.newPage()
    await other.goto(url)
    await expect
      .poll(() => other.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting))
      .toBe(false)
    await other.close()
  } finally {
    await new Promise<void>((r) => server.close(() => r()))
  }
})
