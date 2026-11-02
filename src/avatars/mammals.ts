import type { Group } from 'three'
import { eye, type AnimalRig } from './rig'
import { loft, oval, skin, stroke, type V } from './sculpt'

type Contour = [x: number, y: number, z?: number][]
type Lip = [scale: number, depth: number, color: string]

// Front-facing sections can fold back inward, giving ears a rim and a recessed bowl.
function relief(parent: Group, at: V, edge: Contour, layers: Lip[]) {
  const rings = layers.map(([scale, depth]) =>
    edge.map(([x, y, z = 0]): V => [x * scale, y * scale, depth + z * scale]),
  )
  const mesh = skin(parent, rings, (band) => layers[band + 1][2])
  mesh.position.set(...at)
  return mesh
}

const noseEdge: Contour = [
  [-0.38, 0.74], [-0.84, 0.59], [-1, 0.22], [-0.80, -0.24],
  [-0.24, -0.82], [0, -0.93], [0.24, -0.82], [0.80, -0.24],
  [1, 0.22], [0.84, 0.59], [0.38, 0.74],
]
function noseLeather(parent: Group, at: V, size: V, dark: string, light: string) {
  const nose = relief(parent, at, noseEdge, [
    [0.82, -0.5, dark], [1, 0, dark], [0.78, 0.48, dark], [0.12, 0.67, light],
  ])
  nose.scale.set(...size)
}

// The chin nests against the muzzle. Its upper surface becomes visible during a yawn.
function chin(rig: AnimalRig, color: string, at: V, width: number, length: number) {
  rig.jaw.position.set(...at)
  const rings = [
    [-0.085, 0.36, 0.53], [-0.058, 0.78, 0.75], [-0.015, 1, 0.94],
    [0.004, 0.97, 1], [0.031, 0.82, 0.91],
  ].map(([y, breadth, reach]) => Array.from({ length: 16 }, (_, i): V => {
    const a = i * Math.PI / 8
    return [width * breadth * Math.sin(a), y, length * (0.49 + reach * Math.cos(a))]
  }))
  skin(rig.jaw, rings, (band) => band < 3 ? color : '#623b3b')
  oval(rig.jaw, '#d99591', [0, 0.033, length * 0.87], [width * 0.57, 0.023, length * 0.44])
}

function pig(rig: AnimalRig, fur: string) {
  const { head, ears, nose, eyes } = rig
  loft(head, fur, [0, 0, 0], [
    [-0.48, 0.18, 0.20, 0.10], [-0.35, 0.51, 0.38, 0.08],
    [-0.13, 0.74, 0.49, 0.035], [0.10, 0.75, 0.53, 0.012],
    [0.36, 0.63, 0.51, -0.015], [0.54, 0.46, 0.42, -0.04],
    [0.64, 0.23, 0.24, -0.035], [0.66, 0.065, 0.085, -0.03],
  ])
  const flap: Contour = [
    [-0.055, 0.29], [-0.18, 0.22], [-0.22, 0.045], [-0.17, -0.14],
    [0, -0.13], [0.14, -0.11, 0.09], [0.32, -0.17, 0.13],
    [0.30, 0.03, 0.09], [0.19, 0.22], [0.055, 0.30],
  ]
  for (const [i, s] of [-1, 1].entries()) {
    ears[i].position.set(s * 0.5, 0.44, -0.045)
    const ear = relief(ears[i], [0, 0, 0], flap, [
      [0.82, -0.14, fur], [1, 0.015, fur], [0.78, 0.08, '#eda69b'],
      [0.47, 0.052, '#cb7e78'], [0.12, 0.025, '#b5706d'],
    ])
    ear.scale.x = s
    eyes.push(eye(head, [s * 0.32, 0.12, 0.485], 0.108, '#694339'))
  }
  const snout: Contour = [
    [-0.10, 0.16], [-0.24, 0.12], [-0.292, 0.04], [-0.29, -0.065],
    [-0.20, -0.14], [-0.069, -0.165], [0.069, -0.165], [0.20, -0.14],
    [0.29, -0.065], [0.292, 0.04], [0.24, 0.12], [0.10, 0.16],
  ]
  relief(nose, [0, -0.105, 0.53], snout, [
    [1.16, -0.07, fur], [1.09, 0.065, '#d68c86'], [1, 0.145, '#ecaca3'],
    [0.83, 0.168, '#f1b6ab'], [0.12, 0.179, '#f4bcb1'],
  ])
  for (const s of [-1, 1]) {
    const nostril = oval(nose, '#8e5752', [s * 0.119, -0.112, 0.705], [0.048, 0.068, 0.019])
    nostril.rotation.z = -s * 0.15
  }
  chin(rig, fur, [0, -0.243, 0.20], 0.244, 0.277)
  for (const s of [-1, 1]) {
    const curl: V = [s * 0.10, -0.283, 0.586]
    stroke(nose, '#a67169', [0, -0.29, 0.609], curl, 0.008)
    stroke(nose, '#a67169', curl, [s * 0.176, -0.25, 0.554], 0.007)
  }
}

const roundEar: Contour = [
  [-0.025, 1], [-0.56, 0.87], [-0.88, 0.52], [-1, 0.01], [-0.84, -0.62],
  [-0.40, -0.93], [0.10, -0.97], [0.65, -0.73], [0.94, -0.30],
  [0.98, 0.23], [0.81, 0.65], [0.43, 0.94],
]
function cuppedEar(joint: Group, s: number, size: V, fur: string, rim: string, hollow: string) {
  const ear = relief(joint, [0, 0, 0], roundEar, [
    [0.63, -0.7, fur], [1, 0, fur], [0.91, 0.48, fur],
    [0.73, 0.62, rim], [0.55, 0.37, hollow], [0.13, 0.12, hollow],
  ])
  ear.scale.set(...size)
  ear.rotation.y = s * 0.17
  ear.rotation.z = -s * 0.32
}

function monkey(rig: AnimalRig, fur: string, bib: string) {
  const { head, ears, eyes, nose } = rig
  // The muzzle projects from the same rings as the cheek and chin. The front
  // sectors carry the lighter fur, including the arches above both eyes.
  const sections = [
    [-0.443, 0.16, 0.23, 0.08, 0], [-0.354, 0.34, 0.342, 0.07, 0.065],
    [-0.251, 0.488, 0.405, 0.073, 0.19], [-0.143, 0.60, 0.465, 0.050, 0.19],
    [-0.044, 0.665, 0.475, 0.033, 0.14], [0.105, 0.70, 0.515, 0.01, 0.003],
    [0.32, 0.647, 0.504, -0.012, 0], [0.49, 0.527, 0.443, -0.035, 0],
    [0.617, 0.294, 0.30, -0.054, 0], [0.665, 0.11, 0.13, -0.062, 0],
  ]
  const sides = 20
  const browHeight = [-0.053, 0.084, 0.064, -0.040]
  const rings = sections.map(([y, width, depth, z, muzzle], row) =>
    Array.from({ length: sides }, (_, i): V => {
      const a = i * Math.PI * 2 / sides
      const front = Math.cos(a)
      const brow = row === 6 ? (browHeight[Math.min(i, sides - i)] ?? 0) : 0
      return [width * Math.sin(a), y + brow, z + depth * front + muzzle * Math.max(0, front) ** 5]
    }),
  )
  skin(head, rings, (band, sector) =>
    band <= 5 && (sector < 3 || sector >= sides - 3) ? bib : fur,
  )
  for (const [i, s] of [-1, 1].entries()) {
    ears[i].position.set(s * 0.682, 0.15, -0.015)
    cuppedEar(ears[i], s, [0.24, 0.245, 0.13], fur, '#b98159', '#925c43')
    eyes.push(eye(head, [s * 0.251, 0.119, 0.506], 0.124, '#72503b'))
  }
  for (const s of [-1, 1]) {
    const nostril = oval(nose, '#855542', [s * 0.073, -0.09, 0.660], [0.033, 0.020, 0.019])
    nostril.rotation.z = -s * 0.21
    stroke(nose, '#a47860', [0, -0.237, 0.675], [s * 0.091, -0.232, 0.653], 0.010)
    stroke(nose, '#a47860', [s * 0.091, -0.232, 0.653], [s * 0.171, -0.201, 0.606], 0.009)
  }
  chin(rig, bib, [0, -0.251, 0.20], 0.254, 0.26)
}

function dog(rig: AnimalRig, fur: string, bib: string) {
  const { head, ears, eyes, nose } = rig
  loft(head, fur, [0, 0, 0], [
    [-0.46, 0.20, 0.22, 0.12], [-0.30, 0.49, 0.42, 0.072],
    [-0.08, 0.69, 0.49, 0.045], [0.16, 0.72, 0.54, 0.015],
    [0.39, 0.65, 0.50, -0.02], [0.55, 0.48, 0.41, -0.045],
    [0.64, 0.24, 0.24, -0.065], [0.66, 0.055, 0.07, -0.065],
  ], 20, { color: bib, angles: [1.02, 0.91, 0.53, 0.21, 0.13, 0.094, 0.07, 0.06] })
  const flap: Contour = [
    [-0.025, 0.17], [-0.15, 0.092, 0.015], [-0.185, -0.13, 0.07],
    [-0.15, -0.40, 0.12], [-0.072, -0.61, 0.14], [0.043, -0.68, 0.16],
    [0.155, -0.64, 0.13], [0.234, -0.47, 0.085], [0.22, -0.21, 0.04],
    [0.174, 0, 0.01], [0.10, 0.14],
  ]
  for (const [i, s] of [-1, 1].entries()) {
    ears[i].position.set(s * 0.592, 0.34, 0.02)
    const ear = relief(ears[i], [0, -0.01, 0], flap, [
      [0.72, -0.18, '#6a4335'], [1, 0.043, '#845234'], [0.91, 0.13, '#98613d'],
      [0.61, 0.164, '#a76c42'], [0.12, 0.19, '#a76c42'],
    ])
    ear.scale.x = s
    ear.rotation.z = s * (i ? 0.22 : 0.12)
    eyes.push(eye(head, [s * 0.33, 0.106, 0.498], 0.116, '#674637'))
  }
  loft(nose, bib, [0, 0, 0], [
    [-0.313, 0.17, 0.16, 0.49], [-0.25, 0.32, 0.25, 0.52],
    [-0.149, 0.38, 0.275, 0.51], [-0.054, 0.295, 0.254, 0.485],
    [0.029, 0.205, 0.198, 0.467], [0.081, 0.128, 0.099, 0.465],
  ])
  noseLeather(nose, [0, -0.093, 0.763], [0.154, 0.112, 0.092], '#302824', '#433731')
  stroke(nose, '#796256', [0, -0.164, 0.785], [0, -0.233, 0.773], 0.011)
  for (const s of [-1, 1]) {
    stroke(nose, '#796256', [0, -0.233, 0.773], [s * 0.079, -0.249, 0.757], 0.010)
    stroke(nose, '#796256', [s * 0.079, -0.249, 0.757], [s * 0.145, -0.227, 0.742], 0.009)
  }
  chin(rig, bib, [0, -0.247, 0.225], 0.269, 0.275)
}

function rat(rig: AnimalRig, fur: string, bib: string) {
  const { head, ears, eyes, nose } = rig
  const sections = [
    [-0.410, 0.13, 0.23, 0.14, 0.09], [-0.282, 0.37, 0.39, 0.125, 0.21],
    [-0.167, 0.525, 0.465, 0.089, 0.30], [-0.056, 0.605, 0.49, 0.05, 0.19],
    [0.101, 0.641, 0.52, 0.008, 0.018], [0.312, 0.575, 0.45, -0.04, 0],
    [0.465, 0.410, 0.363, -0.06, 0], [0.55, 0.216, 0.217, -0.062, 0],
    [0.582, 0.06, 0.074, -0.053, 0],
  ]
  const sides = 20
  const rings = sections.map(([y, width, depth, z, snout], row) =>
    Array.from({ length: sides }, (_, i): V => {
      const a = i * Math.PI * 2 / sides
      const front = Math.cos(a)
      const cheek = row === 3 ? Math.abs(Math.sin(a)) * 0.06 : 0
      return [width * Math.sin(a), y - cheek, z + depth * front + snout * Math.max(0, front) ** 4]
    }),
  )
  skin(head, rings, (band, sector) =>
    band <= 2 && (sector < 4 || sector >= sides - 4) ? '#d5c8c6' : fur,
  )
  for (const [i, s] of [-1, 1].entries()) {
    ears[i].position.set(s * 0.495, 0.41, -0.11)
    cuppedEar(ears[i], s, [0.268, 0.322, 0.14], fur, '#dcc3ba', '#c78f89')
    eyes.push(eye(head, [s * 0.304, 0.096, 0.468], 0.117, '#59483f'))
  }
  noseLeather(nose, [0, -0.164, 0.834], [0.102, 0.077, 0.080], '#ba837e', '#d5a19a')
  stroke(nose, '#8d7473', [0, -0.204, 0.838], [0, -0.235, 0.789], 0.007)
  for (const s of [-1, 1]) {
    stroke(nose, '#8d7473', [0, -0.235, 0.789], [s * 0.093, -0.231, 0.76], 0.007)
    const start: V = [s * 0.177, -0.195, 0.758]
    stroke(nose, '#8e7f7a', start, [s * 0.45, -0.15, 0.73], 0.010)
    stroke(nose, '#a99a94', [s * 0.45, -0.15, 0.73], [s * 0.76, -0.088, 0.625], 0.006)
    stroke(nose, '#8e7f7a', [s * 0.17, -0.219, 0.748], [s * 0.48, -0.231, 0.70], 0.009)
    stroke(nose, '#a99a94', [s * 0.48, -0.231, 0.70], [s * 0.736, -0.24, 0.61], 0.006)
  }
  chin(rig, bib, [0, -0.251, 0.30], 0.180, 0.255)
}

export function sculptMammal(rig: AnimalRig, fur: string, bib: string) {
  switch (rig.id) {
    case 'pig': return pig(rig, fur)
    case 'monkey': return monkey(rig, fur, bib)
    case 'dog': return dog(rig, fur, bib)
    case 'rat': return rat(rig, fur, bib)
  }
}
