import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RegisterPage from './RegisterPage'
import { jsonResponse, renderPage, stubFetch } from './testHelpers'

afterEach(() => vi.unstubAllGlobals())

describe('RegisterPage', () => {
  it('tem rótulo em todo campo e limita a senha a 72 caracteres', () => {
    renderPage('/cadastro', RegisterPage)

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('maxlength', '72')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
  })

  it('cadastra só pelo teclado e leva à área interna', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(jsonResponse(201, { data: { id: 'u1', email: 'a@b.com' } }))
    renderPage('/cadastro', RegisterPage)

    await user.tab()
    expect(screen.getByLabelText('E-mail')).toHaveFocus()
    await user.keyboard('a@b.com')
    await user.tab()
    expect(screen.getByLabelText('Senha')).toHaveFocus()
    await user.keyboard('senha1234{Enter}')

    expect(await screen.findByRole('heading', { name: 'Área interna' })).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/auth\/register$/)
    expect(JSON.parse(init.body)).toEqual({ email: 'a@b.com', password: 'senha1234' })
  })

  it('liga cada erro de validação ao seu campo', async () => {
    const user = userEvent.setup()
    stubFetch(
      jsonResponse(400, {
        message: 'Dados inválidos.',
        details: [
          { field: 'email', messages: ['Informe um e-mail válido.'] },
          { field: 'password', messages: ['A senha deve ter no mínimo 8 caracteres.'] },
        ],
      }),
    )
    renderPage('/cadastro', RegisterPage)

    await user.type(screen.getByLabelText('E-mail'), 'x')
    await user.type(screen.getByLabelText('Senha'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    const email = await screen.findByLabelText('E-mail')
    await waitFor(() =>
      expect(email).toHaveAccessibleDescription('Informe um e-mail válido.'),
    )
    expect(email).toBeInvalid()
    const senha = screen.getByLabelText('Senha')
    expect(senha).toHaveAccessibleDescription('A senha deve ter no mínimo 8 caracteres.')
    expect(senha).toBeInvalid()
  })

  it('mostra a mensagem geral da API quando não há details', async () => {
    const user = userEvent.setup()
    stubFetch(jsonResponse(400, { message: 'Não foi possível concluir o cadastro.' }))
    renderPage('/cadastro', RegisterPage)

    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.type(screen.getByLabelText('Senha'), 'senha1234')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir o cadastro.',
    )
  })

  it('em falha de rede mostra erro em português, mantém o formulário e permite tentar de novo', async () => {
    const user = userEvent.setup()
    stubFetch(
      new TypeError('Failed to fetch'),
      jsonResponse(201, { data: { id: 'u1', email: 'a@b.com' } }),
    )
    renderPage('/cadastro', RegisterPage)

    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.type(screen.getByLabelText('Senha'), 'senha1234')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao servidor',
    )
    expect(screen.getByLabelText('E-mail')).toHaveValue('a@b.com')
    expect(screen.getByLabelText('Senha')).toHaveValue('senha1234')
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByRole('heading', { name: 'Área interna' })).toBeInTheDocument()
  })

  it('desabilita o botão e mostra "Processando…" durante o envio', async () => {
    const user = userEvent.setup()
    let resolve!: (r: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((r) => (resolve = r))),
    )
    renderPage('/cadastro', RegisterPage)

    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.type(screen.getByLabelText('Senha'), 'senha1234')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByRole('button', { name: 'Processando…' })).toBeDisabled()
    resolve(jsonResponse(201, { data: {} }))
    expect(await screen.findByRole('heading', { name: 'Área interna' })).toBeInTheDocument()
  })
})
