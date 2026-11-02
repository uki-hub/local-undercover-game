import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ANIMALS, type AnimalId } from '../avatars/manifest'
import { Action, Footer, Icon, PlayerCard, Portrait, Title } from '../components/ui'
import {
  categories,
  difficulties,
  wordPool,
  normalize,
  tripleSchema,
  type Pack,
  type Triple,
} from '../content/words'
import { defaults, presets, setupIssue, type Settings } from '../engine/model'
import { saveCustom, useGame } from '../store/session'
import { newId } from '../engine/random'
import { useSetupDrafts } from '../store/setup'
import { RoleEmblem } from '../components/RoleEmblem'

export function Roster({ next, home }: { next: () => void; home: () => void }) {
  const { t } = useTranslation()
  const { roster } = useGame((s) => s.profile),
    update = useGame((s) => s.update)
  const [selected, select] = useState(roster[0].id)
  const editing = useSetupDrafts((s) => s.player), edit = useSetupDrafts((s) => s.editPlayer)
  const [error, invalid] = useState(false)
  if (editing) {
    const exists = roster.some((p) => p.id === editing.id)
    function save() {
      const p = { ...editing!, name: editing!.name.trim() }
      if (
        !p.name ||
        p.name.length > 20 ||
        roster.some((o) => o.id !== p.id && normalize(o.name) === normalize(p.name))
      ) {
        invalid(true)
        return
      }
      update({ roster: exists ? roster.map((o) => (o.id === p.id ? p : o)) : [...roster, p] })
      select(p.id)
      edit(null)
    }
    return (
      <>
        <Title title={t(exists ? 'game:editPlayer' : 'game:newPlayer')} />
        <div className="hero-avatar compact">
          <Portrait person={editing} live selected />
        </div>
        <label className="field">
          {t('game:name')}
          <input
            autoComplete="off"
            maxLength={20}
            value={editing.name}
            onChange={(e) => edit({ ...editing, name: e.target.value })}
          />
        </label>
        <h2>{t('game:avatar')}</h2>
        <div className="animal-picker">
          {ANIMALS.map((id) => (
            <button
              key={id}
              aria-label={t('avatars:' + id)}
              title={t('avatars:' + id)}
              aria-pressed={id === editing.avatar}
              onClick={() => edit({ ...editing, avatar: id as AnimalId })}
            >
              <Portrait person={{ avatar: id }} selected={id === editing.avatar} />
            </button>
          ))}
        </div>
        <p className="muted center">{t('avatars:' + editing.avatar)}</p>
        {error && <p role="alert">{t('errors.name')}</p>}
        <Footer>
          <Action onClick={save}>{t('save')}</Action>
          <div className="twins">
            <Action secondary onClick={() => edit(null)}>
              {t('cancel')}
            </Action>
            {exists && roster.length > 3 && (
              <Action
                secondary
                onClick={() => {
                  update({ roster: roster.filter((p) => p.id !== editing.id) })
                  edit(null)
                }}
              >
                {t('delete')}
              </Action>
            )}
          </div>
        </Footer>
      </>
    )
  }
  return (
    <>
      <Title title={t('game:setupTitle')} sub={t('game:setupSub')} />
      <div className="roster-panel">
        <div className="grid-players">
          {roster.map((p) => (
            <PlayerCard
              key={p.id}
              p={p}
              selected={p.id === selected}
              onClick={() => {
                select(p.id)
                invalid(false)
                edit({ ...p })
              }}
            />
          ))}
        </div>
        <button
          className="add-player"
          disabled={roster.length >= 20}
          onClick={() => {
            invalid(false)
            edit({ id: newId(), name: '', avatar: ANIMALS[roster.length % 10] })
          }}
        >
          <Icon name="plus" />
          {t('game:addPlayer')}
        </button>
      </div>
      <Footer>
        <Action onClick={next}>{t('next')}</Action>
        <Action secondary onClick={home}>{t('home')}</Action>
      </Footer>
    </>
  )
}
export function Config({
  pack,
  loading,
  retry,
  launch,
  back,
}: {
  pack: Pack | null
  loading: boolean
  retry: () => void
  launch: () => void
  back: () => void
}) {
  const { t } = useTranslation()
  const p = useGame((s) => s.profile),
    update = useGame((s) => s.update)
  const s = p.settings
  const set = (changes: Partial<Settings>) => update({ settings: { ...s, ...changes } })
  const pool = pack
    ? wordPool(pack, p.custom[pack.locale] || [], s)
    : []
  const issue = setupIssue(p.roster, s, pool.length)
  return (
    <>
      <Title title={t('game:config')} sub={t('game:configSub')} />
      <section>
        <h2>{t('game:preset')}</h2>
        <div className="preset-grid">
          {presets.map((pr) => {
            const values = { ...defaults, ...pr.roles }
            const active =
              pr.size === p.roster.length &&
              (
                ['undercover', 'fool', 'white', 'mime', 'couple', 'justice', 'revenger'] as const
              ).every((k) => s[k] === values[k])
            return (
              <button
                key={pr.id}
                disabled={p.roster.length !== pr.size}
                aria-pressed={active}
                onClick={() =>
                  set({
                    undercover: values.undercover,
                    white: values.white,
                    fool: values.fool,
                    couple: values.couple,
                    justice: values.justice,
                    revenger: values.revenger,
                    mime: values.mime,
                  })
                }
              >
                <strong>{t('game:presets.' + pr.id)}</strong>
                <small>{t('count', { count: pr.size })}</small>
                <span>{t('game:presetNotes.' + pr.id)}</span>
              </button>
            )
          })}
        </div>
      </section>
      <section>
        <h2>{t('game:composition')}</h2>
        <label className="row">
          <span className="role-config"><RoleEmblem role="undercover" />{t('roles:undercover.name')}</span>
          <select value={s.undercover} onChange={(e) => set({ undercover: +e.target.value })}>
            {Array.from({ length: 9 }, (_, i) => (
              <option key={i}>{i + 1}</option>
            ))}
          </select>
        </label>
        <p className="muted role-config civilian-count">
          <RoleEmblem role="civilian" />
          {t('game:civilians', {
            count: p.roster.length - s.undercover - Number(s.white) - Number(s.fool),
          })}
        </p>
        {(['white', 'fool', 'couple', 'revenger', 'justice', 'mime'] as const).map((k) => (
          <label key={k} className="toggle">
            <span className="role-config">
              <RoleEmblem role={k} />
              <span>
              <b>{t('roles:' + k + '.name')}</b>
              <small>{t('roles:' + k + '.description')}</small>
              </span>
            </span>
            <input
              type="checkbox"
              checked={s[k]}
              onChange={(e) => set({ [k]: e.target.checked })}
            />
          </label>
        ))}
      </section>
      {s.fool && (
        <section>
          <h2>{t('game:foolOptions')}</h2>
          {(['foolHasWord', 'foolCanStart'] as const).map((k) => (
            <label key={k} className="toggle">
              <span>
                <b>{t('game:' + k)}</b>
                <small>{t('game:' + k + 'Hint')}</small>
              </span>
              <input
                type="checkbox"
                checked={s[k]}
                onChange={(e) => set({ [k]: e.target.checked })}
              />
            </label>
          ))}
        </section>
      )}
      <section>
        <h2>{t('game:content')}</h2>
        <label className="row">
          {t('game:wordSource')}
          <select value={s.wordSource} onChange={(e) => set({ wordSource: e.target.value as Settings['wordSource'] })}>
            <option value="all">{t('game:allSources')}</option>
            <option value="custom">{t('game:customOnly')}</option>
          </select>
        </label>
        {s.wordSource === 'custom' && <p className="muted">{t('game:customOnlyHint')}</p>}
        <Filters
          category={s.category}
          difficulty={s.difficulty}
          changeCategory={(category) => set({ category })}
          changeDifficulty={(difficulty) => set({ difficulty })}
          all
        />
        {pack && <small>{t('game:available', { count: pool.length })}</small>}
      </section>
      <section>
        <h2>{t('game:timers')}</h2>
        {(['clueSeconds', 'discussionSeconds'] as const).map((key, i) => (
          <label key={key} className="row">
            {t(i ? 'game:discussionTimer' : 'game:clueTimer')}
            <select value={s[key]} onChange={(e) => set({ [key]: +e.target.value })}>
              {[0, 15, 30, 45, 60, 90, 120, 180].map((n) => (
                <option key={n} value={n}>
                  {n ? t('seconds', { count: n }) : t('timerOff')}
                </option>
              ))}
            </select>
          </label>
        ))}
      </section>
      {!pack ? (
        <p role="status">
          {t(loading ? 'game:waiting' : 'errors.pack')}{' '}
          {!loading && <button onClick={retry}>{t('retry')}</button>}
        </p>
      ) : (
        issue && <p role="alert">{t('errors.' + issue)}</p>
      )}
      <Footer>
        <Action disabled={!pack || !!issue} onClick={launch}>
          {t('game:launch')}
        </Action>
        <Action secondary onClick={back}>
          {t('back')}
        </Action>
      </Footer>
    </>
  )
}
function Filters({
  category,
  difficulty,
  changeCategory,
  changeDifficulty,
  all = false,
}: {
  category: string
  difficulty: string
  changeCategory: (v: string) => void
  changeDifficulty: (v: Settings['difficulty']) => void
  all?: boolean
}) {
  const { t } = useTranslation()
  return (
    <>
      {[
        {
          label: 'category',
          prefix: 'categories.',
          items: categories,
          value: category,
          set: changeCategory,
        },
        {
          label: 'difficulty',
          prefix: 'difficulties.',
          items: difficulties,
          value: difficulty,
          set: (v: string) => changeDifficulty(v as Settings['difficulty']),
        },
      ].map((f) => (
        <label key={f.label} className="row">
          {t(f.label)}
          <select value={f.value} onChange={(e) => f.set(e.target.value)}>
            {all && <option value="all">{t('all')}</option>}
            {f.items.map((k) => (
              <option key={k} value={k}>
                {t(f.prefix + k)}
              </option>
            ))}
          </select>
        </label>
      ))}
    </>
  )
}
export function Customs({ back, pack }: { back: () => void; pack: Pack | null }) {
  const { t } = useTranslation(),
    profile = useGame((s) => s.profile),
    list = profile.custom[profile.wordLocale] || []
  const savedDraft = useSetupDrafts((s) => s.customs[profile.wordLocale]),
    editCustom = useSetupDrafts((s) => s.editCustom)
  const draft = savedDraft?.entry ?? null, aliases = savedDraft?.aliases ?? ['', '']
  const [error, invalid] = useState(false)
  const set = (entry: Triple | null) => editCustom(profile.wordLocale, entry ? { entry, aliases } : null)
  const changeAliases = (values: string[]) => {
    if (draft) editCustom(profile.wordLocale, { entry: draft, aliases: values })
  }
  function edit(entry: Triple) {
    editCustom(profile.wordLocale, { entry: { ...entry },
      aliases: [entry.aliasesA?.join(', ') || '', entry.aliasesB?.join(', ') || ''] })
    invalid(false)
  }
  function save() {
    const [aliasesA, aliasesB] = aliases.map((a) =>
      a
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean),
    )
    const result = tripleSchema.safeParse({ ...draft, aliasesA, aliasesB })
    if (!result.success || pack?.sets.some((s) => s.id === draft?.id)) {
      invalid(true)
      return
    }
    const item = result.data
    saveCustom([...list.filter((s) => s.id !== item.id), item])
    set(null)
  }
  return (
    <>
      <Title title={t('custom')} sub={t('game:customSub')} />
      {draft ? (
        <section>
          {(['wordA', 'wordB', 'foolWord'] as const).map((k) => (
            <label className="field" key={k}>
              {t('game:' + k)}
              <input
                maxLength={80}
                value={draft[k]}
                onChange={(e) => set({ ...draft, [k]: e.target.value })}
              />
            </label>
          ))}
          {aliases.map((v, i) => (
            <label className="field" key={i}>
              {t(i ? 'game:aliasesB' : 'game:aliasesA')}
              <input
                value={v}
                onChange={(e) =>
                  changeAliases(aliases.map((a, j) => (i === j ? e.target.value : a)))
                }
              />
            </label>
          ))}
          <Filters
            category={draft.categoryId}
            difficulty={draft.difficulty}
            changeCategory={(categoryId) => set({ ...draft, categoryId })}
            changeDifficulty={(difficulty) => {
              if (difficulty !== 'all') set({ ...draft, difficulty })
            }}
          />
          {error && <p role="alert">{t('errors.custom')}</p>}
          <Action onClick={save}>{t('save')}</Action>
          <Action secondary onClick={() => set(null)}>
            {t('cancel')}
          </Action>
        </section>
      ) : (
        <>
          {list.length === 0 && <p className="note">{t('game:customEmpty')}</p>}
          {list.map((s) => (
            <section key={s.id}>
              <strong>{[s.wordA, s.wordB, s.foolWord].join(' · ')}</strong>
              <div className="twins">
                <button onClick={() => edit(s)}>{t('edit')}</button>
                <button
                  onClick={() => {
                    if (window.confirm(t('game:customRemove')))
                      saveCustom(list.filter((o) => o.id !== s.id))
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            </section>
          ))}
          <Footer>
            <Action
              onClick={() =>
                edit({
                  id: 'custom-' + newId(),
                  categoryId: categories[0],
                  difficulty: 'medium',
                  wordA: '',
                  wordB: '',
                  foolWord: '',
                })
              }
            >
              {t('game:customAdd')}
            </Action>
            <Action secondary onClick={back}>
              {t('back')}
            </Action>
          </Footer>
        </>
      )}
    </>
  )
}
