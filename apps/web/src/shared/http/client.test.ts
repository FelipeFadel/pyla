import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, NetworkError, request } from './client'

function respond(status: number, body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('cliente HTTP', () => {
  const fetchMock = vi.fn()
  const assign = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('location', { assign })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    assign.mockReset()
  })

  it('envia credentials include', async () => {
    fetchMock.mockReturnValue(respond(200, { data: { id: '1' } }))

    await request('/auth/me')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include' })
  })

  it('envia o corpo como JSON com o método informado', async () => {
    fetchMock.mockReturnValue(respond(201, { data: {} }))

    await request('/auth/login', { method: 'POST', body: { email: 'a@x.com' } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ email: 'a@x.com' }))
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })

  it('devolve o conteúdo de data', async () => {
    fetchMock.mockReturnValue(respond(200, { data: { id: '1', email: 'a@x.com' } }))

    await expect(request('/auth/me')).resolves.toEqual({ id: '1', email: 'a@x.com' })
  })

  it('converte o erro da API em ApiError', async () => {
    fetchMock.mockReturnValue(
      respond(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Dados inválidos',
        details: [{ field: 'email', messages: ['E-mail inválido'] }],
      }),
    )

    const erro = (await request('/auth/register', { method: 'POST' }).catch(
      (e) => e,
    )) as ApiError

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.status).toBe(400)
    expect(erro.message).toBe('Dados inválidos')
    expect(erro.details).toEqual([{ field: 'email', messages: ['E-mail inválido'] }])
  })

  it('distingue falha de rede com NetworkError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(request('/auth/login', { method: 'POST' })).rejects.toBeInstanceOf(
      NetworkError,
    )
  })

  it('em 401 leva ao login e ainda rejeita com ApiError', async () => {
    fetchMock.mockReturnValue(respond(401, { statusCode: 401, message: 'Sessão inválida' }))

    await expect(request('/purchases')).rejects.toBeInstanceOf(ApiError)
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it.each(['/auth/login', '/auth/register', '/auth/me'])(
    'em 401 de %s não redireciona',
    async (path) => {
      fetchMock.mockReturnValue(respond(401, { statusCode: 401, message: 'Não autorizado' }))

      await expect(request(path)).rejects.toBeInstanceOf(ApiError)
      expect(assign).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['', 'http://localhost:3000'],
    ['https://api.exemplo.com', 'https://api.exemplo.com'],
  ])('com VITE_API_URL=%j chama %s', async (envValue, expected) => {
    vi.stubEnv('VITE_API_URL', envValue)
    vi.resetModules()
    const { request: freshRequest } = await import('./client')
    fetchMock.mockReturnValue(respond(200, { data: {} }))

    await freshRequest('/auth/me')

    expect(fetchMock.mock.calls[0][0]).toBe(`${expected}/auth/me`)
  })
})
