import { Component, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { NoToneMapping, SRGBColorSpace } from 'three'
import { commonClips, speciesClips, type AnimalId, type Clip } from './manifest'
import { makeAnimal } from './models'
import { cleanModel } from './sculpt'
import { animator } from './motion'
import { portraitCamera, studioLights } from './studio'

interface Props {
  id: AnimalId
  onDraw: (id: AnimalId | null) => void
  onLost: (lost: boolean) => void
}

function Puppet({ id, onDraw, onLost }: Props) {
  const { gl, invalidate } = useThree()
  const rig = useMemo(() => makeAnimal(id), [id])
  const pose = useMemo(() => animator(rig), [rig])
  const active = useRef<{ clip: Clip; start: number; length: number } | null>(null)
  const painted = useRef(false)
  useLayoutEffect(() => {
    painted.current = false
    onDraw(null)
    return () => {
      cleanModel(rig.model)
      onDraw(null)
    }
  }, [rig, onDraw])
  useEffect(() => {
    const canvas = gl.domElement
    let timer = 0
    let onscreen = true
    let previous: Clip = 'select'
    const allowed = () => onscreen && !document.hidden
    const play = (clip: Clip) => {
      if (!allowed()) return
      previous = clip
      active.current = {
        clip,
        start: performance.now(),
        length: clip === 'blink' ? 320 : clip === 'select' ? 550 : 1480,
      }
      invalidate()
    }
    const schedule = () => {
      window.clearTimeout(timer)
      if (!allowed()) return
      timer = window.setTimeout(
        () => {
          const choices = [
            ...commonClips.filter((c) => c !== 'select'),
            ...speciesClips[id],
          ].filter((c) => c !== previous)
          play(choices[Math.floor(Math.random() * choices.length)])
          schedule()
        },
        5000 + Math.random() * 7000,
      )
    }
    const reset = () => {
      active.current = null
      pose('idle', 0)
      schedule()
      if (allowed()) invalidate()
    }
    const observer = new IntersectionObserver((entries) => {
      onscreen = entries[0].isIntersecting
      if (!onscreen || !active.current) reset()
    })
    const react = () => play('select')
    const lose = (e: Event) => {
      e.preventDefault()
      onLost(true)
    }
    const control = canvas.closest('button') ?? canvas.closest('.animal-badge')?.parentElement
    observer.observe(canvas)
    control?.addEventListener('pointerdown', react)
    canvas.addEventListener('webglcontextlost', lose)
    document.addEventListener('visibilitychange', reset)
    play('select')
    schedule()
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
      control?.removeEventListener('pointerdown', react)
      canvas.removeEventListener('webglcontextlost', lose)
      document.removeEventListener('visibilitychange', reset)
      active.current = null
    }
  }, [gl, id, invalidate, onLost, pose])
  useFrame(() => {
    if (!painted.current) {
      painted.current = true
      onDraw(id)
    }
    const current = active.current
    if (!current || document.hidden) return
    const progress = (performance.now() - current.start) / current.length
    pose(current.clip, progress)
    if (progress < 1) invalidate()
    else active.current = null
  })
  return <primitive object={rig.model} dispose={null} />
}

class RendererGuard extends Component<
  { onLost: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onLost()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function Display({ player }: { player: Props | null }) {
  const id = player?.id ?? 'cat'
  const camera = useMemo(() => Object.assign(portraitCamera(id), { manual: true }), [id])
  const lights = useMemo(studioLights, [])
  return (
    <RendererGuard onLost={() => player?.onLost(true)}>
      <Canvas
        camera={camera}
        shadows="soft"
        frameloop="demand"
        dpr={[1, 1.5]}
        fallback={null}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
          toneMapping: NoToneMapping,
          outputColorSpace: SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = NoToneMapping
          gl.setClearColor(0x000000, 0)
        }}
      >
        <primitive object={lights} dispose={null} />
        {player && <Puppet {...player} />}
      </Canvas>
    </RendererGuard>
  )
}

// The single canvas travels between featured badges. Detached views retain no scene or idle timers.
let display: { host: HTMLDivElement; root: Root } | undefined
let unavailable = false
export default function LiveAnimal({ id, onDraw, onLost }: Props) {
  const slot = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const container = slot.current
    if (!container) return
    if (unavailable) {
      onLost(true)
      return
    }
    if (!display) {
      const host = document.createElement('div')
      host.className = 'animal-live'
      display = { host, root: createRoot(host) }
    }
    const { host, root } = display
    container.append(host)
    const lost = () => {
      unavailable = true
      onLost(true)
    }
    root.render(<Display player={{ id, onDraw, onLost: lost }} />)
    return () => {
      if (host.parentElement !== container) return
      host.remove()
      root.render(<Display player={null} />)
    }
  }, [id, onDraw, onLost])
  return <div className="animal-live" ref={slot} />
}
