import i18n, { type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import manifest from './locales/manifest.json'
// Raw glob imports keep Vite's locale loader separate from Node's attributed JSON imports.
const modules = import.meta.glob('./locales/*/*.json', { eager: true, query: '?raw', import: 'default' })
const resources: Resource = {}
export const enabled = manifest.locales.filter((l) => l.enabled)
for (const { code } of enabled) {
  resources[code] = {}
  for (const ns of manifest.namespaces)
    resources[code][ns] = JSON.parse(modules[`./locales/${code}/${ns}.json`] as string) as Record<string, string>
}
export const localeFor = (code: string) =>
  enabled.some((l) => l.code === code) ? code : manifest.default
void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: manifest.default,
    fallbackLng: manifest.default,
    supportedLngs: enabled.map((l) => l.code),
    ns: manifest.namespaces,
    defaultNS: 'common',
    initImmediate: false,
    interpolation: { escapeValue: false },
  })
export default i18n
