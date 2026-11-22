import { useEffect, useRef } from 'react'

interface DeleteConfirmationProps {
  planName: string
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmation({ planName, pending, onConfirm, onCancel }: DeleteConfirmationProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Ao abrir, o foco vai para o botão seguro (Cancelar).
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  return (
    <div
      role="alertdialog"
      aria-labelledby="excluir-plano-titulo"
      aria-describedby="excluir-plano-descricao"
      className="flex flex-col gap-sm rounded border border-perigo bg-perigo-fundo p-sm"
    >
      <p id="excluir-plano-titulo" className="font-semibold text-texto">
        Excluir o plano {planName}?
      </p>
      <p id="excluir-plano-descricao" className="text-texto">
        Esta ação não pode ser desfeita.
      </p>
      <div className="flex gap-xs">
        <button
          type="button"
          aria-disabled={pending}
          onClick={onConfirm}
          className="rounded bg-perigo px-sm py-xs font-semibold text-superficie aria-disabled:cursor-not-allowed aria-disabled:bg-desabilitado aria-disabled:text-texto-suave"
        >
          Confirmar exclusão
        </button>
        <button
          type="button"
          ref={cancelRef}
          onClick={onCancel}
          className="rounded border border-desabilitado px-sm py-xs font-semibold text-texto"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
