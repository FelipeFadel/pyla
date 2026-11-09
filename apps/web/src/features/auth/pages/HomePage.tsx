import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { ApiError } from '../../../shared/http'
import { logout, type Session } from '../api/authApi'

export default function HomePage() {
  const session = useOutletContext<Session>()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState<string>()

  async function handleLogout() {
    setLeaving(true)
    setError(undefined)
    try {
      await logout()
    } catch (e) {
      // 401: a sessão já não existe, o objetivo do logout está cumprido.
      if (!(e instanceof ApiError && e.status === 401)) {
        setError(e instanceof Error ? e.message : 'Algo deu errado. Tente novamente.')
        setLeaving(false)
        return
      }
    }
    await navigate('/login', { replace: true })
  }

  return (
    <main className="mx-auto flex max-w-formulario flex-col gap-md p-sm pt-xl">
      <h1 className="font-display text-titulo-pagina text-primaria-forte">Área interna</h1>
      <p className="text-corpo text-texto">
        Você está logado como <strong>{session.email}</strong>
      </p>
      {error && (
        <p role="alert" className="rounded bg-perigo-fundo p-sm text-perigo">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={leaving}
        className="rounded bg-primaria px-sm py-xs font-semibold text-superficie transition-colors hover:bg-primaria-forte disabled:cursor-not-allowed disabled:bg-desabilitado disabled:text-texto-suave"
      >
        Sair
      </button>
    </main>
  )
}
