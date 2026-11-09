import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, stubFetch } from '../features/auth/pages/testHelpers'
import { routes } from './routes'

afterEach(() => vi.unstubAllGlobals())

function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

const session = { data: { id: 'u1', email: 'a@b.com' } }

describe('área interna protegida', () => {
  it('leva ao login quem não tem sessão (401 em /auth/me)', async () => {
    const fetchMock = stubFetch(jsonResponse(401, { message: 'Não autenticado.' }))
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/me$/)
  })

  it('mostra o e-mail de quem tem sessão', async () => {
    stubFetch(jsonResponse(200, session))
    renderApp('/')

    expect(await screen.findByText('a@b.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('não mostra login nem página enquanto carrega', async () => {
    stubFetch(new Promise(() => {}) as unknown as Response)
    renderApp('/')

    expect(await screen.findByRole('status')).toHaveTextContent('Carregando…')
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('falha de rede em /auth/me mostra erro e permite tentar de novo, sem ir ao login', async () => {
    const user = userEvent.setup()
    stubFetch(new TypeError('network'), jsonResponse(200, session))
    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar')
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('a@b.com')).toBeInTheDocument()
  })

  it('o botão Sair chama POST /auth/logout e leva ao login', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(jsonResponse(200, session), jsonResponse(200, { data: null }))
    renderApp('/')

    await user.click(await screen.findByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/auth\/logout$/)
    expect(fetchMock.mock.calls[1][1].method).toBe('POST')
  })

  it('falha de rede no logout mantém na tela com erro', async () => {
    const user = userEvent.setup()
    stubFetch(jsonResponse(200, session), new TypeError('network'))
    renderApp('/')

    await user.click(await screen.findByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar')
    expect(screen.getByText('a@b.com')).toBeInTheDocument()
  })

  it('não protege /login nem /cadastro', async () => {
    const fetchMock = stubFetch()
    renderApp('/cadastro')

    expect(await screen.findByRole('heading', { name: 'Criar conta' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
