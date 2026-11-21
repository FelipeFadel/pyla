import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'

function renderAuthRoutes(initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPage /> },
    ],
    { initialEntries: [initialPath] },
  )
  return render(<RouterProvider router={router} />)
}

describe('navegação entre login e cadastro', () => {
  it('em /login marca a aba Entrar como atual e a aba Criar conta leva a /cadastro', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/login')

    const nav = screen.getByRole('navigation', { name: 'Entrar ou criar conta' })
    expect(within(nav).getByRole('link', { name: 'Entrar' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const other = within(nav).getByRole('link', { name: 'Criar conta' })
    expect(other).not.toHaveAttribute('aria-current')

    await user.click(other)

    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('navigation')).getByRole('link', { name: 'Criar conta' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('em /cadastro a aba Entrar leva de volta a /login', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/cadastro')

    const nav = screen.getByRole('navigation', { name: 'Entrar ou criar conta' })
    expect(within(nav).getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await user.click(within(nav).getByRole('link', { name: 'Entrar' }))

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('o rodapé do login oferece Criar conta e leva a /cadastro', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/login')

    const footer = screen.getByText('Não tem uma conta?').parentElement as HTMLElement
    await user.click(within(footer).getByRole('link', { name: 'Criar conta' }))

    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('o rodapé do cadastro oferece Entrar e leva a /login', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/cadastro')

    const footer = screen.getByText('Já tem uma conta?').parentElement as HTMLElement
    await user.click(within(footer).getByRole('link', { name: 'Entrar' }))

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })
})
