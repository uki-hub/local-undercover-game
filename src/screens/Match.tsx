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
import { RoleBadge, RoleEmblem, type RoleKind } from '../components/RoleEmblem'
import { EventArt, EventScene, winnerRole } from '../components/EventScene'

function person(p: Person): Person {
  return { id: p.id, name: p.name, avatar: p.avatar }
}
function privateInfo(id: string) {
  const m = useGame.getState().match!
  const p = player(m, id)
  return {
    word: assigned(m, p),
    white: p.role === 'white',
    role: p.role,
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
  const hint = data.white ? 'roles:white.hint'
    : data.role === 'fool' ? data.word === null ? 'roles:fool.noWordHint' : 'roles:fool.hint'
    : 'game:secretSub'
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
          {(data.white || data.role === 'fool') && <div className={'private-role' + (data.white ? ' white-role' : '')}><RoleEmblem role={data.role} /><b>{t('roles:' + data.role + '.name')}</b></div>}
          {data.word !== null && <strong className={'secret-word' + (data.word.length > 12 ? ' phrase' : '') + (data.word.length > 24 ? ' long' : '')}>
            {data.word}
          </strong>}
          <p>{t(hint)}</p>
          {data.modifier && (
            <div className="ability">
              <RoleBadge role={data.modifier} />
              {data.partner && <p className="partner-name">{t('game:partner', { name: data.partner })}</p>}
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
      {(phase === 'justice' || phase === 'revenge') && <div className="center"><RoleBadge role={phase === 'justice' ? 'justice' : 'revenger'} /></div>}
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
  if (m.phase === 'mimeReveal' && m.mime) {
    const mime = player(m, m.mime)
    return <EventScene title={t('game:events.mimeReveal', { name: mime.name })}
      tag={t('game:events.mimeRound', { count: m.round })} sub={t('game:mimeClue')}
      role="mime" effect="sparks" compact next={next} action={t('game:beginClues')}>
      <div className="event-player"><span><Portrait person={person(mime)} /></span><h2>{mime.name}</h2></div>
      <p>{t('game:firstClue', { name: player(m, m.order[0]).name })}</p>
    </EventScene>
  }
  if (m.phase === 'justiceCall' || m.phase === 'revengeCall') {
    const justice = m.phase === 'justiceCall', role = justice ? 'justice' : 'revenger'
    return <EventScene title={t('game:events.' + (justice ? 'justiceCall' : 'revengeCall'))}
      tag={t('roles:' + role + '.name')} sub={t('game:events.' + (justice ? 'justiceCallSub' : 'revengeCallSub'), { name: p?.name })}
      role={role} effect={justice ? 'wings' : 'blood'} next={next}
      action={t('game:events.' + (justice ? 'justiceChoose' : 'revengeChoose'))}>
      {p && <div className="event-player"><span><Portrait person={p} /></span><h2>{p.name}</h2></div>}
    </EventScene>
  }
  if (m.phase === 'victory') {
    const role = winnerRole(m.winner)
    const solo = m.winner === 'white' ? m.whiteWin : m.winner === 'fool' ? m.foolWin : null
    return <EventScene title={t('game:wins.' + m.winner)} tag={t('game:results')}
      sub={t('game:events.winSub.' + m.winner)} role={role} art={role ? undefined : 'draw'}
      effect={m.winner === 'draw' ? 'sparks' : m.winner === 'couple' ? 'hearts' : 'confetti'}
      next={next} action={t('game:events.seeScores')}>
      {solo && <div className="event-player"><span><Portrait person={person(player(m, solo))} /></span><h2>{player(m, solo).name}</h2></div>}
    </EventScene>
  }
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
          {['justice', 'revenge', 'guess'].includes(m.phase) ? <EventArt role={m.phase === 'justice' ? 'justice' : m.phase === 'revenge' ? 'revenger' : 'white'} effect={m.phase === 'justice' ? 'wings' : 'sparks'} /> : <div className="hero-avatar">
            <Portrait person={p} live selected />
          </div>}
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
        entries={m.candidates.map((c) => m.ballot === 'action'
          ? { id: c, name: t('game:' + c) }
          : { id: c, name: player(m, c).name, person: person(player(m, c)) })}
        kind={m.ballot}
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
        <div className="victory-medallion">
          {winnerRole(m.winner) ? <RoleEmblem role={winnerRole(m.winner)!} /> : <Icon name="trophy" size={50} />}
        </div>
        <section>
          <h2>{t('game:allWords')}</h2>
          {(['civilian', 'undercover', 'fool'] as const).map((role) => (
            <div className="row" key={role}>
              <span className="result-word"><RoleEmblem role={role} />{t('roles:' + role + '.name')}</span>
              <b>{assigned(m, { role }) ?? t('game:noWord')}</b>
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
                <span className="score-role-icons"><RoleEmblem role={o.role} />{o.modifier && <RoleEmblem role={o.modifier} />}{m.mime === o.id && <RoleEmblem role="mime" />}</span>
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
    const fool = dead.id === m.foolWin
    const role: RoleKind = fool ? 'fool' : dead.modifier === 'revenger' ? 'revenger' : last.cause === 'partner' ? 'couple' : dead.role
    const revealedRoles = [t('roles:' + dead.role + '.name'), dead.modifier && t('roles:' + dead.modifier + '.name'), dead.id === m.mime && t('roles:mime.name')].filter(Boolean).join(' · ')
    const partner = dead.modifier === 'couple' ? living(m).find((o) => o.modifier === 'couple') : undefined
    const followUp = fool ? t('game:events.foolVotedSub')
      : last.cause === 'vote' && dead.role === 'white' ? t('game:events.whiteGuessNext', { name: dead.name })
      : dead.modifier === 'revenger' && people.length ? t('game:events.revengeCallSub', { name: dead.name })
      : partner ? t('game:events.partnerNext', { name: partner.name }) : null
    return <EventScene title={t('game:events.eliminated', { name: dead.name })}
      tag={t('game:causes.' + last.cause)} role={role}
      sub={t('game:events.eliminationSummary.' + last.cause, { name: dead.name, role: revealedRoles })}
      effect={fool ? 'confetti' : last.cause === 'partner' ? 'hearts' : 'blood'} compact next={next}>
        <div><RoleBadge role={dead.role} />{dead.modifier && <RoleBadge role={dead.modifier} />}{dead.id === m.mime && <RoleBadge role="mime" />}</div>
        {followUp && <p className="event-followup">{followUp}</p>}
        {m.deaths.length > 1 && (
          <ol className="chain">
            {m.deaths.map((d) => (
              <li key={d.id}>
                {t('game:events.deathChainLine', {
                  name: player(m, d.id).name,
                  role: t('roles:' + player(m, d.id).role + '.name'),
                  cause: t('game:causes.' + d.cause),
                })}
              </li>
            ))}
          </ol>
        )}
      </EventScene>
  }
  if (m.phase === 'guessResult' || m.phase === 'actionResult')
    return (
        <EventScene
          title={t(
            m.phase === 'actionResult'
              ? 'game:' + m.outcome
              : m.whiteWin
                ? 'game:correct'
                : 'game:incorrect',
          )}
          tag={t(m.phase === 'actionResult' ? 'game:actionResult' : 'game:guess')}
          sub={t(m.phase === 'actionResult' ? 'game:events.' + m.outcome : m.whiteWin ? 'game:events.guessWin' : 'game:events.guessMiss', { name: p?.name })}
          art={m.phase === 'actionResult' ? m.outcome === 'extra' ? 'extra' : 'vote' : undefined}
          role={m.phase === 'guessResult' ? 'white' : undefined}
          effect={m.whiteWin ? 'confetti' : 'sparks'} next={next}
        />
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
        {m.mime === p.id && <div className="center"><RoleBadge role="mime" /></div>}
        <p className="note">{t(m.mime === p.id ? 'game:mimeClue' : 'game:clueSub')}</p>
        <Timer seconds={m.settings.clueSeconds} token={m.id + '-' + m.revision} />
        <Footer>
          <Action onClick={next}>{t('next')}</Action>
          <Action secondary onClick={() => remind('')}>{t('game:reminder')}</Action>
        </Footer>
      </>
    )
  const ready = m.phase === 'ready'
  if (ready) return <EventScene title={t('game:events.roundReady', { count: m.round })}
    tag={t('game:events.newRound')} sub={t('game:firstClue', { name: player(m, m.order[0]).name })}
    role={m.mime ? 'mime' : 'civilian'} effect="sparks" compact next={next} action={t('game:beginClues')}>
    {m.mime && <div className="scene-banner"><RoleEmblem role="mime" /><p><b>{t('game:mime', { name: player(m, m.mime).name })}</b><br />{t('game:mimeClue')}</p></div>}
    <Strip people={people} />
    <button className="secondary" onClick={() => remind('')}>{t('game:reminder')}</button>
  </EventScene>
  return (
    <>
      <Strip people={people} />
      <Title title={t('game:discussion')} sub={t('game:discussionSub')} />
      <div className="feature-art"><ChoiceArt chat /></div>
          <Timer token={m.id + '-' + m.revision} seconds={m.settings.discussionSeconds} />
          {m.extra && <p className="note">{t('game:mandatory')}</p>}
      <Footer>
        <Action onClick={next}>
          {t(m.extra ? 'game:toTarget' : 'game:toAction')}
        </Action>
        <Action secondary onClick={() => remind('')}>{t('game:reminder')}</Action>
      </Footer>
    </>
  )
}
