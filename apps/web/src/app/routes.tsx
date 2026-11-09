import { createBrowserRouter } from 'react-router'

// Cada rota carrega sob demanda (lazy loading). As telas reais substituem os
// placeholders nas Tarefas 9 e 10.
export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => ({
      Component: (await import('./placeholders/LoginPlaceholder')).default,
    }),
  },
  {
    path: '/cadastro',
    lazy: async () => ({
      Component: (await import('./placeholders/RegisterPlaceholder')).default,
    }),
  },
  {
    path: '/',
    lazy: async () => ({
      Component: (await import('./placeholders/HomePlaceholder')).default,
    }),
  },
])
