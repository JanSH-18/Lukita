import { useEffect, useState } from 'react'
import Dashboard from './page/dashboard'
import Login from './page/login'
import Registro from './page/registro'
import { clearSession, getSession } from './lib/auth'

const ROUTES = ['#/login', '#/registro', '#/app']

function getInitialRoute() {
  const hash = window.location.hash
  if (hash === '#/app') return getSession() ? '#/app' : '#/login'
  if (ROUTES.includes(hash)) return hash
  return getSession() ? '#/app' : '#/login'
}

function App() {
  const [route, setRoute] = useState(getInitialRoute)
  const [session, setSession] = useState(getSession)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}${getInitialRoute()}`,
      )
    }

    const sync = () => {
      const nextRoute = window.location.hash || '#/login'
      const nextSession = getSession()

      if (nextRoute === '#/app' && !nextSession) {
        setNotice('Inicia sesión para acceder a tus finanzas.')
      }

      setRoute(nextRoute)
      setSession(nextSession)
    }

    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    if (route === '#/app' && !session) {
      window.location.hash = '#/login'
    } else if (!ROUTES.includes(route)) {
      window.location.hash = session ? '#/app' : '#/login'
    }
  }, [route, session])

  function handleLogout() {
    clearSession()
    setSession(null)
    setNotice('Sesión cerrada correctamente.')
    window.location.hash = '#/login'
  }

  if (route === '#/registro') {
    return <Registro />
  }

  if (route === '#/app' && session) {
    return <Dashboard session={session} onLogout={handleLogout} />
  }

  return (
    <Login
      notice={notice}
      onDismissNotice={() => setNotice('')}
    />
  )
}

export default App
