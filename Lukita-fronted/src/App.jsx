import { useEffect, useState } from 'react'
import Registro from './page/registro'

function App() {
  const [route, setRoute] = useState(window.location.hash || '#/registro')

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (route === '#/login') {
    return <div className="p-10 text-white">Login (pendiente)</div>
  }

  return <Registro />
}

export default App