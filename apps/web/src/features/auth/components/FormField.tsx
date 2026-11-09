interface FormFieldProps {
  id: string
  label: string
  type: 'email' | 'password'
  value: string
  onChange: (value: string) => void
  autoComplete: string
  maxLength?: number
  errors?: string[]
}

export function FormField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  maxLength,
  errors = [],
}: FormFieldProps) {
  const errorId = `${id}-erro`
  const hasError = errors.length > 0

  return (
    <div className="flex flex-col gap-xxs">
      <label htmlFor={id} className="font-semibold text-texto">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className="rounded border border-texto-suave bg-superficie p-xs text-texto"
      />
      {hasError && (
        <p id={errorId} className="text-legenda text-perigo">
          {errors.join(' ')}
        </p>
      )}
    </div>
  )
}
