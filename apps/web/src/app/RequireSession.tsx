import { Navigate, Outlet } from 'react-router'
import { useSession } from '../features/auth/api/useSession'
import { ApiError } from '../shared/http'

export function RequireSession() {
  const { data, error, loading, refetch } = useSession()

  if (loading) {
    return (
      <p role="status" className="p-sm text-corpo text-texto-suave">
        Carregando…
      </p>
    )
  }

  if (error instanceof ApiError && error.status === 401) {
    return <Navigate to="/login" replace />
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-sm p-sm pt-xl">
        <p role="alert" className="rounded bg-perigo-fundo p-sm text-perigo">
          {error?.message ?? 'Algo deu errado. Tente novamente.'}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="rounded bg-primaria px-sm py-xs font-semibold text-superficie transition-colors hover:bg-primaria-forte"
        >
          Tentar de novo
        </button>
      </main>
    )
  }

  return <Outlet context={data} />
}
