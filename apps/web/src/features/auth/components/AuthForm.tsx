import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/http'
import type { Credentials } from '../api/authApi'
import { FormField } from './FormField'

interface AuthFormProps {
  title: string
  submitLabel: string
  passwordAutoComplete: 'new-password' | 'current-password'
  onSubmit: (credentials: Credentials) => Promise<void>
}

type FieldErrors = Partial<Record<'email' | 'password', string[]>>

export function AuthForm({ title, submitLabel, passwordAutoComplete, onSubmit }: AuthFormProps) {
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
    <main className="mx-auto flex max-w-md flex-col gap-md p-sm pt-xl">
      <h1 className="font-display text-titulo-pagina text-primaria-forte">{title}</h1>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-sm">
        {generalError && (
          <p role="alert" className="rounded bg-perigo-fundo p-sm text-perigo">
            {generalError}
          </p>
        )}
        <FormField
          id="email"
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          errors={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={passwordAutoComplete}
          maxLength={72}
          errors={fieldErrors.password}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-primaria px-sm py-xs font-semibold text-superficie transition-colors hover:bg-primaria-forte disabled:cursor-not-allowed disabled:bg-desabilitado disabled:text-texto-suave"
        >
          {submitting ? 'Processando…' : submitLabel}
        </button>
      </form>
    </main>
  )
}
