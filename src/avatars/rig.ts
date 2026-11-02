import * as T from 'three'
import type { AnimalId } from './manifest'
import { group, oval, stroke, type V } from './sculpt'

const lenses = new Map<string, T.BufferGeometry>()
const lensMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.31 })

// Shape the iris and pupil on the same domed surface. A pale lower crescent
// and a brighter lower iris keep the gaze legible at player-card scale.
function eyeLens(iris: string) {
  const cached = lenses.get(iris)
  if (cached) return cached
  const points: number[] = [], colors: number[] = [], faces: number[] = []
  const dark = new T.Color('#15151c')
  const tint = new T.Color()
  const sides = 24
  function ring(radius: number, z: number, y: number, color: string, shade: number, offset = 0) {
    const start = points.length / 3
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides
      const h = Math.sin(angle)
      points.push(radius * Math.cos(angle) * (1 - 0.09 * h) + offset, 1.18 * radius * h + y, z)
      tint.set(color).lerp(dark, shade * (1 - ((1 - h) / 2) ** 2))
      colors.push(tint.r, tint.g, tint.b)
      if (start) {
        const a = start + i, b = start + (i + 1) % sides
        faces.push(a - sides, b - sides, a, b - sides, b, a)
      }
    }
  }
  ring(0.42, -0.36, 0, '#28242a', 0)
  ring(1, 0.02, 0, '#34292a', 0.7)
  ring(0.985, 0.14, 0, '#e7e2d8', 0.99)
  ring(0.91, 0.21, 0.06, '#e7e2d8', 0.99, -0.065)
  ring(0.90, 0.23, 0.06, '#312a2d', 0.65, -0.065)
  ring(0.85, 0.42, 0.065, iris, 0.83, -0.08)
  ring(0.68, 0.55, 0.08, iris, 0.90, -0.09)
  ring(0.66, 0.575, 0.08, '#18161a', 0, -0.09)
  ring(0.29, 0.69, 0.09, '#131319', 0, -0.09)
  const pole = points.length / 3
  points.push(-0.09, 0.09, 0.72)
  colors.push(dark.r, dark.g, dark.b)
  for (let i = 0; i < sides; i++) faces.push(pole - sides + i, pole - sides + (i + 1) % sides, pole)
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3))
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3))
  geometry.setIndex(faces)
  geometry.computeVertexNormals()
  lenses.set(iris, geometry)
  return geometry
}

export function eye(parent: T.Group, pos: V, size: number, iris = '#805a42') {
  const pivot = group(parent, ...pos)
  pivot.scale.setScalar(size)
  pivot.rotation.z = pos[0] * 0.25
  pivot.rotation.y = pos[0] * 0.52
  const blink = group(pivot)
  const lens = new T.Mesh(eyeLens(iris), lensMaterial)
  lens.scale.x = Math.sign(pos[0])
  blink.add(lens)
  const catchlight = oval(blink, '#fffaf1', [-0.22, 0.45, 0.66], [0.18, 0.21, 0.048], true)
  catchlight.castShadow = false
  const glint = oval(blink, '#cbc6bf', [0.34, -0.19, 0.64], [0.063, 0.073, 0.025], true)
  glint.castShadow = false
  const line = group(pivot)
  stroke(line, '#35292d', [-0.92, 0, 0.22], [0, -0.13, 0.61], 0.089)
  stroke(line, '#35292d', [0, -0.13, 0.61], [0.92, 0, 0.22], 0.089)
  line.visible = false
  return { blink, line }
}

export function createRig(id: AnimalId) {
  const model = new T.Group()
  const body = group(model)
  const head = group(body, 0, 0.28, 0.02)
  return {
    id, model, body, head,
    nose: group(head), jaw: group(head), tongue: group(head),
    ears: [group(head), group(head)], arms: [group(body), group(body)],
    eyes: [] as ReturnType<typeof eye>[], feathers: [] as T.Object3D[],
  }
}

export type AnimalRig = ReturnType<typeof createRig>
