import { useState } from 'react'
import Sidebar, { type Screen } from '../components/Sidebar'
import Home from './Home'
import Mods from './Mods'
import Settings from './Settings'
import Admin from './Admin'
import type { AccountSession, ZewoSession } from '../../../shared/types'

interface DashboardProps {
  session: ZewoSession
  accountSession: AccountSession
  onAccountUpdate: (session: AccountSession) => void
  onLogout: () => void
}

export default function Dashboard({
  session,
  accountSession,
  onAccountUpdate,
  onLogout
}: DashboardProps): JSX.Element {
  const [screen, setScreen] = useState<Screen>('home')

  return (
    <div className="dashboard">
      <Sidebar
        active={screen}
        showAdmin={accountSession.profile.isAdmin}
        onNavigate={setScreen}
        onLogout={onLogout}
      />
      <div className="dashboard-main">
        {screen === 'home' && (
          <Home session={session} accountSession={accountSession} onAccountUpdate={onAccountUpdate} />
        )}
        {screen === 'mods' && <Mods />}
        {screen === 'settings' && <Settings />}
        {screen === 'admin' && accountSession.profile.isAdmin && (
          <Admin onSelfUpdate={onAccountUpdate} />
        )}
      </div>
    </div>
  )
}
