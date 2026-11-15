import { useEffect } from 'react'
import { playMusic } from './core/music'
import { useScreen } from './core/nav'
import { activeProfile, useApp } from './core/store'
import { ClassScreen } from './screens/ClassScreen'
import { DojoScreen } from './screens/DojoScreen'
import { GrownUpsScreen } from './screens/GrownUpsScreen'
import { MapScreen } from './screens/MapScreen'
import { HomeworkScreen, StopScreen } from './screens/PlayScreen'
import { ShopScreen } from './screens/ShopScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'

export function App() {
  const screen = useScreen()
  const lang = useApp((s) => s.lang)
  const profile = useApp((s) => activeProfile(s))

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Activities choose their own tune; everywhere else it is the map theme (or the gym's).
  useEffect(() => {
    if (screen.id !== 'play' && screen.id !== 'homework') playMusic(screen.id === 'dojo' ? 'dojo' : 'hub')
  }, [screen.id])

  // Every screen except the welcome one needs a player.
  if (!profile || screen.id === 'welcome') return <WelcomeScreen />
  switch (screen.id) {
    case 'hub':
      return <MapScreen />
    case 'play':
      return <StopScreen key={screen.stop} index={screen.stop} />
    case 'homework':
      return <HomeworkScreen />
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
