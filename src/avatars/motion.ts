import type { Object3D } from 'three'
import type { Clip } from './manifest'
import type { Rig } from './models'

export function animator(rig: Rig) {
  const { body, head, nose, jaw, ears, arms, eyes, tongue, feathers } = rig
  const joints: Object3D[] = [body, head, nose, jaw, ...ears, ...arms, tongue, ...feathers]
  const rest = joints.map((j) => ({
    p: j.position.clone(),
    r: j.rotation.clone(),
    s: j.scale.clone(),
  }))

  return (clip: Clip = 'idle', time = 0) => {
    joints.forEach((j, i) => {
      j.position.copy(rest[i].p)
      j.rotation.copy(rest[i].r)
      j.scale.copy(rest[i].s)
    })
    const t = Math.max(0, Math.min(1, time))
    const lift = Math.sin(Math.PI * t) ** 2
    const wave = Math.sin(Math.PI * 4 * t) * lift
    const flutter = (0.68 + 0.32 * Math.cos(Math.PI * 8 * t)) * lift
    let lid = 0
    body.position.y += 0.023 * lift
    switch (clip) {
      case 'blink':
        lid = Math.min(1, lift * 1.3)
        break
      case 'yawn':
        head.rotation.x -= lift * 0.195
        jaw.rotation.x += lift * 0.69
        jaw.position.y -= lift * 0.025
        lid = lift * 0.91
        break
      case 'select':
        body.position.y += lift * 0.06
        head.rotation.z += wave * 0.11
        break
      case 'earPerk':
      case 'earTwitch':
      case 'earFlick':
        ears[0].rotation.z += flutter * 0.28
        ears[1].rotation.x += wave * 0.2
        break
      case 'shoulderStretch':
      case 'wingStretch':
      case 'pawStretch':
        arms[0].rotation.z -= lift * (clip === 'wingStretch' ? 1.94 : 0.98)
        arms[1].rotation.z += lift * (clip === 'wingStretch' ? 1.94 : 0.48)
        head.rotation.z += lift * 0.105
        break
      case 'pawRub':
      case 'pawGroom':
        arms.forEach((arm, i) => {
          arm.rotation.x = -lift * 1.49
          arm.rotation.z = (i === 0 ? 1 : -1) * (0.75 * lift + 0.18 * wave)
          arm.position.y += lift * 0.13
        })
        head.rotation.x += 0.21 * lift
        break
      case 'noseWiggle':
      case 'noseTwitch':
      case 'noseSniff':
      case 'whiskerTwitch':
        nose.rotation.z += wave * 0.105
        nose.position.y += flutter * 0.046
        head.rotation.x -= 0.105 * lift
        break
      case 'headBob':
      case 'sleepyDip':
        head.position.y += clip === 'sleepyDip' ? -0.14 * lift : 0.13 * wave
        head.rotation.x += 0.27 * lift
        lid = clip === 'sleepyDip' ? lift * 0.78 : 0
        break
      case 'headScratch':
        arms[0].position.y += lift * 0.35
        arms[0].rotation.z -= lift * 2.93 + flutter * 0.16
        arms[0].scale.y += lift * 0.32
        head.rotation.z += lift * 0.15
        break
      case 'curiousGlance':
      case 'headTilt':
      case 'headTurn':
        head.rotation.y += lift * (clip === 'headTurn' ? 0.73 : 0.29)
        head.rotation.z += lift * (clip === 'headTilt' ? 0.24 : 0.09)
        break
      case 'pant':
        jaw.rotation.x += 0.6 * flutter
        jaw.position.y -= 0.05 * lift
        break
      case 'tongueFlick':
        tongue.scale.setScalar(0.01 + lift * 1.25)
        tongue.rotation.z = wave * 0.18
        head.rotation.y -= lift * 0.15
        break
      case 'coilSway':
      case 'headLift':
        head.position.y += lift * 0.12
        body.rotation.z += 0.14 * wave
        head.rotation.y -= 0.31 * lift
        break
      case 'featherRuffle':
        feathers.forEach((f, i) => {
          f.rotation.z += (i < 3 ? -1 : 1) * 0.48 * flutter
        })
        arms[0].rotation.z -= lift * 0.58
        arms[1].rotation.z += lift * 0.58
        break
    }
    for (const eye of eyes) {
      eye.blink.scale.y = Math.max(0.045, 1 - lid)
      eye.blink.visible = lid < 0.94
      eye.line.visible = lid >= 0.86
    }
    rig.updateMouth()
    rig.model.updateMatrixWorld(true)
  }
}
