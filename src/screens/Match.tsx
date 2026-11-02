import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  Action,
  ChoiceArt,
  Footer,
  Icon,
  PlayerCard,
  Portrait,
  Strip,
  Title,
} from '../components/ui'
import { Timer } from '../components/Timer'
import { Wheel } from '../components/Wheel'
import {
  actorId,
  assigned,
  isPrivate,
  living,
  player,
  type Match,
  type Person,
} from '../engine/model'
import { awardIds, choices } from '../engine/game'
import { useGame } from '../store/session'

function person(p: Person): Person {
  return { id: p.id, name: p.name, avatar: p.avatar }
}
function privateInfo(id: string) {
  const m = useGame.getState().match!
  const p = player(m, id)
  return {
    word: assigned(m, p),
    white: p.role === 'white',
    modifier: p.modifier,
    partner:
      p.modifier === 'couple'
        ? m.players.find((o) => o.id !== p.id && o.modifier === 'couple')?.name
        : null,
  }
}
function HeldCard({ intro, id }: { intro: boolean; id: string }) {
  const { t } = useTranslation()
  const data = privateInfo(id)
  return (
    <div className="held-content" data-private="true">
      {intro ? (
        <>
          <strong className="intro-copy">
            {data.partner ? t('game:partner', { name: data.partner }) : t('game:neutral')}
          </strong>
          {data.partner && <p>{t('roles:couple.description')}</p>}
        </>
      ) : (
        <>
          <strong className={'secret-word' + ((data.word?.length ?? 0) > 12 ? ' phrase' : '') + ((data.word?.length ?? 0) > 24 ? ' long' : '')}>
            {data.white ? t('roles:white.name') : data.word}
          </strong>
          <p>{t(data.white ? 'roles:white.hint' : 'game:secretSub')}</p>
          {data.modifier && (
            <div className="ability">
              <b>{t('roles:' + data.modifier + '.name')}</b>
              <p>{t('roles:' + data.modifier + '.hint')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
function Reveal({ p, intro, next, reminder = false }: { p: Person; intro: boolean; next: () => void; reminder?: boolean }) {
  const { t } = useTranslation(),
    [held, hold] = useState(false),
    [seen, saw] = useState(false)
  function show() {
    hold(true)
    saw(true)
  }
  function conceal() {
    hold(false)
  }
  useEffect(() => {
    const release = () => {
      flushSync(conceal)
    }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
    }
  }, [])
  return (
    <div className="reveal-layout">
      <Title title={t(intro ? 'game:intro' : 'game:word')} tag={t('game:turn', { name: p.name })} />
      <div className="reveal-body">
      <div className="hero-avatar reveal-avatar">
        <Portrait person={p} live selected />
      </div>
      <div className={'secret-card ' + (held ? 'exposed' : '')}>
        <span className="eye">
          <Icon name={held ? 'eye' : 'lock'} />
        </span>
        {held ? (
          <HeldCard intro={intro} id={p.id} />
        ) : (
          <>
            <strong>{t('game:hidden')}</strong>
            <p>{t('game:hiddenSub')}</p>
          </>
        )}
      </div>
      </div>
      <Footer>
        <button
          className="primary hold"
          aria-pressed={held}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            if (!e.isPrimary || e.button !== 0) return
            e.currentTarget.setPointerCapture(e.pointerId)
            show()
          }}
          onPointerUp={conceal}
          onPointerCancel={conceal}
          onLostPointerCapture={conceal}
          onBlur={conceal}
          onKeyDown={(e) => {
            if ([' ', 'Enter'].includes(e.key)) {
              e.preventDefault()
              if (!e.repeat) show()
            }
          }}
          onKeyUp={(e) => {
            if ([' ', 'Enter'].includes(e.key)) {
              e.preventDefault()
              conceal()
            }
          }}
        >
          <span className="finger">
            <Icon name="finger" size={28} />
          </span>
          {t('game:hold')}
        </button>
        <Action
          secondary
          disabled={(!seen && !reminder) || held}
          onClick={() => {
            conceal()
            next()
          }}
        >
          {t(reminder ? 'game:backToGame' : 'game:pass')}
        </Action>
      </Footer>
    </div>
  )
}
function Ballot({
  phase,
  p,
  people,
  options,
  submit,
}: {
  phase: Match['phase']
  p: Person
  people: Person[]
  options: string[]
  submit: (value: string) => void
}) {
  const { t } = useTranslation(),
    [choice, select] = useState('')
  if (phase === 'guess')
    return (
      <>
        <Title
          title={t('game:guess')}
          sub={t('game:guessSub')}
          tag={t('game:turn', { name: p.name })}
        />
        <div className="hero-avatar">
          <Portrait person={p} live selected />
        </div>
        <label className="field">
          {t('game:guessLabel')}
          <input
            value={choice}
            maxLength={160}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => select(e.target.value)}
          />
        </label>
        <Footer>
          <Action disabled={!choice.trim()} onClick={() => submit(choice)}>
            {t('game:guessConfirm')}
          </Action>
        </Footer>
      </>
    )
  const action = phase === 'action'
  return (
    <div className={'ballot-layout ' + (action ? 'action-ballot' : '')}>
      <Strip people={people} selected={p.id} />
      <Title title={t('game:' + phase)} sub={t('game:' + phase + 'Sub')} />
      {action ? (
        <div className="action-options">
          {options.map((id, i) => (
            <button
              key={id}
              className={'action-choice ' + (!i ? 'blue' : '') + (choice === id ? ' picked' : '')}
              aria-pressed={choice === id}
              onClick={() => select(id)}
            >
              <ChoiceArt chat={!!i} />
              <span>
                <strong>{t('game:' + id)}</strong>
                <small>{t('game:' + id + 'Sub')}</small>
              </span>
              <Icon name={choice === id ? 'check' : 'next'} />
            </button>
          ))}
        </div>
      ) : (
        <div className="grid-players">
          {options.map((id) => (
            <PlayerCard
              key={id}
              p={people.find((o) => o.id === id)!}
              selected={choice === id}
              mark
              onClick={() => select(id)}
            />
          ))}
        </div>
      )}
      <Footer>
        {choice && <Action onClick={() => submit(choice)}>{t('game:confirmChoice')}</Action>}
        <p className="muted center">{t('game:ballotNote')}</p>
      </Footer>
    </div>
  )
}

export function MatchScreen({
  rematch,
  setup,
  rematchIssue,
  packRetry,
}: {
  rematch: () => void
  setup: () => void
  rematchIssue: string | null
  packRetry: () => void
}) {
  const { t } = useTranslation()
  const m = useGame((s) => s.match)!,
    cmd = useGame((s) => s.cmd),
    profile = useGame((s) => s.profile)
  const [open, unlock] = useState(false)
  const [reminder, remind] = useState<string | null>(null)
  const [reminderOpen, openReminder] = useState(false)
  useEffect(() => {
    const close = () => {
      flushSync(() => { unlock(false); openReminder(false) })
    }
    const hide = () => {
      if (document.hidden) close()
    }
    window.addEventListener('blur', close)
    window.addEventListener('pagehide', close)
    document.addEventListener('visibilitychange', hide)
    return () => {
      window.removeEventListener('blur', close)
      window.removeEventListener('pagehide', close)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [])
  const next = () => cmd(m.revision, { type: 'next' })
  const people = living(m).map(person),
    id = actorId(m),
    p = id && player(m, id) ? person(player(m, id)) : null
  const canRemind = ['ready', 'clue', 'discussion'].includes(m.phase)
  if (canRemind && reminder !== null) {
    const finish = () => { remind(null); openReminder(false) }
    if (!reminder) return <>
      <Title title={t('game:reminder')} sub={t('game:reminderSub')} />
      <div className="grid-players">{people.map((o) => <PlayerCard key={o.id} p={o} onClick={() => remind(o.id)} />)}</div>
      <Footer><Action secondary onClick={finish}>{t('game:backToGame')}</Action></Footer>
    </>
    const owner = people.find((o) => o.id === reminder)!
    if (!reminderOpen) return <div className="handoff">
      <Title title={t('game:handoff', { name: owner.name })} sub={t('game:handoffSub')} />
      <div className="hero-avatar"><Portrait person={owner} live selected /></div>
      <Footer>
        <Action onClick={() => openReminder(true)}>{t('game:readyAs', { name: owner.name })}</Action>
        <Action secondary onClick={finish}>{t('game:backToGame')}</Action>
      </Footer>
    </div>
    return <Reveal p={owner} intro={false} reminder next={finish} />
  }
  if (isPrivate(m.phase) && p) {
    if (!open) {
      const seq = m.phase === 'intro' || m.phase === 'word'
      return (
        <div className="handoff">
          <Title
            title={t('game:handoff', { name: p.name })}
            tag={
              seq
                ? t(m.phase === 'intro' ? 'game:introStep' : 'game:wordStep', {
                    current: m.cursor + 1,
                    total: m.players.length,
                  })
                : t(
                    'game:' +
                      ({ guess: 'guess', revenge: 'revenge', justice: 'justice' }[
                        m.phase as string
                      ] ?? 'privateRound'),
                  )
            }
          />
          <div className="hero-avatar">
            <Portrait person={p} live selected />
          </div>
          <div className="note">
            <Icon name="phone" />
            <p>{t('game:handoffSub')}</p>
          </div>
          <Footer>
            <Action onClick={() => unlock(true)}>{t('game:readyAs', { name: p.name })}</Action>
          </Footer>
        </div>
      )
    }
    if (m.phase === 'word' || m.phase === 'intro')
      return <Reveal p={p} intro={m.phase === 'intro'} next={next} />
    return (
      <Ballot
        phase={m.phase}
        p={p}
        people={people}
        options={choices(m)}
        submit={(value) => cmd(m.revision, { type: 'choose', actor: p.id, value })}
      />
    )
  }
  if (m.phase === 'wheel')
    return (
      <Wheel
        names={m.candidates.map((c) =>
          m.ballot === 'action' ? t('game:' + c) : player(m, c).name,
        )}
        index={m.candidates.indexOf(m.outcome)}
        next={next}
        reduced={profile.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches}
      />
    )
  if (m.phase === 'result') {
    const awards = new Set(awardIds(m))
    return (
      <>
        <Title title={t('game:wins.' + m.winner)} tag={t('game:results')} />
        <div className="medal">
          <Icon name="trophy" size={50} />
        </div>
        {m.foolWin && (
          <p className="note">{t('game:foolClaim', { name: player(m, m.foolWin).name })}</p>
        )}
        <section>
          <h2>{t('game:allWords')}</h2>
          {(['civilian', 'undercover', 'fool'] as const).map((role) => (
            <div className="row" key={role}>
              <span>{t('roles:' + role + '.name')}</span>
              <b>{assigned(m, { role })}</b>
            </div>
          ))}
        </section>
        <section>
          <h2>{t('game:scoreboard')}</h2>
          {m.players.map((o) => (
            <div className="result-player" key={o.id}>
              <span className="tiny-avatar">
                <Portrait person={person(o)} />
              </span>
              <span>
                <b>{o.name}</b>
                <small>
                  {[
                    t('roles:' + o.role + '.name'),
                    o.modifier && t('roles:' + o.modifier + '.name'),
                    m.mime === o.id && t('roles:mime.name'),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </span>
              <b>{t('points', { count: profile.scores[o.id] || 0 })}</b>
              {awards.has(o.id) && !!profile.scores[o.id] && <span className="point-gain">{t('game:pointGain')}</span>}
            </div>
          ))}
        </section>
        {rematchIssue && (
          <p role="status">{t(rematchIssue)} {rematchIssue === 'errors.pack' &&
            <button onClick={packRetry}>{t('retry')}</button>}</p>
        )}
        <Footer>
          <Action disabled={!!rematchIssue} onClick={rematch}>
            {t('game:rematch')}
          </Action>
          <Action secondary onClick={setup}>
            {t('game:changeSetup')}
          </Action>
        </Footer>
      </>
    )
  }
  if (m.phase === 'death') {
    const last = m.deaths.at(-1)!,
      dead = player(m, last.id)
    return (
      <>
        <Title title={t('game:death')} tag={t('game:causes.' + last.cause)} />
        <div className="hero-avatar">
          <Portrait person={person(dead)} live />
        </div>
        <div className="statement">
          <h2>{dead.name}</h2>
          <p>
            {[
              t('roles:' + dead.role + '.name'),
              dead.modifier && t('roles:' + dead.modifier + '.name'),
              dead.id === m.mime && t('roles:mime.name'),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {dead.id === m.foolWin && (
          <p className="note">{t('game:foolClaim', { name: dead.name })}</p>
        )}
        {m.deaths.length > 1 && (
          <ol className="chain">
            {m.deaths.map((d) => (
              <li key={d.id}>
                {t('game:deathLine', {
                  name: player(m, d.id).name,
                  cause: t('game:causes.' + d.cause),
                })}
              </li>
            ))}
          </ol>
        )}
        <Footer>
          <Action onClick={next}>{t('next')}</Action>
        </Footer>
      </>
    )
  }
  if (m.phase === 'guessResult' || m.phase === 'actionResult')
    return (
      <>
        <Strip people={people} />
        <Title
          title={t(
            m.phase === 'actionResult'
              ? 'game:' + m.outcome
              : m.whiteWin
                ? 'game:correct'
                : 'game:incorrect',
          )}
          tag={t(m.phase === 'actionResult' ? 'game:actionResult' : 'game:guess')}
          sub={t(m.phase === 'actionResult' ? 'game:' + m.outcome + 'Sub' : 'game:guessResultSub')}
        />
        {m.phase === 'actionResult' ? (
          <div className="feature-art"><ChoiceArt chat={m.outcome === 'extra'} /></div>
        ) : p && <div className="hero-avatar"><Portrait person={p} live /></div>}
        <Footer>
          <Action onClick={next}>{t('next')}</Action>
        </Footer>
      </>
    )
  if (m.phase === 'clue' && p)
    return (
      <>
        <Title
          tag={t('game:clueProgress', { current: m.cursor + 1, total: people.length })}
          title={p.name}
          sub={t('game:clue')}
        />
        <div className="hero-avatar">
          <Portrait person={p} live selected />
        </div>
        <p className="note">{t(m.mime === p.id ? 'game:mimeClue' : 'game:clueSub')}</p>
        <Timer seconds={m.settings.clueSeconds} token={m.id + '-' + m.revision} />
        <Footer>
          <Action onClick={next}>{t('next')}</Action>
          <Action secondary onClick={() => remind('')}>{t('game:reminder')}</Action>
        </Footer>
      </>
    )
  const ready = m.phase === 'ready'
  return (
    <>
      <Strip people={people} />
      <Title
        title={t(ready ? 'game:ready' : 'game:discussion')}
        sub={t(ready ? 'game:readySub' : 'game:discussionSub')}
      />
      {ready ? <>
        <div className="hero-avatar"><Portrait person={person(player(m,m.order[0]))} live selected /></div>
        <p className="center"><span className="pill">{t('game:firstClue',{name:player(m,m.order[0]).name})}</span></p>
      </> : <div className="feature-art"><ChoiceArt chat /></div>}
      {ready && m.mime && (
        <div className="note">{t('game:mime', { name: player(m, m.mime).name })}</div>
      )}
      {!ready && (
        <>
          <Timer token={m.id + '-' + m.revision} seconds={m.settings.discussionSeconds} />
          {m.extra && <p className="note">{t('game:mandatory')}</p>}
        </>
      )}
      <Footer>
        <Action onClick={next}>
          {t(ready ? 'game:beginClues' : m.extra ? 'game:toTarget' : 'game:toAction')}
        </Action>
        <Action secondary onClick={() => remind('')}>{t('game:reminder')}</Action>
      </Footer>
    </>
  )
}
