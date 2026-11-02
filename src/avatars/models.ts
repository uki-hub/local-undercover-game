import type { AnimalId } from './manifest'
import { sculptBirdOrSnake } from './birds-and-snake'
import { sculptMammal } from './mammals'
import { createRig, type AnimalRig } from './rig'
import { articulateMouth } from './mouth'
import { loft, oval } from './sculpt'
import { sculptWoodland } from './woodland'

const portraits: Record<AnimalId, [fur: string, bib: string, turn: number, tilt: number]> = {
  cat: ['#55545d', '#f4f1ed', 0.27, -0.045],
  pig: ['#e9aaa5', '#f2c6bd', -0.18, 0.035],
  monkey: ['#916043', '#e1b18a', -0.21, 0.055],
  chicken: ['#eee5d4', '#fff8e8', 0.25, 0.035],
  bear: ['#a36943', '#b78055', 0.33, 0.012],
  raccoon: ['#85858a', '#e4e1dc', 0.31, -0.035],
  dog: ['#cb8a51', '#f8ead5', 0.18, -0.10],
  snake: ['#69a982', '#d8d6a4', -0.31, 0.025],
  owl: ['#996b4d', '#e6d3b9', -0.13, -0.05],
  rat: ['#aaa0a4', '#e8d9d6', -0.34, 0.035],
}

function shoulders(rig: AnimalRig, fur: string, bib: string, bird: boolean) {
  const width = rig.id === 'bear' ? 1.13 : rig.id === 'rat' ? 0.86 : 1
  // One surface carries the bib from throat to chest, widening at the shoulders.
  const torso = loft(rig.body, fur, [0, 0, -0.07], [
    [-1.49, 0.65, 0.45, -0.02], [-1.00, 0.75, 0.54, 0],
    [-0.69, 0.72, 0.48, 0.015], [-0.48, 0.63, 0.41, 0.01],
    [-0.24, 0.44, 0.36, 0], [0.01, 0.33, 0.31, 0],
  ], 20, { color: bib, angles: [0.63, 0.74, 0.85, 0.97, 1.03, 1.03] })
  torso.scale.x = width
  for (const [i, s] of [-1, 1].entries()) {
    const arm = rig.arms[i]
    arm.position.set(s * 0.425 * width, -0.48, -0.055)
    const armShape = loft(arm, fur, [s * 0.055, -0.13, 0], [
      [-0.44, 0.07, 0.08, 0.14], [-0.34, 0.14, 0.16, 0.11],
      [-0.13, 0.18, 0.20, 0.07], [0.08, 0.17, 0.17, 0.015],
      [0.19, 0.08, 0.10, -0.03],
    ], 12)
    armShape.rotation.z = s * 0.22
    if (bird) {
      for (let j = 0; j < 3; j++) {
        const feather = oval(arm, fur,
          [s * (0.08 + j * 0.04), -0.33 + j * 0.055, 0.09 - j * 0.036],
          [0.095, 0.235, 0.09])
        feather.rotation.z = s * (0.26 + j * 0.1)
        rig.feathers.push(feather)
      }
    } else {
      const color = rig.id === 'monkey' || rig.id === 'rat' ? bib : fur
      oval(arm, color, [s * 0.14, -0.495, 0.18], [0.14, 0.154, 0.15])
    }
  }
}

export function makeAnimal(id: AnimalId) {
  const rig = createRig(id)
  const [fur, bib, turn, tilt] = portraits[id]
  const bird = id === 'owl' || id === 'chicken'
  if (id !== 'snake') shoulders(rig, fur, bib, bird)
  if (id === 'snake' || bird) sculptBirdOrSnake(rig, fur, bib)
  else if (id === 'bear' || id === 'cat' || id === 'raccoon') sculptWoodland(rig, fur, bib)
  else sculptMammal(rig, fur, bib)
  rig.model.rotation.y = turn * 0.48
  rig.head.rotation.y = turn * 0.52
  rig.head.rotation.z = tilt
  rig.model.updateMatrixWorld(true)
  return { ...rig, updateMouth: articulateMouth(rig) }
}

export type Rig = ReturnType<typeof makeAnimal>
