import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { avatarEntry, type AnimalId } from './manifest'
import './AvatarBadge.css'

const LiveAnimal = lazy(() => import('./LiveAnimal'))
class CanvasGuard extends Component<{ children: ReactNode }, { broken: boolean }> {
  state = { broken: false }
  static getDerivedStateFromError() {
    return { broken: true }
  }
  render() {
    return this.state.broken ? null : this.props.children
  }
}

export function AvatarBadge({
  id,
  live = false,
  selected = false,
  reduced = false,
}: {
  id: AnimalId
  live?: boolean
  selected?: boolean
  reduced?: boolean
}) {
  const [drawnId, setDrawnId] = useState<AnimalId | null>(null)
  const [lost, setLost] = useState(false)
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => setSystemReduced(media.matches)
    media.addEventListener('change', changed)
    return () => media.removeEventListener('change', changed)
  }, [])
  const active = live && !lost && !systemReduced && !reduced
  return (
    <span aria-hidden="true" className={`animal-badge${selected ? ' animal-selected' : ''}`}>
      <span className="animal-disk" />
      <span className="animal-cutout">
        <img
          alt=""
          src={avatarEntry(id).preview}
          draggable={false}
          style={{ visibility: active && drawnId === id ? 'hidden' : 'visible' }}
        />
        {active && (
          <CanvasGuard>
            <Suspense fallback={null}>
              <LiveAnimal id={id} onDraw={setDrawnId} onLost={setLost} />
            </Suspense>
          </CanvasGuard>
        )}
      </span>
    </span>
  )
}
