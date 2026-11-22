import { useCallback, useEffect, useState } from 'react'
import { listPlans, type Plan } from './plansApi'

interface PlansState {
  data?: Plan[]
  error?: Error
  loading: boolean
}

export function usePlans() {
  const [state, setState] = useState<PlansState>({ loading: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let obsolete = false
    listPlans()
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

  // Mantém a lista anterior enquanto recarrega, para a tela não piscar.
  const refetch = useCallback(() => {
    setState((current) => ({ data: current.data, loading: true }))
    setAttempt((n) => n + 1)
  }, [])

  return { ...state, refetch }
}
