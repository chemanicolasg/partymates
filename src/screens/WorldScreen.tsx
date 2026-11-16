import { useEffect, useRef } from 'react'
import { sfx } from '../core/audio'
import { back, go, type WorldSrc } from '../core/nav'
import { SEASON_BY_ID } from '../core/seasons'
import { classWorld, familyWorld, isWorldStopOpen, refreshClass, seasonWorldOf, useProfile, useSeason, worldDone, worldRecord, worldStars } from '../core/store'
import { TOPIC_BY_ID } from '../core/topics'
import { useT } from '../i18n'
import { Character } from '../ui/Character'
import { Chip, TopBar } from '../ui/kit'
import { MattySays } from '../ui/Matty'
import { SCENE_ICON } from '../ui/scene'
import { SeasonSky } from '../ui/Season'
import { ITEM_BY_ID, itemName } from '../core/look'
import { KindIcon } from '../ui/icons'
import { TrailGround, TrailNode, TrailRoad, trailHeight } from './Trail'

/** A short extra trail: the world the teacher made for the class, or the one a season brings. */
export function WorldScreen({ src }: { src: WorldSrc }) {
  const { t } = useT()
  const p = useProfile()
  const season = useSeason()
  const world = src === 'class' ? classWorld(p) : src === 'family' ? familyWorld(p) : seasonWorldOf(p, season)
  const current = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!world) go({ id: 'hub' }, { replace: true })
    current.current?.scrollIntoView({ block: 'center' })
    if (src !== 'season') void refreshClass().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!world) return null

  const rec = worldRecord(p, world)
  const stops = world.stops.length
  // The player waits at the first stop not yet visited.
  const here = Math.max(0, world.stops.findIndex((_, i) => !(rec.plays[i] ?? 0)))
  const done = worldDone(p, world)
  const prize = src === 'season' && season ? SEASON_BY_ID[season.id].prize : null
  const name = src === 'season' ? t(`season.${season?.id ?? 'xmas'}.world`) : world.name

  return (
    <div className="screen world-screen">
      <TopBar title={`${SCENE_ICON[world.scene]} ${name}`} onBack={back}>
        <Chip icon="⭐">
          {worldStars(p, world)}/{stops * 3}
        </Chip>
      </TopBar>
      <div className="map-wrap">
        {src === 'season' && season ? <SeasonSky season={season.id} /> : null}
        <main className="map">
          <section className={`zone scene-${world.scene}`} style={{ height: trailHeight(stops) }}>
            <TrailGround scene={world.scene} stops={stops} />
            <div className="zone-inner">
              <TrailRoad stops={stops} />
              {world.stops.map((stop, i) => {
                const topic = stop.t === 'topic' ? TOPIC_BY_ID[stop.topic] : undefined
                const turn = rec.plays[i] ?? 0
                return (
                  <TrailNode
                    key={i}
                    nodeRef={i === here ? current : undefined}
                    i={i}
                    stops={stops}
                    open={isWorldStopOpen(p, world, i)}
                    here={i === here && !done}
                    boss={i === stops - 1}
                    stars={rec.stars[i] ?? 0}
                    icon={<KindIcon kind={topic ? topic.activities[turn % topic.activities.length].kind : 'quiz'} />}
                    label={`${stop.t === 'topic' ? t(`topic.${stop.topic}` as 'topic.n20') : t('mission.quiz')} ${i + 1}`}
                    hero={p}
                    onClick={() => {
                      sfx('tap')
                      go({ id: 'worldplay', src, stop: i })
                    }}
                  />
                )
              })}
            </div>
          </section>
          <div className="world-foot">
            <MattySays pose={done ? 'cheer' : prize ? 'gift' : 'point'} size={78}>
              {done ? t('world.done') : prize ? t('world.prize') : t(src === 'family' ? 'family.worldIntro' : 'world.intro')}
              {prize ? (
                <span className={`world-prize${done ? ' won' : ''}`}>
                  <Character look={{ ...p.look, pet: null, [ITEM_BY_ID[prize].type]: itemName(prize) }} size={64} />
                </span>
              ) : null}
            </MattySays>
          </div>
        </main>
      </div>
    </div>
  )
}
