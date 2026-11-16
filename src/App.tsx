import { useEffect } from 'react'
import { playMusic } from './core/music'
import { portal, takeInvitation } from './core/invite'
import { go, useScreen } from './core/nav'
import { activeProfile, joinClass, joinFamily, useApp, useSeason } from './core/store'
import { ClassScreen } from './screens/ClassScreen'
import { DojoScreen } from './screens/DojoScreen'
import { FamilyScreen } from './screens/FamilyScreen'
import { GrownUpsScreen } from './screens/GrownUpsScreen'
import { MapScreen } from './screens/MapScreen'
import { HomeworkScreen, StopScreen, WorldStopScreen } from './screens/PlayScreen'
import { ScreenScreen } from './screens/ScreenScreen'
import { ShopScreen } from './screens/ShopScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { WorldScreen } from './screens/WorldScreen'
import { TeacherPortal } from './screens/TeacherPortal'
import { SceneDefs } from './ui/scene'

export function App() {
  const screen = useScreen()
  const lang = useApp((s) => s.lang)
  const season = useSeason()

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Activities choose their own tune; everywhere else it is the map theme (or the gym's).
  useEffect(() => {
    if (screen.id !== 'play' && screen.id !== 'homework' && screen.id !== 'worldplay') playMusic(screen.id === 'dojo' || screen.id === 'screen' ? 'dojo' : 'hub')
  }, [screen.id])

  // The season in force restyles the whole app (see styles/season.css).
  useEffect(() => {
    if (season) document.documentElement.dataset.season = season.id
    else delete document.documentElement.dataset.season
  }, [season])

  return (
    <>
      <SceneDefs />
      {portal ? <TeacherPortal audience={portal} /> : <Page />}
    </>
  )
}

function Page() {
  const screen = useScreen()
  const profile = useApp((s) => activeProfile(s))
  // Arrived with a class card: as soon as there is a player, they are in the class.
  useEffect(() => {
    if (!profile || screen.id === 'welcome') return
    const invitation = takeInvitation()
    if (!invitation) return
    if (invitation.kind === 'family') {
      void joinFamily(invitation.code)
        .then((ok) => ok && go({ id: 'family' }))
        .catch(() => {})
      return
    }
    const { code, num } = invitation
    if (profile.classCode === code && (num === null || profile.classNum === num)) return
    if (num === null) return go({ id: 'class' })
    void joinClass(code, num)
      .then((ok) => ok && go({ id: 'class' }))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, screen.id])

  // Every screen except the welcome one needs a player.
  if (!profile || screen.id === 'welcome') return <WelcomeScreen />
  switch (screen.id) {
    case 'hub':
      return <MapScreen />
    case 'play':
      return <StopScreen key={screen.stop} index={screen.stop} />
    case 'homework':
      return <HomeworkScreen src={screen.src ?? 'class'} />
    case 'family':
      return <FamilyScreen />
    case 'world':
      return <WorldScreen src={screen.src} />
    case 'worldplay':
      return <WorldStopScreen key={`${screen.src}-${screen.stop}`} src={screen.src} index={screen.stop} />
    case 'screen':
      return <ScreenScreen />
    case 'dojo':
      return <DojoScreen />
    case 'shop':
      return <ShopScreen />
    case 'class':
      return <ClassScreen />
    case 'grownups':
      return <GrownUpsScreen />
  }
}
