import { readFileSync } from 'node:fs'
import { packSchema } from '../src/content/words'
import manifest from '../src/locales/manifest.json'
import contract from '../src/locales/contract.json'
const read = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'))
function compare(value: unknown, expected: unknown, path: string) {
  if (Array.isArray(expected)) {
    if (typeof value !== 'string' || !value.trim()) throw Error(path + ' missing translation')
    const vars = [...value.matchAll(/{{\s*([\w]+)\s*}}/g)].map((m) => m[1]).sort()
    if (JSON.stringify(vars) !== JSON.stringify(expected))
      throw Error(path + ' interpolation mismatch')
    return
  }
  if (!value || typeof value !== 'object') throw Error(path + ' missing object')
  for (const [key, child] of Object.entries(expected as object))
    compare((value as Record<string, unknown>)[key], child, path + '.' + key)
}
for (const loc of manifest.locales.filter((l) => l.enabled)) {
  for (const ns of manifest.namespaces) {
    const path = 'src/locales/' + loc.code + '/' + ns + '.json'
    compare(read(path), contract[ns as keyof typeof contract], path)
  }
  console.log(loc.code + ' · ' + manifest.namespaces.length + ' translation namespaces validated')
}
for (const { locale, path } of manifest.wordPacks) {
  const file = 'public/' + path,
    result = packSchema.safeParse(read(file))
  if (!result.success)
    throw Error(
      file + '\n' + result.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('\n'),
    )
  if (result.data.locale !== locale || result.data.sets.length < 100)
    throw Error(file + ' pack locale or minimum set count')
  console.log(file + ' · ' + result.data.sets.length + ' validated triples')
}
