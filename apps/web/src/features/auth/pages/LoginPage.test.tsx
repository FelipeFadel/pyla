import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'
import { jsonResponse, renderPage, stubFetch } from './testHelpers'

afterEach(() => vi.unstubAllGlobals())

describe('LoginPage', () => {
  it('tem rótulo em todo campo e limita a senha a 72 caracteres', () => {
    renderPage('/login', LoginPage)

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('maxlength', '72')
  })

  it('mostra a marca, o subtítulo e os placeholders dos campos', () => {
    renderPage('/login', LoginPage)

    expect(screen.getByRole('heading', { level: 1, name: 'Pyla' })).toBeInTheDocument()
    expect(screen.getByText('Inteligência financeira em compras de mercado')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('seu@email.com')).toBe(screen.getByLabelText('E-mail'))
    expect(screen.getByPlaceholderText('••••••••')).toBe(screen.getByLabelText('Senha'))
  })

  it('alterna a visibilidade da senha e não revela a política de senha', async () => {
    const user = userEvent.setup()
    renderPage('/login', LoginPage)

    expect(screen.getByLabelText('Senha')).not.toHaveAccessibleDescription()
    expect(screen.queryByText(/Mínimo de 8 caracteres/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('entra só pelo teclado e leva à área interna', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(jsonResponse(200, { data: { id: 'u1', email: 'a@b.com' } }))
    renderPage('/login', LoginPage)

    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.tab()
    await user.keyboard('qualquer{Enter}')

    expect(await screen.findByRole('heading', { name: 'Área interna' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/login$/)
  })

  it('mostra o erro genérico do 401 sem sair da tela e sem apagar o formulário', async () => {
    const user = userEvent.setup()
    stubFetch(jsonResponse(401, { message: 'E-mail ou senha inválidos.' }))
    renderPage('/login', LoginPage)

    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.type(screen.getByLabelText('Senha'), 'errada123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('E-mail ou senha inválidos.')
    expect(within(alerta).getByText('Erro de autenticação')).toBeInTheDocument()
    expect(within(alerta).getByText('E-mail ou senha inválidos.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('a@b.com')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  it('em falha de rede mostra erro em português e mantém o formulário', async () => {
    const user = userEvent.setup()
    stubFetch(new TypeError('Failed to fetch'))
    renderPage('/login', LoginPage)

    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.type(screen.getByLabelText('Senha'), 'senha1234')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao servidor',
    )
    expect(screen.getByLabelText('Senha')).toHaveValue('senha1234')
  })
})
