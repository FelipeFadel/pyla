import { createBrowserRouter } from 'react-router'

// Cada rota carrega sob demanda (lazy loading). A área interna real substitui
// o placeholder na Tarefa 10.
export const router = createBrowserRouter([
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
    path: '/',
    lazy: async () => ({
      Component: (await import('./placeholders/HomePlaceholder')).default,
    }),
  },
])
