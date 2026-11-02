import * as T from 'three'
import { avatarEntry, type AnimalId } from './manifest'

export function portraitCamera(id: AnimalId) {
  const { height, targetY } = avatarEntry(id).framing
  const half = height / 2
  const camera = new T.OrthographicCamera(-half, half, half, -half, 0.1, 30)
  camera.position.set(0, targetY + 0.52, 6)
  camera.lookAt(0, targetY, 0)
  camera.updateProjectionMatrix()
  return camera
}

export function studioLights() {
  const group = new T.Group()
  group.add(new T.HemisphereLight('#fffaf3', '#bdacb2', 1.04))
  const key = new T.DirectionalLight('#fff7ef', 2.6)
  key.position.set(3.4, 4.8, 3.6)
  key.castShadow = true
  Object.assign(key.shadow.camera, {
    left: -1.65,
    right: 1.65,
    top: 1.65,
    bottom: -1.65,
    near: 4,
    far: 12,
  })
  key.shadow.camera.updateProjectionMatrix()
  key.shadow.mapSize.set(512, 512)
  key.shadow.intensity = 0.52
  key.shadow.normalBias = 0.018
  key.shadow.bias = -0.00065
  const fill = new T.DirectionalLight('#e5edff', 0.56)
  fill.position.set(-3, 0.7, 4)
  const rim = new T.DirectionalLight('#fff2e1', 1.5)
  rim.position.set(-3, 4, -3)
  group.add(key, fill, rim)
  return group
}
