import { useCallback, useEffect, useState } from 'react'
import { MotionConfig, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Action, Footer, Icon, Portrait, Title } from './components/ui'
import { Config, Customs, Roster, SetupNav, type SetupStep } from './screens/Setup'
import { MatchScreen } from './screens/Match'
import { useGame } from './store/session'
import { wordPool, loadPack, type Pack } from './content/words'
import manifest from './locales/manifest.json'
import { enabled, localeFor } from './i18n'
import { useOffline } from './services/offline'
import { useStorageStatus } from './services/storage'
import { matchTheme } from './components/EventScene'
import './components/events.css'

type Screen = 'home' | SetupStep | 'match'
type Panel = 'settings' | 'rules' | 'custom' | 'guide' | null
export function App() {
  const { t, i18n } = useTranslation()
  const [screen, go] = useState<Screen>('home'),
    [panel, show] = useState<Panel>(null)
  const [rulesFrom, returnRulesTo] = useState<Panel>(null)
  function rules(from: Panel) {
    returnRulesTo(from)
    show('rules')
  }
  const [pack, setPack] = useState<Pack | null>(null),
    [loading, setLoading] = useState(true)
  const { profile, match, update, launch, clear, resetScores } = useGame()
  const storageFailed = useStorageStatus((s) => s.failed)
  const [guideStep, guideTo] = useState(0)
  const guideSteps = t('game:guideSteps', { returnObjects: true }) as { title: string; body: string }[]
  const offline = useOffline(),
    systemMotion = useReducedMotion(),
    reduced = !!systemMotion || profile.reduced
  const [attempt, retry] = useState(0)
  const lang = localeFor(profile.uiLocale)
  useEffect(() => {
    void i18n.changeLanguage(lang)
    document.documentElement.lang = lang
  }, [i18n, lang])
  const locale =
    manifest.wordPacks.find((p) => p.locale === profile.wordLocale) ?? manifest.wordPacks[0]
  useEffect(() => {
    let active = true
    setPack(null)
    setLoading(true)
    loadPack(locale.locale, locale.path)
      .then((p) => {
        if (active) setPack(p)
      })
      .catch(() => {
        if (active) setPack(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [locale, attempt])
  const loadAgain = () => retry((n) => n + 1)
  let rematchIssue: string | null = null
  if (match?.winner) {
    if (!pack) rematchIssue = loading ? 'game:waiting' : 'errors.pack'
    else if (!wordPool(pack, profile.custom[pack.locale] || [], match.settings).length)
      rematchIssue = 'errors.pool'
  }
  const start = () => {
    if (pack) {
      launch(pack)
      show(null)
      go('match')
    }
  }
  const abandon = () => {
    clear()
    show(null)
    go('roster')
  }
  const back = useCallback(() => {
    if (panel === 'rules') show(rulesFrom)
    else if (panel === 'custom') show('settings')
    else if (panel) show(null)
    else if (screen === 'timers') go('words')
    else if (screen === 'words') go('roles')
    else if (screen === 'roles') go('roster')
    else if (screen === 'roster') go('home')
  }, [panel, screen, rulesFrom])
  useEffect(() => {
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape' && panel) back()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [panel, back])
  const current = panel ?? screen,
    key = current === 'match' ? match?.id + '-' + match?.revision : current
  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector('main')?.focus({ preventScroll: true })
  }, [key])
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <main
        tabIndex={-1}
        className={'phone ' + (reduced ? 'reduce' : '')}
        data-screen={current}
        data-theme={current === 'match' && match ? matchTheme(match) : undefined}
        onClickCapture={(e) => {
          if (e.detail > 1) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        <header>
          <span className="brand" aria-label={t('brandFirst') + t('brandLast')}>
            {t('brandFirst')}
            <em>{t('brandLast')}</em>
          </span>
          <div className="header-right">
            {!panel &&
              screen === 'match' &&
              match &&
              !['intro', 'word', 'result'].includes(match.phase) && (
                <span className="pill">{t('game:round', { count: match.round })}</span>
              )}
            <button
              className="round-button"
              aria-label={t(panel ? 'back' : 'settings')}
              onClick={() => (panel ? back() : show('settings'))}
            >
              <Icon name={panel ? 'back' : 'gear'} />
            </button>
          </div>
        </header>
        {storageFailed && <p className="storage-warning" role="status">{t('storageWarning')}</p>}
        <p className="landscape">{t('landscape')}</p>
        <motion.div
          className={'screen ' + current}
          key={key}
          initial={reduced ? false : { opacity: 0.8, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
        >
          {!panel && (screen === 'roster' || screen === 'roles' || screen === 'words' || screen === 'timers') && (
            <SetupNav step={screen} go={go} />
          )}
          {panel === 'guide' ? (
            <>
              <Title title={t('game:guide')} tag={t('game:guideProgress', { current: guideStep + 1, total: guideSteps.length })} />
              <section><h2>{guideSteps[guideStep].title}</h2><p>{guideSteps[guideStep].body}</p></section>
              <Footer>
                <Action onClick={() => {
                  if (guideStep < guideSteps.length - 1) guideTo(guideStep + 1)
                  else { show(null); go(match ? 'match' : 'roster') }
                }}>{t(guideStep < guideSteps.length - 1 ? 'next' : match ? 'game:resume' : 'game:start')}</Action>
                <Action secondary onClick={guideStep ? () => guideTo(guideStep - 1) : back}>{t('back')}</Action>
              </Footer>
            </>
          ) : panel === 'rules' ? (
            <>
              <Title title={t('rules:title')} />
              {(
                t('rules:sections', { returnObjects: true }) as { title: string; body: string }[]
              ).map((s) => (
                <section key={s.title}>
                  <h2>{s.title}</h2>
                  <p>{s.body}</p>
                </section>
              ))}
              <Footer>
                <Action onClick={back}>{t('back')}</Action>
              </Footer>
            </>
          ) : panel === 'custom' ? (
            <Customs back={back} pack={pack} />
          ) : panel === 'settings' ? (
            <>
              <Title title={t('settings')} />
              <section>
                <h2>{t('options')}</h2>
                {(['reduced', 'audio'] as const).map((k) => (
                  <label key={k} className="toggle">
                    <b>{t(k)}</b>
                    <input
                      type="checkbox"
                      checked={profile[k]}
                      onChange={(e) => update({ [k]: e.target.checked })}
                    />
                  </label>
                ))}
                {enabled.length > 1 && (
                  <label className="row">
                    {t('language')}
                    <select value={lang} onChange={(e) => update({ uiLocale: e.target.value })}>
                      {enabled.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {!match && manifest.wordPacks.length > 1 && (
                  <label className="row">
                    {t('wordLanguage')}
                    <select
                      value={locale.locale}
                      onChange={(e) => update({ wordLocale: e.target.value })}
                    >
                      {manifest.wordPacks.map((p) => (
                        <option key={p.locale}>{p.locale}</option>
                      ))}
                    </select>
                  </label>
                )}
              </section>
              <Action secondary onClick={() => rules('settings')}>
                {t('rules')}
              </Action>
              {!match && (
                <Action secondary onClick={() => show('custom')}>
                  {t('custom')}
                </Action>
              )}
              {(!match || match.winner) && (
                <Action secondary onClick={() => {
                  if (window.confirm(t('resetScoresConfirm'))) resetScores()
                }}>{t('resetScores')}</Action>
              )}
              <p className="status">
                <i />
                {t(offline.status)}
              </p>
              {offline.waiting && <p className="note">{t('update')}</p>}
              <Footer>
                {match && (
                  <button
                    className="danger"
                    onClick={() => {
                      if (window.confirm(t('game:endConfirm'))) abandon()
                    }}
                  >
                    {t('game:end')}
                  </button>
                )}
                <Action onClick={() => show(null)}>{t('done')}</Action>
              </Footer>
            </>
          ) : screen === 'home' ? (
            <>
              <div className="home-stage">
                <span className="orbit o1" />
                <span className="orbit o2" />
                <div className="home-badge">
                  <Portrait person={{ avatar: 'cat' }} live selected />
                </div>
                <span className="satellite left">
                  <Portrait person={{ avatar: 'chicken' }} />
                </span>
                <span className="satellite right">
                  <Portrait person={{ avatar: 'raccoon' }} />
                </span>
              </div>
              <Title title={t('game:homeTitle')} tag={t('game:homeTag')} sub={t('game:homeSub')} />
              <div className="home-meta">
                <Icon name="people" size={17} />
                {t('game:homeMeta')}
              </div>
              <Footer>
                <Action onClick={() => go(match ? 'match' : 'roster')}>
                  {t(match ? 'game:resume' : 'game:start')}
                  <Icon name="next" size={18} />
                </Action>
                <Action secondary onClick={() => rules(null)}>
                  <Icon name="book" size={19} />
                  {t('rules')}
                </Action>
                <Action secondary onClick={() => { guideTo(0); show('guide') }}>{t('game:guide')}</Action>
                <small className="status" role="status">
                  <i />
                  {t(offline.status)}
                </small>
              </Footer>
            </>
          ) : screen === 'roster' ? (
            <Roster next={() => go('roles')} home={() => go('home')} />
          ) : screen === 'roles' || screen === 'words' || screen === 'timers' ? (
            <Config
              step={screen}
              go={go}
              pack={pack}
              loading={loading}
              retry={loadAgain}
              launch={start}
            />
          ) : (
            match && (
              <MatchScreen
                rematch={() => {
                  if (pack) launch(pack, match.players, match.settings)
                }}
                setup={abandon}
                rematchIssue={rematchIssue}
                packRetry={loadAgain}
              />
            )
          )}
        </motion.div>
      </main>
    </MotionConfig>
  )
}
