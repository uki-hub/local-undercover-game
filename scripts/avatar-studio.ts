// Development capture entry, served only by avatar-capture.mjs.
import * as T from 'three'
import {
  ANIMALS,
  avatarEntry,
  speciesClips,
  type AnimalId,
  type Clip,
} from '../src/avatars/manifest'
import { makeAnimal } from '../src/avatars/models'
import { animator } from '../src/avatars/motion'
import { portraitCamera, studioLights } from '../src/avatars/studio'
import labels from '../src/locales/id/avatars.json'

const gl = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
gl.outputColorSpace = T.SRGBColorSpace
gl.toneMapping = T.NoToneMapping
gl.shadowMap.enabled = true
gl.shadowMap.type = T.PCFSoftShadowMap
gl.setSize(416, 416)
gl.setClearColor(0, 0)
const scene = new T.Scene()
scene.add(studioLights())
const puppets = Object.fromEntries(
  ANIMALS.map((id) => {
    const rig = makeAnimal(id)
    return [id, { rig, update: animator(rig), camera: portraitCamera(id) }]
  }),
)

function render(id: AnimalId, clip: Clip = 'idle', t = 0) {
  const { rig, update, camera } = puppets[id]
  update(clip, t)
  scene.add(rig.model)
  gl.render(scene, camera)
  scene.remove(rig.model)
  return gl.domElement
}

export function portraits() {
  return ANIMALS.map((id) => ({ id, url: render(id).toDataURL('image/webp', 0.96) }))
}

const sheet = document.createElement('canvas')
sheet.width = 960
sheet.height = 438
const ctx = sheet.getContext('2d')!

export function contact(clip: 'idle' | 'blink' | 'yawn' | 'species', t: number) {
  ctx.fillStyle = '#eef4f9'
  ctx.fillRect(0, 0, sheet.width, sheet.height)
  for (const [i, id] of ANIMALS.entries()) {
    const size = 172,
      x = 10 + (i % 5) * 192,
      y = 9 + Math.floor(i / 5) * 216
    const a = clip === 'species' ? speciesClips[id][0] : clip
    const neutral = render(id, a, t)
    const center = x + size / 2,
      cy = y + size * 0.54,
      radius = size * 0.46
    ctx.save()
    ctx.beginPath()
    ctx.arc(center, cy, radius, 0, 2 * Math.PI)
    const shade = ctx.createLinearGradient(x, y, x + size, y + size)
    shade.addColorStop(0, '#deebf5')
    shade.addColorStop(1, '#a3b7cc')
    ctx.fillStyle = shade
    ctx.fill()
    ctx.beginPath()
    ctx.rect(x, y, size, size * 0.54)
    ctx.arc(center, cy, radius, 0, Math.PI)
    ctx.clip()
    ctx.drawImage(neutral, x, y, size, size)
    ctx.restore()
    ctx.font = 'bold 19px system-ui'
    ctx.fillStyle = '#17223d'
    ctx.textAlign = 'center'
    ctx.fillText(labels[id], center, y + size + 26)
  }
  return sheet.toDataURL('image/webp', 0.92)
}

export function audit() {
  const metrics: { id: AnimalId; triangles: number; calls: number; clips: number }[] = []
  const gpu = gl.getContext()
  gl.setSize(288, 288)
  const times: number[] = []
  const topEdge = new Uint8Array(288 * 4)
  const clipped = new Set<string>()
  for (const id of ANIMALS) {
    const baseline = render(id).toDataURL()
    for (const clip of avatarEntry(id).clips) {
      const frame = render(id, clip, 0.5).toDataURL()
      if (frame === baseline) throw Error(id + ' unchanged at midpoint ' + clip)
      for (const t of [0.25, 0.5, 0.75]) {
        render(id, clip, t)
        gpu.readPixels(0, 287, 288, 1, gpu.RGBA, gpu.UNSIGNED_BYTE, topEdge)
        if (topEdge.some((c, i) => i % 4 === 3 && c > 20)) clipped.add(id + '/' + clip)
      }
      const restored = render(id, clip, 1).toDataURL()
      if (restored !== baseline) throw Error(id + ' failed to restore ' + clip)
    }
    metrics.push({
      id,
      triangles: gl.info.render.triangles,
      calls: gl.info.render.calls,
      clips: avatarEntry(id).clips.length,
    })
    const pixel = new Uint8Array(4)
    gpu.readPixels(144, 144, 1, 1, gpu.RGBA, gpu.UNSIGNED_BYTE, pixel)
    const start = performance.now()
    for (let i = 0; i < 4; i++) render(id, 'yawn', i / 4)
    gpu.readPixels(144, 144, 1, 1, gpu.RGBA, gpu.UNSIGNED_BYTE, pixel)
    times.push((performance.now() - start) / 4)
  }
  gl.setSize(416, 416)
  if (clipped.size) throw Error('Badge top clipped: ' + [...clipped].join(', '))
  const debug = gpu.getExtension('WEBGL_debug_renderer_info')
  return {
    metrics,
    meanFrameMs: times.reduce((a, b) => a + b) / times.length,
    renderer: debug
      ? gpu.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : gpu.getParameter(gpu.RENDERER),
  }
}
