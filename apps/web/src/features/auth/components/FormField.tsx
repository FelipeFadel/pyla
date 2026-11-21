import { useState } from 'react'

interface FormFieldProps {
  id: string
  label: string
  type: 'email' | 'password'
  value: string
  onChange: (value: string) => void
  autoComplete: string
  placeholder?: string
  maxLength?: number
  errors?: string[]
  hint?: string
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M3 3l18 18" />}
    </svg>
  )
}

export function FormField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  maxLength,
  errors = [],
  hint,
}: FormFieldProps) {
  const [visible, setVisible] = useState(false)
  const errorId = `${id}-erro`
  const hintId = `${id}-dica`
  const hasError = errors.length > 0
  const isPassword = type === 'password'
  const describedBy = hasError ? errorId : hint ? hintId : undefined

  return (
    <div className="flex flex-col gap-xxs">
      <label htmlFor={id} className="text-legenda font-semibold text-texto">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && visible ? 'text' : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          required
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={`w-full rounded border ${hasError ? 'border-perigo' : 'border-desabilitado'} bg-superficie py-xs pl-sm text-texto ${isPassword ? 'pr-xl' : 'pr-sm'}`}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            className="absolute inset-y-0 right-0 flex items-center px-xs text-texto-suave"
          >
            <EyeIcon crossed={visible} />
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-legenda text-texto-suave">
          {hint}
        </p>
      )}
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
