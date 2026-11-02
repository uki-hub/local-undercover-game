export type Random = (bound: number) => number

export function newId() {
  // getRandomValues also works on a local-network HTTP development preview.
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
}

export const random: Random = (bound) => {
  if (!Number.isSafeInteger(bound) || bound < 1 || bound > 2 ** 32) throw Error('randomBound')
  const limit = 2 ** 32 - (2 ** 32 % bound)
  const buffer = new Uint32Array(1)
  do {
    crypto.getRandomValues(buffer)
  } while (buffer[0] >= limit)
  return buffer[0] % bound
}

export function shuffle<T>(items: readonly T[], rng: Random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
