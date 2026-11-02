export const ANIMALS = [
  'cat',
  'pig',
  'monkey',
  'chicken',
  'bear',
  'raccoon',
  'dog',
  'snake',
  'owl',
  'rat',
] as const
export type AnimalId = (typeof ANIMALS)[number]

export const speciesClips = {
  cat: ['earTwitch', 'pawStretch'],
  pig: ['noseWiggle', 'earFlick', 'headBob'],
  monkey: ['headScratch', 'curiousGlance', 'shoulderStretch'],
  chicken: ['headBob', 'wingStretch'],
  bear: ['sleepyDip', 'shoulderStretch'],
  raccoon: ['pawRub', 'headTilt', 'noseTwitch'],
  dog: ['headTilt', 'earPerk', 'pant'],
  snake: ['tongueFlick', 'coilSway', 'headLift'],
  owl: ['headTurn', 'featherRuffle'],
  rat: ['whiskerTwitch', 'noseSniff', 'pawGroom'],
} as const

export const commonClips = ['idle', 'blink', 'yawn', 'select'] as const
export type Clip = (typeof commonClips)[number] | (typeof speciesClips)[AnimalId][number]

// Fill the portrait with head and shoulders. Tall combs and ears have extra headroom.
const framing: Record<AnimalId, [height: number, targetY: number]> = {
  cat: [2.2, 0.43],
  pig: [1.98, 0.34],
  monkey: [2.00, 0.23],
  chicken: [2.03, 0.42],
  bear: [1.95, 0.33],
  raccoon: [2.15, 0.37],
  dog: [1.92, 0.23],
  snake: [2.03, -0.06],
  owl: [2.07, 0.25],
  rat: [2.05, 0.29],
}

export function avatarEntry(id: AnimalId) {
  return {
    id,
    labelKey: `avatars:${id}`,
    source: 'procedural' as const,
    modelKey: id,
    preview: `${import.meta.env.BASE_URL}assets/avatars/${id}.webp`,
    framing: { height: framing[id][0], targetY: framing[id][1] },
    clips: [...commonClips, ...speciesClips[id]],
  }
}
