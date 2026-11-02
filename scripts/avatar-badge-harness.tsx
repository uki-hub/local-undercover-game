// Mounted only by the local capture script. Exercise the exact React/Fiber badge path.
import { createRoot } from 'react-dom/client'
import { AvatarBadge } from '../src/avatars/AvatarBadge'
import type { AnimalId } from '../src/avatars/manifest'

export function mountHarness() {
  document.body.style.cssText = 'margin:0;min-height:1800px;background:#f2f6fa'
  const frame = document.createElement('div')
  frame.style.cssText = 'width:240px;margin:16px'
  document.body.append(frame)
  const root = createRoot(frame)
  const show = (id: AnimalId, reduced = false, key = 'editor') =>
    root.render(<AvatarBadge key={key} id={id} selected live reduced={reduced} />)
  show('cat')
  return { show }
}
