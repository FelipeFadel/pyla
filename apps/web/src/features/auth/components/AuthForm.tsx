import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/http'
import type { Credentials } from '../api/authApi'
import { Link } from 'react-router'
import { AuthTabs, type AuthTab } from './AuthTabs'
import { FormField } from './FormField'

interface AuthFormProps {
  tabs: AuthTab[]
  footer: { text: string; linkLabel: string; to: string }
  submitLabel: string
  errorTitle: string
  passwordAutoComplete: 'new-password' | 'current-password'
  passwordHint?: string
  onSubmit: (credentials: Credentials) => Promise<void>
}

type FieldErrors = Partial<Record<'email' | 'password', string[]>>

export function AuthForm({
  tabs,
  footer,
  submitLabel,
  errorTitle,
  passwordAutoComplete,
  passwordHint,
  onSubmit,
}: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string>()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setGeneralError(undefined)
    setFieldErrors({})
    try {
      await onSubmit({ email, password })
    } catch (error) {
      const details = error instanceof ApiError ? error.details : undefined
      if (details && details.length > 0) {
        const next: FieldErrors = {}
        for (const { field, messages } of details) {
          if (field === 'email' || field === 'password') next[field] = messages
        }
        setFieldErrors(next)
      } else {
        setGeneralError(
          error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-sm">
      <div className="flex w-full max-w-formulario flex-col gap-md rounded bg-superficie p-md shadow-card">
        <header className="flex flex-col items-center gap-xs text-center">
          <h1 className="font-display text-titulo-pagina text-primaria-forte">Pyla</h1>
          <p className="text-corpo text-texto-suave">
            Inteligência financeira em compras de mercado
          </p>
        </header>
        <AuthTabs tabs={tabs} />
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-sm">
          {generalError && (
            <div role="alert" className="flex gap-xs rounded bg-perigo-fundo p-sm text-perigo">
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <div className="flex flex-col gap-xxs">
                <p className="font-semibold">{errorTitle}</p>
                <p>{generalError}</p>
              </div>
            </div>
          )}
          <FormField
            id="email"
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder="seu@email.com"
            errors={fieldErrors.email}
          />
          <FormField
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={passwordAutoComplete}
            placeholder="••••••••"
            maxLength={72}
            errors={fieldErrors.password}
            hint={passwordHint}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-primaria px-sm py-xs font-semibold text-superficie transition-colors hover:bg-primaria-forte disabled:cursor-not-allowed disabled:bg-desabilitado disabled:text-texto-suave"
          >
            {submitting ? 'Processando…' : submitLabel}
          </button>
        </form>
        <div className="flex justify-center gap-xs border-t border-superficie-media pt-sm text-legenda text-texto-suave">
          <span>{footer.text}</span>
          <Link to={footer.to} className="font-semibold text-primaria">
            {footer.linkLabel}
          </Link>
        </div>
      </div>
    </main>
  )
}
