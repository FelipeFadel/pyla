import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError, NetworkError } from '../../../shared/http'
import { isSessionExpired, type NewPlan, type Plan } from '../api/plansApi'
import { NETWORK_MESSAGE } from './planMessages'

interface PlanFormProps {
  onSubmit: (plan: NewPlan) => Promise<void>
  // Com `plan`, o formulário vira o de edição: campos preenchidos, Salvar e Cancelar.
  plan?: Plan
  onCancel?: () => void
}

type FieldErrors = Partial<Record<'name' | 'price', string[]>>

const INVALID_PRICE_MESSAGE = 'Informe um preço válido, como 19,90.'

// Aceita vírgula decimal pt-BR ("19,90"). Entrada que não é número não é enviada.
function parsePrice(text: string): number | undefined {
  const normalized = text.trim().replace(',', '.')
  if (normalized === '') return undefined
  const value = Number(normalized)
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : undefined
}

interface PlanFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  errors?: string[]
  inputMode?: 'decimal'
  autoComplete?: string
}

function PlanField({ id, label, value, onChange, errors = [], inputMode, autoComplete }: PlanFieldProps) {
  const errorId = `${id}-erro`
  const hasError = errors.length > 0

  return (
    <div className="flex flex-col gap-xxs">
      <label htmlFor={id} className="text-legenda font-semibold text-texto">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className={`w-full rounded border ${hasError ? 'border-perigo' : 'border-desabilitado'} bg-superficie px-sm py-xs text-texto`}
      />
      {hasError && (
        <p id={errorId} className="flex items-center gap-xxs text-legenda text-perigo">
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{errors.join(' ')}</span>
        </p>
      )}
    </div>
  )
}

export function PlanForm({ onSubmit, plan, onCancel }: PlanFormProps) {
  const editing = plan !== undefined
  const idPrefix = editing ? 'plan-edit' : 'plan'
  const formRef = useRef<HTMLFormElement>(null)
  const [name, setName] = useState(plan?.name ?? '')
  const [price, setPrice] = useState(plan ? plan.price.toFixed(2).replace('.', ',') : '')
  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string>()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (editing) formRef.current?.querySelector('input')?.focus()
  }, [editing])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError(undefined)
    setFieldErrors({})

    const parsedPrice = parsePrice(price)
    if (parsedPrice === undefined) {
      setFieldErrors({ price: [INVALID_PRICE_MESSAGE] })
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ name, price: parsedPrice })
      if (!editing) {
        setName('')
        setPrice('')
      }
    } catch (error) {
      // 401: o cliente HTTP já está levando ao login; não mostra erro técnico.
      if (isSessionExpired(error)) return
      const details = error instanceof ApiError ? error.details : undefined
      const next: FieldErrors = {}
      for (const { field, messages } of details ?? []) {
        if (field === 'name' || field === 'price') next[field] = messages
      }
      if (Object.keys(next).length > 0) {
        setFieldErrors(next)
      } else if (error instanceof NetworkError) {
        setGeneralError(NETWORK_MESSAGE)
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
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      aria-label={plan ? `Editar plano ${plan.name}` : undefined}
      className="flex flex-col gap-sm"
    >
      {generalError && (
        <div role="alert" className="rounded bg-perigo-fundo p-sm text-perigo">
          {generalError}
        </div>
      )}
      <PlanField
        id={`${idPrefix}-name`}
        label="Nome"
        value={name}
        onChange={setName}
        autoComplete="off"
        errors={fieldErrors.name}
      />
      <PlanField
        id={`${idPrefix}-price`}
        label="Preço (R$)"
        value={price}
        onChange={setPrice}
        inputMode="decimal"
        autoComplete="off"
        errors={fieldErrors.price}
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-primaria px-sm py-xs font-semibold text-superficie transition-colors hover:bg-primaria-forte disabled:cursor-not-allowed disabled:bg-desabilitado disabled:text-texto-suave"
      >
        {editing ? (submitting ? 'Salvando…' : 'Salvar') : submitting ? 'Criando…' : 'Criar plano'}
      </button>
      {editing && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-desabilitado px-sm py-xs font-semibold text-texto"
        >
          Cancelar
        </button>
      )}
    </form>
  )
}
