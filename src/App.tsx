import { useEffect } from 'react'
import { playMusic, type TrackId } from './core/music'
import { useScreen, type Screen } from './core/nav'
import { activeProfile, useApp } from './core/store'
import { ClassScreen } from './screens/ClassScreen'
import { DojoScreen } from './screens/DojoScreen'
import { GrownUpsScreen } from './screens/GrownUpsScreen'
import { HubScreen } from './screens/HubScreen'
import { PlayScreen } from './screens/PlayScreen'
import { ShopScreen } from './screens/ShopScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { WorldScreen } from './screens/WorldScreen'

/** Each world has its own tune; everything else shares the map theme. */
function trackFor(screen: Screen): TrackId {
  if (screen.id === 'world' || screen.id === 'play') return screen.world
  return screen.id === 'dojo' ? 'dojo' : 'hub'
}

export function App() {
  const screen = useScreen()
  const lang = useApp((s) => s.lang)
  const profile = useApp((s) => activeProfile(s))

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const tune = trackFor(screen)
  useEffect(() => {
    playMusic(tune)
  }, [tune])

  // Every screen except the welcome one needs a player.
  if (!profile || screen.id === 'welcome') return <WelcomeScreen />
  switch (screen.id) {
    case 'hub':
      return <HubScreen />
    case 'world':
      return <WorldScreen world={screen.world} />
    case 'play':
      return <PlayScreen key={`${screen.world}-${screen.index}`} world={screen.world} index={screen.index} />
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
