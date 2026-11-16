import { useState } from 'react'
import type { MemberReport } from '../core/backend'
import { AREAS, TOPIC_BY_ID, TOPICS } from '../core/topics'
import {
  AREA_SCENE,
  areaStops,
  exercisesText,
  MAX_ITEMS,
  MAX_STOPS,
  MIN_ITEMS,
  newWorldId,
  parseExercises,
  SCENES,
  stopProblem,
  type SceneId,
  type World,
  type WorldStop,
} from '../core/worlds'
import { useT } from '../i18n'
import { Modal } from '../ui/kit'
import { SCENE_ICON } from '../ui/scene'

/** A stop while it is being edited: her own exercises are still the text she is typing. */
type Draft = { t: 'topic'; topic: string } | { t: 'own'; text: string }

const toDraft = (s: WorldStop): Draft => (s.t === 'topic' ? s : { t: 'own', text: exercisesText(s.items) })
const toStop = (d: Draft): WorldStop =>
  d.t === 'topic'
    ? d
    : {
        t: 'own',
        items: parseExercises(d.text)
          .flatMap((l) => (l.item ? [l.item] : []))
          .slice(0, MAX_ITEMS),
      }

/** The class world in the teacher's area: what is launched, how the class is doing, and the editor. */
export function WorldSection({
  world,
  members,
  names,
  onSet,
  family,
}: {
  /** Shown to a parent: the same editor, in a family's words. */
  family?: boolean
  world: World | null
  members: MemberReport[]
  names: Record<string, string>
  onSet: (world: World | null) => Promise<void>
}) {
  const { t } = useT()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const playing = world ? members.filter((m) => m.stats?.world?.id === world.id) : []

  // How many pupils missed each of her own exercises the last time they played the stop.
  const missed = world
    ? world.stops
        .flatMap((stop, s) =>
          stop.t === 'own'
            ? stop.items.map(([q, a], i) => ({ s, q, a, n: playing.filter((m) => m.stats.world?.miss?.[s]?.includes(i)).length }))
            : [],
        )
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 6)
    : []

  return (
    <section className="card">
      <h2><span className="emoji">🌍 </span>{t(family ? 'family.worldTitle' : 'teacher.world.title')}</h2>
      <p>{t(family ? 'family.worldAbout' : 'teacher.world.about')}</p>
      <p className="hw-current">
        {world ? `${SCENE_ICON[world.scene]} ${t('teacher.world.live', { name: world.name, n: world.stops.length })}` : t('teacher.world.none')}
      </p>
      <div className="btn-row">
        <button className="btn btn-primary" disabled={busy} onClick={() => setEditing(true)}>
          {t(world ? 'teacher.world.edit' : 'teacher.world.new')}
        </button>
        {world ? (
          <button
            className="btn"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await onSet(null).catch(() => {})
              setBusy(false)
            }}
          >
            {t('teacher.world.remove')}
          </button>
        ) : null}
      </div>

      {world && playing.length ? (
        <>
          <h3 className="field-label">{t('teacher.world.progress')}</h3>
          <div className="world-grid">
            <table>
              <thead>
                <tr>
                  <th />
                  {world.stops.map((stop, i) => (
                    <th key={i} title={stop.t === 'topic' ? t(`topic.${stop.topic}` as 'topic.n20') : t('teacher.world.addOwn')}>
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {playing.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.num}. {names[m.num] || m.name}
                    </td>
                    {world.stops.map((_, i) => {
                      const stars = m.stats.world?.stars?.[i] ?? 0
                      return <td key={i}>{stars ? '⭐'.repeat(stars) : '·'}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {missed.length ? (
            <>
              <h3 className="field-label">{t('teacher.world.missed')}</h3>
              <ul className="world-missed">
                {missed.map((x) => (
                  <li key={`${x.s}-${x.q}`}>
                    <strong>
                      {x.q} → {x.a}
                    </strong>{' '}
                    · {t('teacher.world.stop', { n: x.s + 1 })} · {t('teacher.world.pupils', { n: x.n })}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}

      {editing ? (
        <WorldEditor
          current={world}
          onClose={() => setEditing(false)}
          onSave={async (w) => {
            await onSet(w)
            setEditing(false)
          }}
        />
      ) : null}
    </section>
  )
}

function WorldEditor({ current, onSave, onClose }: { current: World | null; onSave: (w: World) => Promise<void>; onClose: () => void }) {
  const { t } = useT()
  const [name, setName] = useState(current?.name ?? '')
  const [scene, setScene] = useState<SceneId>(current?.scene ?? 'beach')
  const [stops, setStops] = useState<Draft[]>(() => current?.stops.map(toDraft) ?? [])
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [checked, setChecked] = useState(false)

  const patch = (i: number, d: Draft) => setStops(stops.map((s, n) => (n === i ? d : s)))
  const move = (i: number, by: number) => {
    const next = [...stops]
    const [s] = next.splice(i, 1)
    next.splice(i + by, 0, s)
    setStops(next)
  }
  const full = stops.length >= MAX_STOPS
  const built = stops.map(toStop)
  const badLines = (d: Draft) => (d.t === 'own' ? parseExercises(d.text).filter((l) => l.error) : [])
  const ready = name.trim().length > 0 && stops.length > 0 && stops.every((d, i) => !badLines(d).length && stopProblem(built[i]) === null)

  const launch = async () => {
    setChecked(true)
    if (!ready) return
    setBusy(true)
    setFailed(false)
    // Same shape as before (a typo fixed, a new name): pupils keep their stars. Otherwise it starts afresh.
    const same = current && current.stops.length === built.length && current.stops.every((s, i) => s.t === built[i].t)
    try {
      await onSave({ id: same ? current.id : newWorldId(), name: name.trim().slice(0, 40), scene, stops: built })
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="world-editor">
        <h2><span className="emoji">🌍 </span>{t('teacher.world.title')}</h2>
        <label className="field">
          <span className="field-label">{t('teacher.world.name')}</span>
          <input value={name} maxLength={40} placeholder={t('teacher.world.namePh')} onChange={(e) => setName(e.target.value)} />
        </label>
        {checked && !name.trim() ? <p className="error">{t('teacher.world.err.name')}</p> : null}

        <p className="field-label">{t('teacher.world.scene')}</p>
        <div className="scene-picker">
          {SCENES.map((s) => (
            <button key={s} type="button" className={`scene-pick${s === scene ? ' on' : ''}`} aria-pressed={s === scene} onClick={() => setScene(s)}>
              <span>{SCENE_ICON[s]}</span>
              {t(`scene.${s}`)}
            </button>
          ))}
        </div>

        {stops.length === 0 ? (
          <>
            <p className="field-label">{t('teacher.world.start')}</p>
            <div className="chips">
              {AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="chip-btn"
                  onClick={() => {
                    setStops(areaStops(a).map(toDraft))
                    if (!current) setScene(AREA_SCENE[a])
                  }}
                >
                  {t(`area.${a}`)}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <p className="field-label">{t('teacher.world.stops')}</p>
        <ol className="world-stops">
          {stops.map((d, i) => {
            const lines = d.t === 'own' ? parseExercises(d.text) : []
            const problem = stopProblem(built[i])
            return (
              <li key={i} className="world-stop">
                <div className="world-stop-head">
                  <span className="world-stop-n">{i + 1}</span>
                  {d.t === 'topic' ? (
                    <select value={d.topic} onChange={(e) => patch(i, { t: 'topic', topic: e.target.value })} aria-label={t('teacher.world.addTopic')}>
                      {AREAS.map((a) => (
                        <optgroup key={a} label={t(`area.${a}`)}>
                          {TOPICS.filter((x) => x.area === a).map((x) => (
                            <option key={x.id} value={x.id}>
                              {t(`topic.${x.id}` as 'topic.n20')}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <strong><span className="emoji">✏️ </span>{t('teacher.world.addOwn')}</strong>
                  )}
                  <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('teacher.world.up')}>
                    ↑
                  </button>
                  <button type="button" className="icon-btn" disabled={i === stops.length - 1} onClick={() => move(i, 1)} aria-label={t('teacher.world.down')}>
                    ↓
                  </button>
                  <button type="button" className="icon-btn" onClick={() => setStops(stops.filter((_, n) => n !== i))} aria-label={t('teacher.world.del')}>
                    ✕
                  </button>
                </div>
                {d.t === 'own' ? (
                  <>
                    <textarea
                      value={d.text}
                      placeholder={t('teacher.world.ownPh')}
                      onChange={(e) => patch(i, { t: 'own', text: e.target.value })}
                      spellCheck={false}
                      aria-label={t('teacher.world.addOwn')}
                    />
                    <small>{t('teacher.world.ownHelp')}</small>
                    {lines.length ? (
                      <ul className="world-preview">
                        {lines.map((l) =>
                          l.item ? (
                            <li key={l.line}>
                              {l.item[0]} → <b>{l.item[1]}</b>
                            </li>
                          ) : (
                            <li key={l.line} className="bad">
                              {l.text} · {t(`teacher.world.err.${l.error ?? 'syntax'}`)}
                            </li>
                          ),
                        )}
                      </ul>
                    ) : null}
                    {problem && (checked || lines.length > 0) ? (
                      <p className="error">{t(`teacher.world.err.${problem}`, { n: MIN_ITEMS })}</p>
                    ) : null}
                  </>
                ) : null}
              </li>
            )
          })}
        </ol>

        <div className="btn-row">
          <button type="button" className="btn" disabled={full} onClick={() => setStops([...stops, { t: 'topic', topic: TOPIC_BY_ID.addCarry ? 'addCarry' : TOPICS[0].id }])}>
            <span className="emoji">➕ </span>{t('teacher.world.addTopic')}
          </button>
          <button type="button" className="btn" disabled={full} onClick={() => setStops([...stops, { t: 'own', text: '' }])}>
            <span className="emoji">✏️ </span>{t('teacher.world.addOwn')}
          </button>
        </div>
        <small>{t('teacher.world.max', { n: MAX_STOPS, m: MAX_ITEMS })}</small>

        {failed ? <p className="error">{t('class.error')}</p> : null}
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={busy || stops.length === 0} onClick={() => void launch()}>
            <span className="emoji">🚀 </span>{t('teacher.world.launch')}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            {t('teacher.world.cancel')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
