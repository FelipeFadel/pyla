import { render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Session } from '../api/authApi'
import HomePage from './HomePage'

function renderHome(session: Session) {
  const router = createMemoryRouter(
    [{ element: <Outlet context={session} />, children: [{ path: '/', element: <HomePage /> }] }],
    { initialEntries: ['/'] },
  )
  return render(<RouterProvider router={router} />)
}

describe('HomePage', () => {
  it('mostra o link Gerenciar planos para o administrador', () => {
    renderHome({ id: 'u1', email: 'a@b.com', role: 'ADMIN' })

    expect(screen.getByRole('link', { name: 'Gerenciar planos' })).toHaveAttribute(
      'href',
      '/admin/planos',
    )
  })

  it('não mostra o link Gerenciar planos para o usuário comum', () => {
    renderHome({ id: 'u1', email: 'a@b.com', role: 'CUSTOMER' })

    expect(screen.queryByRole('link', { name: 'Gerenciar planos' })).not.toBeInTheDocument()
  })
})
