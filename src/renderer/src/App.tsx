import { useEffect, useState } from 'react'
import WindowChrome from './components/WindowChrome'
import AccountAuth from './screens/AccountAuth'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import type { AccountSession, ZewoSession } from '../../shared/types'

export default function App(): JSX.Element {
  const [accountSession, setAccountSession] = useState<AccountSession | null>(null)
  const [mcSession, setMcSession] = useState<ZewoSession | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    Promise.all([window.zewo.account.getSession(), window.zewo.auth.getSession()])
      .then(([account, mc]) => {
        setAccountSession(account)
        setMcSession(mc)
      })
      .finally(() => setChecking(false))
  }, [])

  async function handleLogout(): Promise<void> {
    await Promise.all([window.zewo.account.logout(), window.zewo.auth.logout()])
    setAccountSession(null)
    setMcSession(null)
  }

  function renderContent(): JSX.Element | null {
    if (checking) return null
    if (!accountSession) return <AccountAuth onAuthed={setAccountSession} />
    if (!mcSession) return <Login onLoggedIn={setMcSession} />
    return (
      <Dashboard
        session={mcSession}
        accountSession={accountSession}
        onAccountUpdate={setAccountSession}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="app-shell">
      <WindowChrome />
      <div className="app-content">{renderContent()}</div>
    </div>
  )
}
