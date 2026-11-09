import { request } from '../../../shared/http'

export interface Credentials {
  email: string
  password: string
}

export function register(credentials: Credentials) {
  return request<unknown>('/auth/register', { method: 'POST', body: credentials })
}

export function login(credentials: Credentials) {
  return request<unknown>('/auth/login', { method: 'POST', body: credentials })
}
