import { expect, test } from '@playwright/test'

test('featured chicken renders in the game and a failed 3D chunk still permits play', async ({ browser }) => {
  const baseURL = test.info().project.use.baseURL!
  for (const failChunk of [false, true]) {
    const context = await browser.newContext({
      baseURL, viewport: { width: 390, height: 844 },
      serviceWorkers: 'block', reducedMotion: 'no-preference',
    })
    const page = await context.newPage()
    if (failChunk) await page.route('**/assets/LiveAnimal-*.js', route => route.abort())
    await page.goto('./')
    if (!failChunk) await expect(page.locator('.home-badge img')).toHaveCSS('visibility', 'hidden')
    await page.getByRole('button', { name: 'Mulai bermain' }).click()
    await page.getByRole('button', { name: 'Adit', exact: true }).click()
    await page.getByRole('button', { name: 'Ayam', exact: true }).click()
    const portrait = page.locator('.hero-avatar img')
    await expect(portrait).toHaveAttribute('src', /chicken\.webp$/)
    await expect(portrait).toHaveCSS('visibility', failChunk ? 'visible' : 'hidden')
    await expect(page.locator('canvas')).toHaveCount(failChunk ? 0 : 1)
    await page.getByRole('button', { name: 'Simpan' }).click()
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
    await page.getByRole('button', { name: 'Waktu', exact: true }).click()
    await page.getByRole('button', { name: 'Bagikan peran' }).click()
    await expect(page.getByRole('heading', { name: 'Oper ke Adit' })).toBeVisible()
    await context.close()
  }
})
