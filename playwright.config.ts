import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'
const systemChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const executablePath =
  process.env.CHROMIUM_EXECUTABLE_PATH ||
  (process.platform === 'win32' && existsSync(systemChrome) ? systemChrome : undefined)
export const basePath = process.env.PAGES_BASE || '/local-undercover-game/'
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174' + basePath,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    launchOptions: { executablePath, args: ['--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174' + basePath,
    reuseExistingServer: !process.env.CI,
  },
})
