import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PlansAdminPage from './PlansAdminPage'

afterEach(() => vi.unstubAllGlobals())

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubFetch(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn()
  for (const r of responses) {
    if (r instanceof Error) fetchMock.mockRejectedValueOnce(r)
    else fetchMock.mockResolvedValueOnce(r)
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function plan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    name: 'Premium',
    price: 19.9,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function list(...plans: unknown[]) {
  return jsonResponse(200, { data: plans })
}

function validationError(field: 'name' | 'price', message: string) {
  return jsonResponse(400, {
    statusCode: 400,
    error: 'Bad Request',
    message: 'Dados inválidos',
    details: [{ field, messages: [message] }],
  })
}

describe('PlansAdminPage', () => {
  it('mostra o estado de carregamento', () => {
    stubFetch(list())
    render(<PlansAdminPage />)

    expect(screen.getByRole('status')).toHaveTextContent('Carregando')
  })

  it('lista os planos com nome, preço e estado, na ordem recebida', async () => {
    stubFetch(
      list(
        plan({ id: 'p1', name: 'Anual', price: 19.9, active: true }),
        plan({ id: 'p2', name: 'Mensal', price: 9.5, active: false }),
      ),
    )
    render(<PlansAdminPage />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Gestão de planos' }),
    ).toBeInTheDocument()
    const rows = await screen.findAllByRole('row')
    // linha 0 é o cabeçalho
    expect(within(rows[1]).getByText('Anual')).toBeInTheDocument()
    expect(within(rows[1]).getByText('R$ 19,90')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Ativo')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Mensal')).toBeInTheDocument()
    expect(within(rows[2]).getByText('R$ 9,50')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Inativo')).toBeInTheDocument()
  })

  it('sem planos mostra o estado vazio que convida a criar o primeiro', async () => {
    stubFetch(list())
    render(<PlansAdminPage />)

    expect(
      await screen.findByText('Nenhum plano cadastrado ainda. Crie o primeiro plano abaixo.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('erro ao carregar mostra mensagem e permite tentar de novo', async () => {
    const user = userEvent.setup()
    stubFetch(
      jsonResponse(500, { statusCode: 500, message: 'Erro interno.' }),
      list(plan({ name: 'Premium' })),
    )
    render(<PlansAdminPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno.')
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('Premium')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('tem rótulo em todo campo', async () => {
    stubFetch(list())
    render(<PlansAdminPage />)
    await screen.findByText(/Nenhum plano cadastrado/)

    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('Preço (R$)')).toBeInTheDocument()
  })

  it('cria um plano válido, envia name e price, mostra como ativo e limpa o formulário', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(
      list(),
      jsonResponse(201, { data: plan({ id: 'p9', name: 'Premium', price: 19.9 }) }),
      list(plan({ id: 'p9', name: 'Premium', price: 19.9 })),
    )
    render(<PlansAdminPage />)
    await screen.findByText(/Nenhum plano cadastrado/)

    await user.type(screen.getByLabelText('Nome'), 'Premium')
    await user.type(screen.getByLabelText('Preço (R$)'), '19,90')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    const row = (await screen.findAllByRole('row'))[1]
    expect(within(row).getByText('Premium')).toBeInTheDocument()
    expect(within(row).getByText('R$ 19,90')).toBeInTheDocument()
    expect(within(row).getByText('Ativo')).toBeInTheDocument()

    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toMatch(/\/plans$/)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ name: 'Premium', price: 19.9 })
    expect(screen.getByLabelText('Nome')).toHaveValue('')
    expect(screen.getByLabelText('Preço (R$)')).toHaveValue('')
  })

  it('opera só pelo teclado: tab, digitar e Enter', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(
      list(),
      jsonResponse(201, { data: plan({ name: 'Teclado', price: 5 }) }),
      list(plan({ name: 'Teclado', price: 5 })),
    )
    render(<PlansAdminPage />)
    await screen.findByText(/Nenhum plano cadastrado/)

    await user.tab()
    expect(screen.getByLabelText('Nome')).toHaveFocus()
    await user.keyboard('Teclado')
    await user.tab()
    expect(screen.getByLabelText('Preço (R$)')).toHaveFocus()
    await user.keyboard('5{Enter}')

    expect(await screen.findByText('R$ 5,00')).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ name: 'Teclado', price: 5 })
  })

  it('liga o erro 400 do nome ao campo por aria-describedby e aria-invalid', async () => {
    const user = userEvent.setup()
    stubFetch(list(), validationError('name', 'O nome é obrigatório.'))
    render(<PlansAdminPage />)
    await screen.findByText(/Nenhum plano cadastrado/)

    await user.type(screen.getByLabelText('Preço (R$)'), '10')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    const campo = screen.getByRole('textbox', { name: 'Nome' })
    await screen.findByText('O nome é obrigatório.')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('O nome é obrigatório.')
    expect(screen.getByLabelText('Preço (R$)')).toHaveAttribute('aria-invalid', 'false')
  })

  it('liga o erro 400 do preço ao campo', async () => {
    const user = userEvent.setup()
    stubFetch(list(), validationError('price', 'O preço deve ser maior que zero.'))
    render(<PlansAdminPage />)
    await screen.findByText(/Nenhum plano cadastrado/)

    await user.type(screen.getByLabelText('Nome'), 'Premium')
    await user.type(screen.getByLabelText('Preço (R$)'), '0')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    const campo = screen.getByLabelText('Preço (R$)')
    await screen.findByText('O preço deve ser maior que zero.')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('O preço deve ser maior que zero.')
    expect(screen.getByLabelText('Nome')).toHaveValue('Premium')
  })

  it('preço que não é número mostra erro no campo sem chamar a API', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list())
    render(<PlansAdminPage />)
    await screen.findByText(/Nenhum plano cadastrado/)

    await user.type(screen.getByLabelText('Nome'), 'Premium')
    await user.type(screen.getByLabelText('Preço (R$)'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    const campo = screen.getByLabelText('Preço (R$)')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Informe um preço válido, como 19,90.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('liga o 409 de nome repetido ao campo nome', async () => {
    const user = userEvent.setup()
    stubFetch(
      list(plan()),
      jsonResponse(409, {
        statusCode: 409,
        error: 'Conflict',
        message: 'Já existe um plano com esse nome.',
        details: [{ field: 'name', messages: ['Já existe um plano com esse nome.'] }],
      }),
    )
    render(<PlansAdminPage />)
    await screen.findByText('Premium')

    await user.type(screen.getByLabelText('Nome'), 'premium')
    await user.type(screen.getByLabelText('Preço (R$)'), '10')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    const campo = screen.getByLabelText('Nome')
    await screen.findByText('Já existe um plano com esse nome.')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Já existe um plano com esse nome.')
  })

  it('400 com details de campo desconhecido cai na mensagem geral, sem engolir a falha', async () => {
    const user = userEvent.setup()
    stubFetch(
      list(),
      jsonResponse(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Dados inválidos no envio',
        details: [{ field: 'campoDesconhecido', messages: ['Campo não permitido.'] }],
      }),
    )
    render(<PlansAdminPage />)
    await screen.findByText(/Nenhum plano cadastrado/)

    await user.type(screen.getByLabelText('Nome'), 'Premium')
    await user.type(screen.getByLabelText('Preço (R$)'), '19,90')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Dados inválidos no envio')
    expect(screen.getByLabelText('Nome')).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Preço (R$)')).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nome')).toHaveValue('Premium')
    expect(screen.getByLabelText('Preço (R$)')).toHaveValue('19,90')
    expect(screen.getByRole('button', { name: 'Criar plano' })).toBeEnabled()
  })

  it('em falha de rede mostra alerta em português, mantém o formulário e permite reenviar', async () => {
    const user = userEvent.setup()
    stubFetch(
      list(),
      new TypeError('Failed to fetch'),
      jsonResponse(201, { data: plan({ name: 'Premium', price: 19.9 }) }),
      list(plan({ name: 'Premium', price: 19.9 })),
    )
    render(<PlansAdminPage />)
    await screen.findByText(/Nenhum plano cadastrado/)

    await user.type(screen.getByLabelText('Nome'), 'Premium')
    await user.type(screen.getByLabelText('Preço (R$)'), '19,90')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar. Verifique sua conexão e tente de novo.',
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('Premium')
    expect(screen.getByLabelText('Preço (R$)')).toHaveValue('19,90')
    expect(screen.getByRole('button', { name: 'Criar plano' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    expect(await screen.findByText('R$ 19,90')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

function notFound() {
  return jsonResponse(404, { statusCode: 404, error: 'Not Found', message: 'Plano não encontrado.' })
}

async function openEdit(user: ReturnType<typeof userEvent.setup>, name = 'Premium') {
  await user.click(await screen.findByRole('button', { name: `Editar plano ${name}` }))
  return screen.getByRole('form', { name: `Editar plano ${name}` })
}

describe('PlansAdminPage: editar, ativar e desativar', () => {
  it('cada plano tem botões com nome acessível único', async () => {
    stubFetch(
      list(
        plan({ id: 'p1', name: 'Anual', active: true }),
        plan({ id: 'p2', name: 'Mensal', active: false }),
      ),
    )
    render(<PlansAdminPage />)

    expect(await screen.findByRole('button', { name: 'Editar plano Anual' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desativar plano Anual' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar plano Mensal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ativar plano Mensal' })).toBeInTheDocument()
  })

  it('editar nome e preço envia o PATCH e atualiza a linha', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(
      list(plan()),
      jsonResponse(200, { data: plan({ name: 'Premium Plus', price: 24.5 }) }),
      list(plan({ name: 'Premium Plus', price: 24.5 })),
    )
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    const nameField = within(form).getByLabelText('Nome')
    const priceField = within(form).getByLabelText('Preço (R$)')
    expect(nameField).toHaveValue('Premium')
    expect(priceField).toHaveValue('19,90')
    expect(nameField).toHaveFocus()

    await user.clear(nameField)
    await user.type(nameField, 'Premium Plus')
    await user.clear(priceField)
    await user.type(priceField, '24,5')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Premium Plus')).toBeInTheDocument()
    const row = (await screen.findAllByRole('row'))[1]
    expect(within(row).getByText('R$ 24,50')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Editar plano Premium' })).not.toBeInTheDocument()

    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toMatch(/\/plans\/p1$/)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ name: 'Premium Plus', price: 24.5 })
  })

  it('envia só o campo que mudou', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(
      list(plan()),
      jsonResponse(200, { data: plan({ price: 30 }) }),
      list(plan({ price: 30 })),
    )
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    const priceField = within(form).getByLabelText('Preço (R$)')
    await user.clear(priceField)
    await user.type(priceField, '30')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('R$ 30,00')).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ price: 30 })
  })

  it('Cancelar fecha a edição sem chamar a API e mantém a linha', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()))
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    await user.type(within(form).getByLabelText('Nome'), ' alterado')
    await user.click(within(form).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('form', { name: 'Editar plano Premium' })).not.toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('Salvar sem mudanças fecha a edição sem chamar a API', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()))
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(screen.queryByRole('form', { name: 'Editar plano Premium' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('liga o 400 do nome ao campo na edição', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()), validationError('name', 'O nome é obrigatório.'))
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    await user.clear(within(form).getByLabelText('Nome'))
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    await screen.findByText('O nome é obrigatório.')
    const campo = within(form).getByLabelText('Nome')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('O nome é obrigatório.')
    expect(screen.getByText('Premium')).toBeInTheDocument()
  })

  it('liga o 400 do preço ao campo na edição', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()), validationError('price', 'O preço deve ser maior que zero.'))
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    const priceField = within(form).getByLabelText('Preço (R$)')
    await user.clear(priceField)
    await user.type(priceField, '0')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    await screen.findByText('O preço deve ser maior que zero.')
    expect(priceField).toHaveAttribute('aria-invalid', 'true')
    expect(priceField).toHaveAccessibleDescription('O preço deve ser maior que zero.')
  })

  it('preço que não é número mostra erro no campo sem chamar a API', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()))
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    const priceField = within(form).getByLabelText('Preço (R$)')
    await user.clear(priceField)
    await user.type(priceField, 'abc')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(priceField).toHaveAccessibleDescription('Informe um preço válido, como 19,90.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('liga o 409 de nome repetido ao campo nome na edição', async () => {
    const user = userEvent.setup()
    stubFetch(
      list(plan()),
      jsonResponse(409, {
        statusCode: 409,
        error: 'Conflict',
        message: 'Já existe um plano com esse nome.',
        details: [{ field: 'name', messages: ['Já existe um plano com esse nome.'] }],
      }),
    )
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    const nameField = within(form).getByLabelText('Nome')
    await user.clear(nameField)
    await user.type(nameField, 'Outro')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    await screen.findByText('Já existe um plano com esse nome.')
    expect(nameField).toHaveAttribute('aria-invalid', 'true')
    expect(nameField).toHaveAccessibleDescription('Já existe um plano com esse nome.')
    expect(nameField).toHaveValue('Outro')
  })

  it('falha de rede na edição mantém os valores e permite reenviar', async () => {
    const user = userEvent.setup()
    stubFetch(
      list(plan()),
      new TypeError('Failed to fetch'),
      jsonResponse(200, { data: plan({ name: 'Novo' }) }),
      list(plan({ name: 'Novo' })),
    )
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    const nameField = within(form).getByLabelText('Nome')
    await user.clear(nameField)
    await user.type(nameField, 'Novo')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(await within(form).findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar. Verifique sua conexão e tente de novo.',
    )
    expect(nameField).toHaveValue('Novo')
    expect(within(form).getByLabelText('Preço (R$)')).toHaveValue('19,90')

    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Novo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('404 ao editar mostra mensagem em português, fecha a edição e refaz a listagem', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()), notFound(), list())
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    await user.type(within(form).getByLabelText('Nome'), ' X')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este plano não existe mais.')
    expect(await screen.findByText(/Nenhum plano cadastrado/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2][1].method).toBe('GET')
    expect(screen.queryByRole('form', { name: 'Editar plano Premium' })).not.toBeInTheDocument()
  })

  it('desativar troca Ativo por Inativo e o botão passa a Ativar', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(
      list(plan({ active: true })),
      jsonResponse(200, { data: plan({ active: false }) }),
      list(plan({ active: false })),
    )
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Desativar plano Premium' }))

    expect(await screen.findByText('Inativo')).toBeInTheDocument()
    expect(screen.queryByText('Ativo')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ativar plano Premium' })).toBeEnabled()
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toMatch(/\/plans\/p1$/)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ active: false })
  })

  it('ativar troca Inativo por Ativo e o botão passa a Desativar', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(
      list(plan({ active: false })),
      jsonResponse(200, { data: plan({ active: true }) }),
      list(plan({ active: true })),
    )
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Ativar plano Premium' }))

    expect(await screen.findByText('Ativo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desativar plano Premium' })).toBeEnabled()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ active: true })
  })

  it('desabilita o botão durante a chamada, contra duplo clique', async () => {
    const user = userEvent.setup()
    let release: (r: Response) => void = () => {}
    const pending = new Promise<Response>((resolve) => {
      release = resolve
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(list(plan()))
      .mockReturnValueOnce(pending)
      .mockResolvedValueOnce(list(plan({ active: false })))
    vi.stubGlobal('fetch', fetchMock)
    render(<PlansAdminPage />)

    const button = await screen.findByRole('button', { name: 'Desativar plano Premium' })
    await user.click(button)
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await user.click(button)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    release(jsonResponse(200, { data: plan({ active: false }) }))
    expect(await screen.findByText('Inativo')).toBeInTheDocument()
  })

  it('404 ao desativar mostra mensagem em português e refaz a listagem', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()), notFound(), list())
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Desativar plano Premium' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este plano não existe mais.')
    expect(await screen.findByText(/Nenhum plano cadastrado/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2][1].method).toBe('GET')
  })

  it('404 ao ativar mostra mensagem em português e refaz a listagem', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan({ active: false })), notFound(), list())
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Ativar plano Premium' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este plano não existe mais.')
    expect(await screen.findByText(/Nenhum plano cadastrado/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('falha de rede ao desativar mostra alerta em português e mantém o estado', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan({ active: true })), new TypeError('Failed to fetch'))
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Desativar plano Premium' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar. Verifique sua conexão e tente de novo.',
    )
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desativar plano Premium' })).toBeEnabled()
  })

  it('edita só pelo teclado: Tab até Editar, Enter, digitar e Enter salva', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(
      list(plan()),
      jsonResponse(200, { data: plan({ name: 'Teclado' }) }),
      list(plan({ name: 'Teclado' })),
    )
    render(<PlansAdminPage />)
    await screen.findByText('Premium')

    await user.tab()
    expect(screen.getByRole('button', { name: 'Editar plano Premium' })).toHaveFocus()
    await user.keyboard('{Enter}')
    const form = screen.getByRole('form', { name: 'Editar plano Premium' })
    expect(within(form).getByLabelText('Nome')).toHaveFocus()
    await user.keyboard('{Control>}a{/Control}Teclado{Enter}')

    expect(await screen.findByText('Teclado')).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ name: 'Teclado' })
  })

  it('desativa pelo teclado com Tab e Enter', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(
      list(plan()),
      jsonResponse(200, { data: plan({ active: false }) }),
      list(plan({ active: false })),
    )
    render(<PlansAdminPage />)
    await screen.findByText('Premium')

    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Desativar plano Premium' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Inativo')).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ active: false })
  })

  it('bloqueia cada plano só enquanto o próprio está em voo, com dois planos pendentes', async () => {
    const user = userEvent.setup()
    let releaseA: (r: Response) => void = () => {}
    let releaseB: (r: Response) => void = () => {}
    const pendingA = new Promise<Response>((resolve) => {
      releaseA = resolve
    })
    const pendingB = new Promise<Response>((resolve) => {
      releaseB = resolve
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        list(plan({ id: 'a', name: 'Alfa' }), plan({ id: 'b', name: 'Beta' })),
      )
      .mockReturnValueOnce(pendingA)
      .mockReturnValueOnce(pendingB)
      .mockResolvedValue(list(plan({ id: 'a', name: 'Alfa' }), plan({ id: 'b', name: 'Beta' })))
    vi.stubGlobal('fetch', fetchMock)
    render(<PlansAdminPage />)

    const buttonA = await screen.findByRole('button', { name: 'Desativar plano Alfa' })
    const buttonB = screen.getByRole('button', { name: 'Desativar plano Beta' })
    await user.click(buttonA)
    await user.click(buttonB)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(buttonA).toHaveAttribute('aria-disabled', 'true')
    expect(buttonB).toHaveAttribute('aria-disabled', 'true')

    await user.click(buttonA)
    await user.click(buttonB)
    expect(fetchMock).toHaveBeenCalledTimes(3)

    releaseA(jsonResponse(200, { data: plan({ id: 'a', name: 'Alfa', active: false }) }))
    await waitFor(() => expect(buttonA).not.toHaveAttribute('aria-disabled', 'true'))
    expect(buttonB).toHaveAttribute('aria-disabled', 'true')
    const callsBeforeExtraClick = fetchMock.mock.calls.length
    await user.click(buttonB)
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(2)
    expect(fetchMock.mock.calls.length).toBe(callsBeforeExtraClick)

    releaseB(jsonResponse(200, { data: plan({ id: 'b', name: 'Beta', active: false }) }))
    await waitFor(() => expect(buttonB).not.toHaveAttribute('aria-disabled', 'true'))
  })
})

describe('PlansAdminPage: foco', () => {
  it('Cancelar devolve o foco ao botão Editar do plano', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()))
    render(<PlansAdminPage />)
    await screen.findByText('Premium')

    await user.tab()
    await user.keyboard('{Enter}')
    const form = screen.getByRole('form', { name: 'Editar plano Premium' })
    await user.click(within(form).getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('button', { name: 'Editar plano Premium' })).toHaveFocus()
  })

  it('Salvar sem mudanças devolve o foco ao botão Editar do plano', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()))
    render(<PlansAdminPage />)
    await screen.findByText('Premium')

    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')

    expect(screen.queryByRole('form', { name: 'Editar plano Premium' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar plano Premium' })).toHaveFocus()
  })

  it('Salvar com sucesso devolve o foco ao botão Editar do plano', async () => {
    const user = userEvent.setup()
    stubFetch(
      list(plan()),
      jsonResponse(200, { data: plan({ name: 'Novo' }) }),
      list(plan({ name: 'Novo' })),
    )
    render(<PlansAdminPage />)
    await screen.findByText('Premium')

    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('{Control>}a{/Control}Novo{Enter}')

    expect(await screen.findByText('Novo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar plano Novo' })).toHaveFocus()
  })

  it('404 ao editar leva o foco ao aviso de alerta', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()), notFound(), list())
    render(<PlansAdminPage />)
    await screen.findByText('Premium')

    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard('X{Enter}')

    expect(await screen.findByRole('alert')).toHaveFocus()
  })

  it('desativar pelo teclado mantém o foco no botão durante e depois da chamada', async () => {
    const user = userEvent.setup()
    let release: (r: Response) => void = () => {}
    const pending = new Promise<Response>((resolve) => {
      release = resolve
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(list(plan()))
        .mockReturnValueOnce(pending)
        .mockResolvedValueOnce(list(plan({ active: false }))),
    )
    render(<PlansAdminPage />)
    await screen.findByText('Premium')

    await user.tab()
    await user.tab()
    const button = screen.getByRole('button', { name: 'Desativar plano Premium' })
    expect(button).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(button).toHaveFocus()

    release(jsonResponse(200, { data: plan({ active: false }) }))
    expect(await screen.findByText('Inativo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ativar plano Premium' })).toHaveFocus()
  })
})

function noContent() {
  return new Response(null, { status: 204 })
}

function hasSubscribers() {
  return jsonResponse(409, {
    statusCode: 409,
    error: 'Conflict',
    message: 'Este plano tem assinantes e não pode ser excluído; desative-o em vez de excluí-lo.',
  })
}

describe('PlansAdminPage: excluir', () => {
  it('cada plano tem botão Excluir com nome acessível único', async () => {
    stubFetch(list(plan({ id: 'p1', name: 'Anual' }), plan({ id: 'p2', name: 'Mensal' })))
    render(<PlansAdminPage />)

    expect(await screen.findByRole('button', { name: 'Excluir plano Anual' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir plano Mensal' })).toBeInTheDocument()
  })

  it('clicar em Excluir pede confirmação, com o nome do plano, sem chamar a API', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()))
    render(<PlansAdminPage />)

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Excluir plano Premium' }))

    const dialog = screen.getByRole('alertdialog', { name: /Excluir o plano Premium\?/ })
    expect(dialog).toHaveAccessibleDescription('Esta ação não pode ser desfeita.')
    expect(within(dialog).getByRole('button', { name: 'Confirmar exclusão' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('Cancelar fecha sem chamar DELETE, mantém o plano e devolve o foco ao Excluir', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()))
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Excluir plano Premium' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Excluir plano Premium' })).toHaveFocus()
  })

  it('Confirmar chama DELETE /plans/:id e o plano some da lista', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()), noContent(), list())
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Excluir plano Premium' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))

    expect(await screen.findByText(/Nenhum plano cadastrado/)).toBeInTheDocument()
    expect(screen.queryByText('Premium')).not.toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toMatch(/\/plans\/p1$/)
    expect(init.method).toBe('DELETE')
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2][1].method).toBe('GET')
    expect(screen.getByRole('heading', { level: 1, name: 'Gestão de planos' })).toHaveFocus()
  })

  it('409 mostra a mensagem que sugere desativar e o plano permanece', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()), hasSubscribers(), list(plan()))
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Excluir plano Premium' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/desativ/)
    expect(alert).toHaveFocus()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
  })

  it('404 mostra a mensagem de plano inexistente e atualiza a lista', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()), notFound(), list())
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Excluir plano Premium' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este plano não existe mais.')
    expect(await screen.findByText(/Nenhum plano cadastrado/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2][1].method).toBe('GET')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('falha de rede mostra a mensagem de rede e o plano permanece', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()), new TypeError('Failed to fetch'))
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Excluir plano Premium' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar. Verifique sua conexão e tente de novo.',
    )
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir plano Premium' })).toBeEnabled()
  })

  it('confirmar duas vezes seguidas não dispara dois DELETE', async () => {
    const user = userEvent.setup()
    let release: (r: Response) => void = () => {}
    const pending = new Promise<Response>((resolve) => {
      release = resolve
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(list(plan()))
      .mockReturnValueOnce(pending)
      .mockResolvedValueOnce(list())
    vi.stubGlobal('fetch', fetchMock)
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Excluir plano Premium' }))
    const confirm = screen.getByRole('button', { name: 'Confirmar exclusão' })
    await user.click(confirm)
    expect(confirm).toHaveAttribute('aria-disabled', 'true')
    await user.click(confirm)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    release(noContent())
    expect(await screen.findByText(/Nenhum plano cadastrado/)).toBeInTheDocument()
  })

  it('exclui só pelo teclado: Tab até Excluir, Enter, foco na confirmação, Enter em Confirmar', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch(list(plan()), noContent(), list())
    render(<PlansAdminPage />)
    await screen.findByText('Premium')

    await user.tab()
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Excluir plano Premium' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Confirmar exclusão' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(await screen.findByText(/Nenhum plano cadastrado/)).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE')
  })
})

describe('PlansAdminPage: sessão expirada (401)', () => {
  const assign = vi.fn()

  beforeEach(() => {
    assign.mockReset()
    vi.stubGlobal('location', { assign })
  })

  function unauthorized() {
    return jsonResponse(401, { statusCode: 401, message: 'Sessão inválida ou expirada.' })
  }

  it('401 ao excluir leva ao login sem mostrar erro técnico', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()), unauthorized())
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Excluir plano Premium' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(/Sessão inválida/)).not.toBeInTheDocument()
  })

  it('401 ao ativar ou desativar leva ao login sem erro técnico', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()), unauthorized())
    render(<PlansAdminPage />)

    await user.click(await screen.findByRole('button', { name: 'Desativar plano Premium' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('401 ao criar leva ao login sem erro técnico', async () => {
    const user = userEvent.setup()
    stubFetch(list(), unauthorized())
    render(<PlansAdminPage />)
    await screen.findByText(/Nenhum plano cadastrado/)

    await user.type(screen.getByLabelText('Nome'), 'Premium')
    await user.type(screen.getByLabelText('Preço (R$)'), '19,90')
    await user.click(screen.getByRole('button', { name: 'Criar plano' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('401 ao editar leva ao login sem erro técnico', async () => {
    const user = userEvent.setup()
    stubFetch(list(plan()), unauthorized())
    render(<PlansAdminPage />)

    const form = await openEdit(user)
    await user.type(within(form).getByLabelText('Nome'), ' X')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('401 ao listar leva ao login sem erro técnico', async () => {
    stubFetch(unauthorized())
    render(<PlansAdminPage />)

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
