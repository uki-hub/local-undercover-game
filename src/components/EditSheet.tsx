import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

// Nonmodal: the app header and setup steps remain available; the roster is replaced.
export function EditSheet({ title, cancel, children }: { title: string; cancel: () => void; children: ReactNode }) {
  const { t } = useTranslation()
  const id = useId(), ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const sheet = ref.current
    sheet?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
    return () => {
      if (sheet?.contains(document.activeElement) && previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  return <div ref={ref} className="edit-sheet" role="dialog" aria-labelledby={id}
    onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); cancel() } }}>
    <div className="sheet-heading"><h1 id={id}>{title}</h1><button className="round-button" onClick={cancel} aria-label={t('close')}>×</button></div>
    {children}
  </div>
}
