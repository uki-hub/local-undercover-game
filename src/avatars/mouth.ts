import * as T from 'three'
import type { AnimalId } from './manifest'
import type { AnimalRig } from './rig'

// Center of the upper lip, half-width, and reach of the lower lip from its hinge.
const lips: Record<AnimalId, [y: number, z: number, width: number, reach: number]> = {
  cat: [-0.24, 0.72, 0.185, 0.40],
  bear: [-0.24, 0.80, 0.195, 0.47],
  raccoon: [-0.24, 0.80, 0.185, 0.48],
  pig: [-0.23, 0.645, 0.19, 0.38],
  monkey: [-0.236, 0.67, 0.20, 0.36],
  dog: [-0.24, 0.765, 0.205, 0.37],
  rat: [-0.225, 0.785, 0.13, 0.33],
  owl: [-0.13, 0.67, 0.085, 0.21],
  chicken: [-0.106, 0.686, 0.135, 0.25],
  snake: [-0.105, 0.54, 0.39, 0.66],
}

const lining = new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide })

// The soft mouth lining spans the fixed upper lip and the hinged jaw. Keep the
// cheeks connected during a yawn, including on long snouts viewed in profile.
export function articulateMouth({ id, head, jaw }: AnimalRig) {
  const [y, z, width, reach] = lips[id]
  const upper: T.Vector3[] = [], lower: T.Vector3[] = []
  const colors: number[] = [], faces: number[] = []
  const columns = 9
  const rows = ['#452a30', '#4c2d34', '#72434a']
  for (let col = 0; col < columns; col++) {
    const u = 2 * col / (columns - 1) - 1
    upper.push(new T.Vector3(u * width, y + 0.018 * u * u, z - width * 0.62 * u * u))
    lower.push(new T.Vector3(u * width * 0.87, -0.014, reach * 0.55 - width * 0.21 * u * u))
  }
  for (const [row, hex] of rows.entries()) {
    const color = new T.Color(hex)
    for (let col = 0; col < columns; col++) {
      colors.push(color.r, color.g, color.b)
      if (row && col) {
        const i = row * columns + col
        faces.push(i - columns - 1, i - 1, i, i - columns - 1, i, i - columns)
      }
    }
  }
  const points = new T.Float32BufferAttribute(rows.length * columns * 3, 3)
  points.setUsage(T.DynamicDrawUsage)
  const geometry = new T.BufferGeometry()
  geometry.setIndex(faces)
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('position', points)
  const mouth = new T.Mesh(geometry, lining)
  mouth.userData.ownedGeometry = true
  mouth.frustumCulled = false
  mouth.visible = false
  head.add(mouth)
  const bottom = new T.Vector3(), p = new T.Vector3()
  return () => {
    mouth.visible = jaw.rotation.x > 0.035
    if (!mouth.visible) return
    jaw.updateMatrix()
    for (let col = 0; col < columns; col++) {
      bottom.copy(lower[col]).applyMatrix4(jaw.matrix)
      for (let row = 0; row < rows.length; row++) {
        p.lerpVectors(upper[col], bottom, row / (rows.length - 1))
        if (row === 1) p.z -= width * 0.29
        points.setXYZ(row * columns + col, p.x, p.y, p.z)
      }
    }
    points.needsUpdate = true
  }
}
