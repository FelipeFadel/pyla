const API_URL = import.meta.env.VITE_API_URL ||'http://localhost:3000'

// 401 nestas rotas é resposta esperada da tela, não sessão perdida.
const PATHS_WITHOUT_LOGIN_REDIRECT = ['/auth/login', '/auth/register', '/auth/me']

export interface ErrorDetail {
  field: string
  messages: string[]
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: ErrorDetail[]

  constructor(status: number, message: string, details?: ErrorDetail[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.')
    this.name = 'NetworkError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new NetworkError()
  }

  const json = (await readJson(response)) as
    | { data?: T; message?: string; details?: ErrorDetail[] }
    | undefined

  if (!response.ok) {
    if (response.status === 401 && !PATHS_WITHOUT_LOGIN_REDIRECT.includes(path.split('?')[0])) {
      window.location.assign('/login')
    }
    throw new ApiError(
      response.status,
      json?.message ?? 'Algo deu errado. Tente novamente.',
      json?.details,
    )
  }

  return json?.data as T
}
