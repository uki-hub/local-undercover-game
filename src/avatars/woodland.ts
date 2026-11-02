import { eye, type AnimalRig } from './rig'
import { loft, oval, skin, stroke, type V } from './sculpt'

// Start each cross section at the nose bridge, pass the cheekbone, then close
// around the back of the skull. Both sides meet at the same centerline.
function faceRing(front: V[]): V[] {
  const [width, y] = front[front.length - 1]
  const back: V[] = [
    [width * 0.78, y + 0.015, -width * 0.38],
    [width * 0.43, y + 0.02, -width * 0.59],
    [0, y + 0.02, -width * 0.66],
  ]
  const half = [...front, ...back]
  return [...half, ...half.slice(1, -1).reverse().map(([x, y, z]): V => [-x, y, z])]
}

// Six landmarks per side keep the projecting muzzle, swept cheeks and forehead
// on one skin. The second row traces the curved lip above the hinged chin.
function catFace(depth: number, raccoon: boolean): V[][] {
  const chin: V[] = [
    [0, -0.16, 0.33], [0.10, -0.16, 0.34], [0.21, -0.21, 0.31],
    [0.32, -0.43, 0.19], [0.42, -0.38, 0.10], [0.46, -0.34, -0.02],
  ]
  const lip: V[] = [
    [0, -0.235, depth - 0.012], [0.087, -0.260, depth - 0.023], [0.18, -0.235, depth - 0.080],
    [0.36, -0.31, 0.45], [0.55, -0.28, 0.25], [0.67, -0.24, -0.01],
  ]
  const cheek: V[] = [
    [0, -0.15, depth], [0.105, -0.16, depth - 0.018], [0.23, -0.175, depth - 0.08],
    [0.42, -0.19, 0.50], [0.66, -0.15, 0.32], [0.835, -0.12, -0.02],
  ]
  const mask: V[] = [
    [0, 0.018, depth - 0.09], [0.12, -0.008, depth - 0.105], [0.22, -0.07, depth - 0.15],
    [0.40, raccoon ? -0.17 : -0.08, 0.515], [0.62, raccoon ? -0.18 : -0.09, 0.35], [0.755, -0.08, 0.01],
  ]
  const brow: V[] = raccoon ? [
    [0, 0.21, 0.55], [0.095, 0.085, 0.575], [0.215, 0.255, 0.53],
    [0.355, 0.275, 0.49], [0.545, 0.125, 0.39], [0.735, -0.035, 0.01],
  ] : [
    [0, 0.225, 0.545], [0.105, 0.175, 0.542], [0.205, 0.246, 0.526],
    [0.35, 0.271, 0.497], [0.54, 0.175, 0.362], [0.68, 0.115, -0.01],
  ]
  const arch: V[] = raccoon ? [
    [0, 0.46, 0.43], [0.075, 0.24, 0.55], [0.215, 0.355, 0.50],
    [0.34, 0.355, 0.46], [0.545, 0.215, 0.34], [0.69, 0.06, -0.01],
  ] : [
    [0, 0.45, 0.443], [0.041, 0.395, 0.47], [0.192, 0.35, 0.493],
    [0.34, 0.365, 0.453], [0.505, 0.26, 0.327], [0.64, 0.215, -0.03],
  ]
  const crown: V[] = [
    [0, 0.60, 0.24], [0.014, 0.54, 0.335], [0.14, 0.54, 0.325],
    [0.28, 0.51, 0.26], [0.41, 0.48, 0.14], [0.47, 0.45, -0.05],
  ]
  const top: V[] = [
    [0, 0.635, 0.01], [0.048, 0.632, 0.03], [0.10, 0.629, 0.024],
    [0.14, 0.622, 0.015], [0.19, 0.617, -0.01], [0.22, 0.608, -0.035],
  ]
  return [chin, lip, cheek, mask, brow, arch, crown, top].map(faceRing)
}

function bearFace(depth: number): V[][] {
  const sections: V[][] = [
    [[0, -0.17, 0.35], [0.095, -0.17, 0.355], [0.21, -0.20, 0.33],
     [0.31, -0.44, 0.23], [0.40, -0.41, 0.13], [0.43, -0.37, -0.025]],
    [[0, -0.24, depth], [0.10, -0.27, depth - 0.015], [0.215, -0.24, depth - 0.09],
     [0.40, -0.365, 0.43], [0.56, -0.32, 0.25], [0.64, -0.24, -0.02]],
    [[0, -0.11, depth], [0.13, -0.12, depth - 0.026], [0.285, -0.16, depth - 0.14],
     [0.43, -0.16, 0.50], [0.63, -0.14, 0.30], [0.745, -0.10, -0.035]],
    [[0, 0.088, 0.72], [0.15, 0.060, 0.68], [0.24, -0.01, 0.60],
     [0.425, 0.010, 0.50], [0.63, 0.015, 0.32], [0.745, 0.035, -0.025]],
    [[0, 0.28, 0.52], [0.12, 0.255, 0.53], [0.25, 0.24, 0.52],
     [0.40, 0.245, 0.46], [0.56, 0.20, 0.31], [0.69, 0.18, -0.02]],
    [[0, 0.42, 0.45], [0.13, 0.43, 0.44], [0.25, 0.415, 0.405],
     [0.37, 0.385, 0.34], [0.49, 0.35, 0.235], [0.605, 0.32, -0.04]],
    [[0, 0.56, 0.27], [0.11, 0.555, 0.277], [0.205, 0.55, 0.24],
     [0.29, 0.525, 0.195], [0.365, 0.515, 0.12], [0.435, 0.495, -0.04]],
    [[0, 0.62, 0.03], [0.045, 0.625, 0.025], [0.085, 0.62, 0.023],
     [0.13, 0.615, 0.018], [0.17, 0.61, -0.015], [0.20, 0.60, -0.035]],
  ]
  return sections.map(faceRing)
}

type Outline = [x: number, y: number][]
const pointed: Outline = [
  [-0.23, 0], [-0.02, -0.10], [0.13, -0.075], [0.195, 0.19],
  [0.20, 0.52], [0.16, 0.6], [0.09, 0.56], [-0.12, 0.28],
]
const rounded: Outline = [
  [-0.19, -0.10], [0, -0.16], [0.17, -0.10], [0.23, 0.04], [0.20, 0.19],
  [0.11, 0.29], [-0.01, 0.31], [-0.14, 0.26], [-0.21, 0.14], [-0.23, 0.02],
]

function earCup(rig: AnimalRig, i: number, side: number, fur: string) {
  const bear = rig.id === 'bear'
  const cat = rig.id === 'cat'
  const ear = rig.ears[i]
  ear.position.set(side * (bear ? 0.48 : 0.415), bear ? 0.435 : 0.335, -0.09)
  ear.rotation.z = -side * (bear ? 0.18 : 0.13)
  ear.rotation.y = side * 0.16
  const outline = bear ? rounded : pointed
  const centerY = bear ? 0.07 : 0.21
  const height = cat ? 1.11 : bear ? 1 : 0.83
  const contour = (size: number, z: number): V[] => outline.map(([x, y]) =>
    [x * size, (y - centerY) * size * height + centerY, z - y * 0.09])
  const inner = cat ? '#eba297' : bear ? '#865237' : '#48464f'
  const rim = cat ? '#aa7378' : bear ? '#603a2b' : '#e5e0d9'
  const shades = [fur, cat ? '#39353a' : fur, rim, inner]
  const shell = skin(ear, [
    contour(0.79, -0.10), contour(1, 0.03), contour(0.90, 0.14),
    contour(0.73, 0.135), contour(0.31, 0.035),
  ], (band) => shades[band])
  shell.scale.x = side
}

function noseAndChin(rig: AnimalRig, snout: string, depth: number) {
  const bear = rig.id === 'bear'
  const cat = rig.id === 'cat'
  const width = cat ? 0.107 : 0.134
  const y = bear ? -0.076 : -0.103
  loft(rig.nose, cat ? '#cd8a87' : '#292329', [0, y, depth], [
    [-0.078, 0.018, 0.021, 0.012],
    [-0.048, width * 0.64, 0.053, 0.012],
    [0.007, width, 0.068, 0.010],
    [0.041, width * 0.94, 0.054, 0],
    [0.059, width * 0.65, 0.028, -0.017],
  ], 12)
  const lip = bear ? '#795136' : '#988680'
  const split: V = [0, -0.232, depth + 0.007]
  stroke(rig.nose, lip, [0, y - 0.07, depth + 0.008], split, 0.008)
  for (const side of [-1, 1]) {
    const curl: V = [side * 0.085, -0.257, depth - 0.006]
    stroke(rig.nose, lip, split, curl, 0.008)
    stroke(rig.nose, lip, curl, [side * 0.179, -0.226, depth - 0.054], 0.007)
    if (cat) {
      stroke(rig.nose, '#c1b4ac', [side * 0.20, -0.166, depth - 0.066], [side * 0.76, -0.114, 0.46], 0.005)
      stroke(rig.nose, '#c1b4ac', [side * 0.205, -0.187, depth - 0.065], [side * 0.72, -0.208, 0.46], 0.005)
    }
  }
  // The top rim follows the same small W as the upper lip. The inside of the
  // mouth stays behind that seam until the entire chin rotates on the hinge.
  rig.jaw.position.set(0, -0.233, 0.30)
  const deep = depth - rig.jaw.position.z
  const sections: V[][] = [
    [[0, -0.172, deep - 0.18], [0.10, -0.166, deep - 0.20],
     [0.17, -0.135, deep - 0.22], [0.19, -0.10, deep - 0.30]],
    [[0, -0.094, deep - 0.058], [0.10, -0.091, deep - 0.068],
     [0.19, -0.060, deep - 0.118], [0.23, -0.048, deep - 0.22]],
    [[0, -0.005, deep - 0.014], [0.09, -0.031, deep - 0.020],
     [0.185, -0.003, deep - 0.085], [0.225, -0.004, deep - 0.19]],
    [[0, 0.006, deep - 0.050], [0.081, -0.016, deep - 0.058],
     [0.166, 0.008, deep - 0.125], [0.201, 0.009, deep - 0.208]],
  ]
  skin(rig.jaw, sections.map(faceRing), (band) => band < 2 ? snout : '#644047')
  oval(rig.jaw, '#d48e89', [0, 0.009, deep * 0.58], [0.105, 0.019, deep * 0.33])
}

export function sculptWoodland(rig: AnimalRig, fur: string, bib: string) {
  const bear = rig.id === 'bear'
  const cat = rig.id === 'cat'
  const depth = bear ? 0.805 : cat ? 0.729 : 0.815
  const snout = bear ? '#e0b582' : bib
  const face = bear ? bearFace(depth) : catFace(depth, !cat)
  // Five front panels per half face, from the nose to the ear.
  const paint = {
    bear:    ['ppfff', 'wwfff', 'wwfff', 'ffdff', 'ffhff', 'fffff', 'fffff'],
    cat:     ['ppwww', 'wwwww', 'wwwww', 'wdddf', 'whhhf', 'wffff', 'fffff'],
    raccoon: ['ppwff', 'wwwww', 'wwwww', 'dmmmm', 'fwwww', 'ffhff', 'fffff'],
  }[bear ? 'bear' : cat ? 'cat' : 'raccoon']
  const colors: Record<string, string> = {
    f: fur, w: snout, m: '#29292f', p: '#634047',
    d: bear ? '#99623e' : cat ? '#47464f' : '#76757b',
    h: bear ? '#aa714b' : cat ? '#67656c' : '#8c8b8d',
  }
  skin(rig.head, face, (band, sector) => {
    const panel = Math.min(sector, face[0].length - 1 - sector)
    return colors[paint[band][panel]] ?? fur
  })
  for (const [i, side] of [-1, 1].entries()) {
    earCup(rig, i, side, fur)
    const x = bear ? 0.279 : cat ? 0.301 : 0.32
    const z = bear ? 0.529 : 0.506
    const iris = cat ? '#466776' : '#654c43'
    rig.eyes.push(eye(rig.head, [side * x, bear ? 0.147 : 0.12, z], bear ? 0.098 : 0.117, iris))
  }
  noseAndChin(rig, snout, depth)
}
