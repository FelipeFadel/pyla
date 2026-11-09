import { createBrowserRouter, type RouteObject } from 'react-router'
import { RequireSession } from './RequireSession'

// Cada rota carrega sob demanda (lazy loading). Só a área interna fica atrás
// da sessão; login e cadastro são abertos.
export const routes: RouteObject[] = [
  {
    path: '/login',
    lazy: async () => ({
      Component: (await import('../features/auth/pages/LoginPage')).default,
    }),
  },
  {
    path: '/cadastro',
    lazy: async () => ({
      Component: (await import('../features/auth/pages/RegisterPage')).default,
    }),
  },
  {
    element: <RequireSession />,
    children: [
      {
        path: '/',
        lazy: async () => ({
          Component: (await import('../features/auth/pages/HomePage')).default,
        }),
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
