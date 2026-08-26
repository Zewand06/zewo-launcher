import { useEffect, useState } from 'react'
import WindowChrome from './components/WindowChrome'
import AccountAuth from './screens/AccountAuth'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import UpdateScreen from './screens/UpdateScreen'
import type { AccountSession, UpdateStatus, ZewoSession } from '../../shared/types'

const BLOCKING_UPDATE_STAGES: UpdateStatus['stage'][] = ['available', 'downloading', 'downloaded']

export default function App(): JSX.Element {
  const [accountSession, setAccountSession] = useState<AccountSession | null>(null)
  const [mcSession, setMcSession] = useState<ZewoSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)

  useEffect(() => {
    Promise.all([window.zewo.account.getSession(), window.zewo.auth.getSession()])
      .then(([account, mc]) => {
        setAccountSession(account)
        setMcSession(mc)
      })
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    return window.zewo.updater.onStatus(setUpdateStatus)
  }, [])

  async function handleLogout(): Promise<void> {
    await Promise.all([window.zewo.account.logout(), window.zewo.auth.logout()])
    setAccountSession(null)
    setMcSession(null)
  }

  function renderContent(): JSX.Element | null {
    if (updateStatus && BLOCKING_UPDATE_STAGES.includes(updateStatus.stage)) {
      return <UpdateScreen status={updateStatus} />
    }
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
