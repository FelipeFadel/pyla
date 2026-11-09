import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'

export function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function stubFetch(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn()
  for (const r of responses) {
    if (r instanceof Error) fetchMock.mockRejectedValueOnce(r)
    else fetchMock.mockResolvedValueOnce(r)
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function renderPage(path: string, Page: React.ComponentType) {
  const router = createMemoryRouter(
    [
      { path, element: <Page /> },
      { path: '/', element: <h1>Área interna</h1> },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}
