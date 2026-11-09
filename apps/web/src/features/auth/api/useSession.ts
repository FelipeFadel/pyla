import { useCallback, useEffect, useState } from 'react'
import { getSession, type Session } from './authApi'

interface SessionState {
  data?: Session
  error?: Error
  loading: boolean
}

export function useSession() {
  const [state, setState] = useState<SessionState>({ loading: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let obsolete = false
    getSession()
      .then((data) => {
        if (!obsolete) setState({ data, loading: false })
      })
      .catch((error: unknown) => {
        if (!obsolete) {
          setState({
            error: error instanceof Error ? error : new Error('Algo deu errado. Tente novamente.'),
            loading: false,
          })
        }
      })
    return () => {
      obsolete = true
    }
  }, [attempt])

  const refetch = useCallback(() => {
    setState({ loading: true })
    setAttempt((n) => n + 1)
  }, [])

  return { ...state, refetch }
}
