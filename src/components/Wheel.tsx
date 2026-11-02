import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Action, Footer, Title } from './ui'
export function Wheel({
  names,
  index,
  next,
  reduced,
}: {
  names: string[]
  index: number
  next: () => void
  reduced: boolean
}) {
  const { t } = useTranslation(),
    [done, finish] = useState(reduced)
  const angle = 360 / names.length
  useEffect(() => {
    const timer = setTimeout(() => finish(true), 1900)
    return () => clearTimeout(timer)
  }, [])
  const colors = ['#1479ff', '#b7daff', '#254ea0', '#78b3fa']
  return (
    <>
      <Title title={t('game:wheel')} sub={t('game:wheelSub')} />
      <div className="wheel-box">
        <i />
        <div
          className={'wheel ' + (reduced ? 'still' : '')}
          style={{
            background:
              'conic-gradient(' +
              names
                .map((_, i) => colors[i % 4] + ' ' + i * angle + 'deg ' + (i + 1) * angle + 'deg')
                .join(',') +
              ')',
            transform: 'rotate(' + (1440 - (index + 0.5) * angle) + 'deg)',
          }}
        >
          {names.map((v, i) => (
            <b
              key={i}
              aria-label={v}
              style={{ transform: 'rotate(' + (i + 0.5) * angle + 'deg) translateY(-82px)' }}
            >
              {i + 1}
            </b>
          ))}
        </div>
      </div>
      <ol className="legend">
        {names.map((name, i) => (
          <li key={i}>{name}</li>
        ))}
      </ol>
      {done && (
        <p className="note">
          {t('game:wheelResult')} · <b>{names[index]}</b>
        </p>
      )}
      <Footer>
        <Action onClick={next}>{t(done ? 'game:wheelDone' : 'game:wheelSkip')}</Action>
      </Footer>
    </>
  )
}
