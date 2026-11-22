import { ApiError, request } from '../../../shared/http'

export interface Plan {
  id: string
  name: string
  price: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface NewPlan {
  name: string
  price: number
}

export type PlanPatch = Partial<NewPlan & { active: boolean }>

export function listPlans() {
  return request<Plan[]>('/plans')
}

export function createPlan(plan: NewPlan) {
  return request<Plan>('/plans', { method: 'POST', body: plan })
}

// A API responde 204 sem corpo; o cliente HTTP já devolve undefined nesse caso.
export function deletePlan(id: string) {
  return request<void>(`/plans/${id}`, { method: 'DELETE' })
}

// O cliente HTTP já leva ao login em 401; a tela só não deve exibir esse erro como falha.
export function isSessionExpired(failure: unknown) {
  return failure instanceof ApiError && failure.status === 401
}

export function updatePlan(id: string, patch: PlanPatch) {
  return request<Plan>(`/plans/${id}`, { method: 'PATCH', body: patch })
}
