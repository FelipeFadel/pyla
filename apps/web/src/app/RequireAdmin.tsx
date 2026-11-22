import { Navigate, Outlet, useOutletContext } from 'react-router'
import type { Session } from '../features/auth/api/authApi'

// Roda dentro do RequireSession: a sessão já existe e vem pelo Outlet context.
export function RequireAdmin() {
  const session = useOutletContext<Session>()

  if (session.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <Outlet context={session} />
}
