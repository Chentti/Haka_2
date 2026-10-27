import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'

// Los detalles (/wanted/:id, /news/:id) se abren encima del listado: no cuentan como cambio de página.
function basePath(pathname: string): string {
  const match = /^\/(wanted|news)\/[^/]+\/?$/.exec(pathname)
  return match ? `/${match[1]}` : pathname
}

export function RootLayout() {
  const { pathname } = useLocation()
  const base = basePath(pathname)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [base])
  return <Outlet />
}
