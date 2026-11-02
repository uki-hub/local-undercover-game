import * as T from 'three'
import { eye, type AnimalRig } from './rig'
import { geometry, loft, oval, part, skin, stroke, type V } from './sculpt'

// Contour depths follow the skull. A narrow turned edge keeps the plume or
// facial disk dimensional when the head turns away from the camera.
function plumage(parent: T.Object3D, color: string, center: V, contour: V[]) {
  const points: number[] = []
  const signedArea = contour.reduce((area, [x, y], i) => {
    const next = contour[(i + 1) % contour.length]
    return area + x * next[1] - y * next[0]
  }, 0)
  const outline = signedArea > 0 ? contour : [...contour].reverse()
  const inset = outline.map(([x, y, z]): V => [
    x * 0.81 + center[0] * 0.19, y * 0.81 + center[1] * 0.19, z * 0.61 + center[2] * 0.39,
  ])
  for (let i = 0; i < outline.length; i++) {
    const j = (i + 1) % outline.length
    const a = outline[i], b = outline[j], c = inset[i], d = inset[j]
    points.push(...center, ...c, ...d, ...c, ...a, ...b, ...c, ...b, ...d)
    const backA: V = [a[0], a[1], a[2] - 0.1]
    const backB: V = [b[0], b[1], b[2] - 0.1]
    points.push(...a, ...backA, ...backB, ...a, ...backB, ...b)
  }
  const mesh = part(parent, geometry(points), color, [0, 0, 0], [1, 1, 1])
  mesh.userData.ownedGeometry = true
  return mesh
}

function bill({ head, jaw }: AnimalRig, owl: boolean) {
  // The rear edge is the hinge. The hooked upper bill overlaps the lower one at rest.
  jaw.position.set(0, owl ? -0.13 : -0.11, owl ? 0.44 : 0.38)
  const lower = loft(jaw, owl ? '#af702e' : '#df8c30', [0, 0, 0], [
    [-0.098, 0.064, 0.105, 0.09], [-0.066, 0.142, 0.17, 0.105],
    [0.002, 0.168, 0.195, 0.119], [0.025, 0.145, 0.178, 0.12],
  ], 12)
  if (owl) lower.scale.set(0.63, 0.86, 0.91)
  oval(jaw, '#87464a', [0, 0.02, 0.122], [owl ? 0.112 : 0.14, 0.017, 0.17])
  loft(head, owl ? '#d9a34a' : '#f6b345', [0, 0, 0], owl ? [
    [-0.224, 0.018, 0.027, 0.702], [-0.121, 0.093, 0.11, 0.652],
    [-0.019, 0.141, 0.144, 0.611], [0.064, 0.105, 0.123, 0.583],
    [0.104, 0.041, 0.063, 0.554],
  ] : [
    [-0.145, 0.031, 0.045, 0.709], [-0.086, 0.184, 0.216, 0.53],
    [-0.04, 0.203, 0.224, 0.509], [0.047, 0.156, 0.172, 0.494],
    [0.095, 0.066, 0.098, 0.477],
  ], 12)
}

function chicken(rig: AnimalRig, fur: string) {
  const { head, eyes } = rig
  loft(head, fur, [0, 0, 0], [
    [-0.61, 0.3, 0.29, -0.09], [-0.48, 0.49, 0.408, -0.074],
    [-0.25, 0.645, 0.518, -0.035], [-0.019, 0.676, 0.547, -0.023],
    [0.214, 0.596, 0.53, -0.012], [0.436, 0.501, 0.444, -0.036],
    [0.597, 0.348, 0.317, -0.048], [0.66, 0.147, 0.191, -0.041],
  ])
  // One fleshy comb sweeps back and leans to the side at its three scallops.
  plumage(head, '#d74737', [-0.015, 0.664, 0.205], [
    [-0.25, 0.558, 0.189], [-0.232, 0.748, 0.179], [-0.178, 0.843, 0.142],
    [-0.115, 0.851, 0.106], [-0.075, 0.753, 0.078], [-0.026, 0.918, 0.029],
    [0.044, 0.98, -0.02], [0.109, 0.937, -0.052], [0.106, 0.806, -0.087],
    [0.205, 0.887, -0.157], [0.267, 0.859, -0.201], [0.269, 0.721, -0.234],
    [0.189, 0.591, -0.236], [0.052, 0.553, -0.155], [-0.135, 0.532, 0.091],
  ])
  for (const s of [-1, 1]) {
    const watt = loft(head, s < 0 ? '#d85543' : '#e1634e', [s * 0.074, -0.215, 0.417], [
      [-0.15, 0.028, 0.043, 0.025], [-0.109, 0.08, 0.068, 0.033],
      [-0.012, 0.091, 0.082, 0.028], [0.093, 0.063, 0.072, 0.002],
      [0.147, 0.039, 0.044, -0.021],
    ], 9)
    watt.rotation.z = s * 0.12
    eyes.push(eye(head, [s * 0.308, 0.136, 0.447], 0.117))
  }
  bill(rig, false)
}

function owl(rig: AnimalRig, fur: string, bib: string) {
  const { head, ears, eyes } = rig
  // Continuous contours from nape to face. Both cheeks meet under the bill;
  // the painted disk dips between the eyes and rises over each brow.
  function contour(right: V[]): V[] {
    const left = right.map(([x, y, z]): V => [-x, y, z])
    return [...left, ...right.slice(1, -1).reverse()]
  }
  const skull = contour([
    [0, 0.659, -0.09], [0.203, 0.64, -0.103], [0.421, 0.585, -0.13],
    [0.613, 0.484, -0.124], [0.762, 0.324, -0.091], [0.833, 0.111, -0.064],
    [0.823, -0.067, -0.052], [0.753, -0.234, -0.067], [0.569, -0.401, -0.078],
    [0.333, -0.505, -0.072], [0, -0.548, -0.065],
  ])
  const face = contour([
    [0, 0.176, 0.558], [0.144, 0.279, 0.531], [0.351, 0.395, 0.445],
    [0.534, 0.396, 0.335], [0.677, 0.311, 0.217], [0.737, 0.147, 0.16],
    [0.753, -0.041, 0.131], [0.668, -0.19, 0.249], [0.507, -0.32, 0.333],
    [0.29, -0.405, 0.387], [0, -0.423, 0.437],
  ])
  const nape = skull.map(([x, y, z]): V => [x * 0.83, y * 0.85, z - 0.266])
  const back = nape.map(([x, y, z]): V => [x * 0.49, y * 0.52, z - 0.158])
  const crown = skull.map(([x, y, z], i): V => [
    x * 0.56 + face[i][0] * 0.41, y * 0.52 + face[i][1] * 0.48 + 0.046,
    z * 0.32 + face[i][2] * 0.68,
  ])
  const muzzle = face.map(([x, y, z]): V => [x * 0.57, y * 0.65 - 0.036, z * 0.55 + 0.321])
  const bridge = muzzle.map(([x, y, z]): V => [x * 0.24, y * 0.54, z * 0.16 + 0.524])
  skin(head, [back, nape, skull, crown, face, muzzle, bridge], (row, sector) => {
    if (row >= 4) return bib
    const column = Math.min(sector, skull.length - 1 - sector)
    return row === 3 && column <= 2 ? '#a57752' : fur
  })
  for (const [i, s] of [-1, 1].entries()) {
    const ear = ears[i]
    ear.position.set(s * 0.47, 0.385, -0.067)
    plumage(ear, '#80553e', [s * 0.071, 0.128, 0.116], [
      [-s * 0.248, 0.076, 0.035], [s * 0.012, 0.262, -0.026],
      [s * 0.271, 0.439, -0.061], [s * 0.253, 0.251, -0.025],
      [s * 0.19, 0.082, 0.02], [s * 0.221, 0.11, -0.042],
      [s * 0.135, -0.086, -0.016], [-s * 0.106, -0.135, 0.041],
    ])
    const gaze = eye(head, [s * 0.31, 0.105, 0.507], 0.163, '#b18245')
    gaze.blink.parent!.rotation.y = s * 0.38
    eyes.push(gaze)
  }
  bill(rig, true)
}

function coil(body: T.Object3D, base: string, underside: string) {
  const path: V[] = [
    [0.829, -0.619, 0.099], [0.784, -0.829, 0.366], [0.341, -0.945, 0.503],
    [-0.26, -0.953, 0.476], [-0.669, -0.899, 0.228], [-0.734, -0.844, -0.187],
    [-0.443, -0.787, -0.406], [0.093, -0.746, -0.381], [0.511, -0.703, -0.178],
    [0.53, -0.673, 0.139], [0.293, -0.608, 0.32], [-0.087, -0.529, 0.293],
    [-0.311, -0.398, 0.164], [-0.338, -0.191, 0.043], [-0.237, 0.02, -0.042],
    [-0.119, 0.217, -0.037], [0.054, 0.363, 0.059],
  ]
  const curve = new T.CatmullRomCurve3(path.map((p) => new T.Vector3(...p)))
  // The pale ventral strip follows the underside of each coil, then turns
  // forward on the rising neck, all on a single continuous skin.
  const sections = Array.from({ length: 57 }, (_, row) => {
    const t = row / 56
    const center = curve.getPointAt(t), tangent = curve.getTangentAt(t)
    const upright = T.MathUtils.smoothstep(t, 0.71, 0.88)
    const ventral = new T.Vector3(0, upright - 1, upright)
    ventral.addScaledVector(tangent, -ventral.dot(tangent)).normalize()
    const side = new T.Vector3().crossVectors(tangent, ventral)
    const radius = 0.233 * Math.min(1, 0.055 + t * 3.6)
    return Array.from({ length: 12 }, (_, i) => {
      const a = i * Math.PI / 6
      return center.clone().addScaledVector(ventral, Math.cos(a) * radius)
        .addScaledVector(side, Math.sin(a) * radius).toArray()
    })
  })
  skin(body, sections, (row, sector) => {
    if (sector < 2 || sector >= 10) return underside
    const dorsal = Math.abs(sector - 5.5)
    const stripe = Math.abs(row % 8 - 3.5)
    return stripe + dorsal * 0.48 < 1.85 ? '#598e70' : base
  })
}

function snake(rig: AnimalRig, fur: string, bib: string) {
  const { body, head, eyes, jaw, tongue } = rig
  head.position.set(0.039, 0.323, 0.047)
  coil(body, fur, bib)
  // Sections run along the snout. Raised orbital ridges taper into a low
  // nasal bridge; the underside of this same outline fits the lower jaw.
  const profile = [
    [-0.494, 0.162, 0.136, -0.078], [-0.367, 0.439, 0.273, -0.124],
    [-0.183, 0.638, 0.344, -0.164], [0.049, 0.679, 0.363, -0.17],
    [0.268, 0.609, 0.327, -0.154], [0.419, 0.513, 0.223, -0.118],
    [0.557, 0.391, 0.111, -0.104], [0.686, 0.257, 0.058, -0.099],
    [0.743, 0.117, -0.002, -0.085],
  ]
  const sections = profile.map(([z, width, top, bottom]) =>
    Array.from({ length: 20 }, (_, i): V => {
      const a = i * Math.PI / 10, h = Math.sin(a), w = Math.cos(a)
      const ridge = Math.exp(-(((z - 0.27) / 0.26) ** 2)) * Math.sin(2 * a) ** 2
      const mouth = -0.032 + w ** 2 * 0.035
      return [width * w, h > 0 ? mouth + h * (top - mouth) + 0.069 * ridge : mouth - h * (bottom - mouth), z]
    }),
  )
  skin(head, sections, (row, sector) => {
    const flank = Math.min(sector + 0.5, Math.abs(sector - 9.5), 19.5 - sector)
    return row >= 1 && row <= 4 && flank < 1.6 ? '#51876c' : fur
  })
  jaw.position.set(0, -0.083, -0.061)
  const mandible = profile.map(([z, width, , bottom]) =>
    Array.from({ length: 20 }, (_, i): V => {
      const a = i * Math.PI / 10, h = Math.sin(a), w = 0.89 * Math.cos(a)
      const mouth = -0.032 + w ** 2 * 0.035
      const floor = mouth + Math.sqrt(1 - w * w) * (bottom - mouth)
      const lip = floor + 0.078 + h * (h > 0 ? 0.024 : 0.078)
      return [width * w, lip, z + 0.049]
    }),
  )
  skin(jaw, mandible, (row, sector) =>
    row > 0 && row < profile.length - 2 && sector > 0 && sector < 9 ? '#ac7168' : bib)
  for (const s of [-1, 1]) {
    const gaze = eye(head, [s * 0.397, 0.19, 0.417], 0.113, '#c09152')
    gaze.blink.parent!.rotation.y = s * 0.47
    eyes.push(gaze)
    const nostril = oval(head, '#46755b', [s * 0.155, 0.016, 0.702], [0.028, 0.016, 0.02])
    nostril.rotation.y = s * 0.34
  }
  tongue.position.set(0, -0.105, 0.742)
  stroke(tongue, '#c95163', [0, 0, 0], [0, -0.066, 0.232], 0.022)
  for (const s of [-1, 1])
    stroke(tongue, '#c95163', [0, -0.066, 0.232], [s * 0.068, -0.119, 0.35], 0.012)
  tongue.scale.setScalar(0.01)
}

export function sculptBirdOrSnake(rig: AnimalRig, fur: string, bib: string) {
  if (rig.id === 'chicken') chicken(rig, fur)
  else if (rig.id === 'owl') owl(rig, fur, bib)
  else snake(rig, fur, bib)
}
