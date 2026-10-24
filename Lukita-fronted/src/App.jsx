import { useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import Dashboard from './page/dashboard'
import Login from './page/login'
import Registro from './page/registro'
import { clearSession, getSession } from './lib/auth'

function LoginRoute({ session, onLogin }) {
  const location = useLocation()
  const navigate = useNavigate()

  if (session) {
    return <Navigate to="/app" replace />
  }

  return (
    <Login
      notice={location.state?.notice || ''}
      onDismissNotice={() =>
        navigate('/login', { replace: true, state: null })
      }
      onLogin={onLogin}
    />
  )
}

function RegistroRoute({ session }) {
  if (session) {
    return <Navigate to="/app" replace />
  }

  return <Registro />
}

function ProtectedRoute({ session, children }) {
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ notice: 'Inicia sesión para acceder a tus finanzas.' }}
      />
    )
  }

  return children
}

function App() {
  const [session, setSession] = useState(getSession)
  const navigate = useNavigate()

  function handleLogin(user) {
    setSession(user)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    navigate('/login', {
      replace: true,
      state: { notice: 'Sesión cerrada correctamente.' },
    })
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={session ? '/app' : '/login'} replace />}
      />
      <Route
        path="/login"
        element={<LoginRoute session={session} onLogin={handleLogin} />}
      />
      <Route
        path="/registro"
        element={<RegistroRoute session={session} />}
      />
      <Route
        path="/app/*"
        element={
          <ProtectedRoute session={session}>
            <Dashboard session={session} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={session ? '/app' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
