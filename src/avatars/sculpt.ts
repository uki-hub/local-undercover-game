import * as T from 'three'

export type V = [number, number, number]
export const group = (parent: T.Object3D, x = 0, y = 0, z = 0) => {
  const g = new T.Group()
  g.position.set(x, y, z)
  parent.add(g)
  return g
}

// Staggered latitude rings give cheeks, shoulders and muzzles small triangular planes.
function facetedOrb(sides: number, rings: number) {
  const vertices: number[] = []
  const point = (j: number, i: number): V => {
    const index = i % sides
    const offset = j === 0 || j === rings ? 0 : 0.069 * Math.sin(index * 7.3 + j * 1.8)
    const phi = (Math.PI * j) / rings + offset
    const theta = ((index + (j % 2) * 0.43) * Math.PI * 2) / sides
    return [Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta)]
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < sides; i++) {
      const a = point(j, i),
        b = point(j, i + 1),
        c = point(j + 1, i),
        d = point(j + 1, i + 1)
      if (j !== 0) vertices.push(...a, ...c, ...b)
      if (j !== rings - 1) vertices.push(...b, ...c, ...d)
    }
  }
  const orb = geometry(vertices)
  const normal = orb.attributes.normal
  const n = new T.Vector3(),
    v = new T.Vector3()
  for (let i = 0; i < normal.count; i++) {
    n.fromBufferAttribute(normal, i)
      .lerp(v.fromBufferAttribute(orb.attributes.position, i).normalize(), 0.28)
      .normalize()
    normal.setXYZ(i, n.x, n.y, n.z)
  }
  return orb
}

export function geometry(points: number[]) {
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3))
  geometry.computeVertexNormals()
  return geometry
}

const stone = facetedOrb(14, 9)
const polished = new T.SphereGeometry(1, 20, 14)
const whisker = new T.CylinderGeometry(1, 1, 1, 5, 1)
const materials = new Map<string, T.MeshStandardMaterial>()

function material(color: string, glossy = false) {
  const key = color + (glossy ? '+' : '')
  let mat = materials.get(key)
  if (!mat) {
    mat = new T.MeshStandardMaterial({ color, roughness: glossy ? 0.26 : 0.91, metalness: 0 })
    materials.set(key, mat)
  }
  return mat
}

export function part(
  parent: T.Object3D,
  geo: T.BufferGeometry,
  color: string,
  pos: V,
  size: V,
  glossy = false,
) {
  const m = new T.Mesh(geo, material(color, glossy))
  m.castShadow = true
  m.receiveShadow = true
  m.position.set(...pos)
  m.scale.set(...size)
  parent.add(m)
  return m
}

export function oval(parent: T.Object3D, color: string, pos: V, size: V, glossy = false) {
  return part(parent, glossy ? polished : stone, color, pos, size, glossy)
}

const paintedCoat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.87 })

// Bridge successive contours, in counterclockwise order when viewed from the
// last ring. Coat boundaries follow the surface even when a joint rotates.
export function skin(
  parent: T.Object3D,
  rings: V[][],
  color: (band: number, sector: number) => string,
) {
  const count = rings[0].length
  const points = rings.flat()
  const faces: number[] = []
  const colors: number[] = []
  const tint = new T.Color()
  function face(a: number, b: number, c: number, shade: string) {
    faces.push(a, b, c)
    tint.set(shade)
    for (let n = 0; n < 3; n++) colors.push(tint.r, tint.g, tint.b)
  }
  for (let row = 0; row < rings.length - 1; row++) {
    for (let i = 0; i < count; i++) {
      const a = row * count + i
      const b = row * count + (i + 1) % count
      const shade = color(row, i)
      face(a, b, b + count, shade)
      face(a, b + count, a + count, shade)
    }
  }
  for (const row of [0, rings.length - 1]) {
    const center = new T.Vector3()
    for (const [x, y, z] of rings[row]) {
      center.x += x
      center.y += y
      center.z += z
    }
    const cap = points.push(center.divideScalar(count).toArray()) - 1
    for (let i = 0; i < count; i++) {
      const a = row * count + i
      const b = row * count + (i + 1) % count
      face(cap, row ? a : b, row ? b : a, color(Math.max(0, row - 1), i))
    }
  }
  const indexed = new T.BufferGeometry()
  indexed.setAttribute('position', new T.Float32BufferAttribute(points.flat(), 3))
  indexed.setIndex(faces)
  indexed.computeVertexNormals()
  const planes = indexed.toNonIndexed()
  indexed.dispose()
  const rounded = planes.getAttribute('normal').clone()
  planes.computeVertexNormals()
  const normals = planes.getAttribute('normal')
  const normal = new T.Vector3(), smooth = new T.Vector3()
  for (let i = 0; i < normals.count; i++) {
    normal.fromBufferAttribute(normals, i)
      .lerp(smooth.fromBufferAttribute(rounded, i), 0.38).normalize()
    normals.setXYZ(i, normal.x, normal.y, normal.z)
  }
  planes.setAttribute('color', new T.Float32BufferAttribute(colors, 3))
  const mesh = new T.Mesh(planes, paintedCoat)
  mesh.castShadow = mesh.receiveShadow = true
  mesh.userData.ownedGeometry = true
  parent.add(mesh)
  return mesh
}

type Section = [y: number, width: number, depth: number, centerZ: number]

// Varying elliptical cross sections shape the jaw, brow or shoulder line.
// The optional bib follows the front of each section without a second shell.
export function loft(
  parent: T.Object3D,
  color: string,
  pos: V,
  rings: Section[],
  sides = 16,
  bib?: { color: string; angles: number[] },
) {
  const bibPanels = Math.max(1, Math.round(sides / 8))
  const halfBib = (2 * Math.PI * bibPanels) / sides
  const contours = rings.map(([y, width, depth, z], row) =>
    Array.from({ length: sides }, (_, i): V => {
      let angle = ((i > sides / 2 ? i - sides : i) * 2 * Math.PI) / sides
      // Stagger neighboring cheek planes while retaining left/right symmetry.
      const stagger = row % 2 ? 1 : -0.7
      angle += Math.sin(2 * angle) * 0.055 * stagger
      if (bib) {
        const boundary = bib.angles[row]
        const u = Math.abs(angle)
        angle = Math.sign(angle) * (u <= halfBib
          ? (u / halfBib) * boundary
          : boundary + ((u - halfBib) / (Math.PI - halfBib)) * (Math.PI - boundary))
      }
      const gap = Math.min(y - (rings[row - 1]?.[0] ?? y), (rings[row + 1]?.[0] ?? y) - y)
      const rise = gap * 0.26 * stagger * Math.cos(2 * angle)
      return [width * Math.sin(angle), y + rise, z + depth * Math.cos(angle)]
    }),
  )
  const mesh = skin(parent, contours, (_, i) =>
    bib && (i < bibPanels || i >= sides - bibPanels) ? bib.color : color)
  mesh.position.set(...pos)
  return mesh
}

export function stroke(parent: T.Object3D, color: string, a: V, b: V, width: number) {
  const start = new T.Vector3(...a),
    end = new T.Vector3(...b)
  const delta = end.clone().sub(start)
  const m = part(parent, whisker, color, start.clone().lerp(end, 0.5).toArray(), [
    width,
    delta.length(),
    width,
  ])
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize())
  m.castShadow = false
  return m
}

export function cleanModel(model: T.Object3D) {
  model.traverse((obj) => {
    if (obj instanceof T.Mesh && obj.userData.ownedGeometry) obj.geometry.dispose()
  })
}
