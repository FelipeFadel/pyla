import { useEffect, useRef, useState } from 'react'
import { ApiError, NetworkError } from '../../../shared/http'
import {
  createPlan,
  deletePlan,
  isSessionExpired,
  updatePlan,
  type NewPlan,
  type Plan,
  type PlanPatch,
} from '../api/plansApi'
import { usePlans } from '../api/usePlans'
import { DeleteConfirmation } from '../components/DeleteConfirmation'
import { PlanForm } from '../components/PlanForm'
import { PlanList } from '../components/PlanList'
import { NETWORK_MESSAGE, PLAN_NOT_FOUND_MESSAGE } from '../components/planMessages'

export default function PlansAdminPage() {
  const { data, error, loading, refetch } = usePlans()
  const [editingId, setEditingId] = useState<string>()
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set())
  const [confirmingId, setConfirmingId] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const editButtons = useRef(new Map<string, HTMLButtonElement>())
  const deleteButtons = useRef(new Map<string, HTMLButtonElement>())
  const headingRef = useRef<HTMLHeadingElement>(null)
  const noticeRef = useRef<HTMLDivElement>(null)
  // Alvo do foco a aplicar depois do próximo render: id do plano (botão Editar), 'delete:<id>'
  // (botão Excluir), 'notice' ou 'heading'.
  const focusTarget = useRef<string | undefined>(undefined)

  useEffect(() => {
    const target = focusTarget.current
    if (target === undefined) return
    focusTarget.current = undefined
    if (target === 'notice') noticeRef.current?.focus()
    else if (target === 'heading') headingRef.current?.focus()
    else if (target.startsWith('delete:')) deleteButtons.current.get(target.slice(7))?.focus()
    else editButtons.current.get(target)?.focus()
  })

  const editing = data?.find((plan) => plan.id === editingId)
  const confirming = data?.find((plan) => plan.id === confirmingId)

  async function handleCreate(plan: NewPlan) {
    await createPlan(plan)
    refetch()
  }

  function isNotFound(failure: unknown) {
    return failure instanceof ApiError && failure.status === 404
  }

  // O plano sumiu (ex.: excluído em outra aba): avisa, fecha a edição e recarrega a lista.
  function handlePlanGone() {
    setNotice(PLAN_NOT_FOUND_MESSAGE)
    // O botão da linha pode ter sumido: o foco vai para o aviso (role="alert"), alvo estável.
    focusTarget.current = 'notice'
    setEditingId(undefined)
    setConfirmingId(undefined)
    refetch()
  }

  async function handleEdit(plan: Plan, values: NewPlan) {
    setNotice(undefined)
    const patch: PlanPatch = {}
    if (values.name.trim() !== plan.name) patch.name = values.name
    if (values.price !== plan.price) patch.price = values.price
    if (Object.keys(patch).length === 0) {
      closeEdit(plan.id)
      return
    }
    try {
      await updatePlan(plan.id, patch)
    } catch (failure) {
      if (isNotFound(failure)) {
        handlePlanGone()
        return
      }
      throw failure
    }
    closeEdit(plan.id)
    refetch()
  }

  // Fecha a edição devolvendo o foco ao botão "Editar plano X" da linha.
  function closeEdit(planId: string) {
    focusTarget.current = planId
    setEditingId(undefined)
  }

  async function handleToggleActive(plan: Plan) {
    if (pendingIds.has(plan.id)) return
    setNotice(undefined)
    setPendingIds((current) => new Set(current).add(plan.id))
    try {
      await updatePlan(plan.id, { active: !plan.active })
      refetch()
    } catch (failure) {
      if (isNotFound(failure)) handlePlanGone()
      else if (isSessionExpired(failure)) return
      else if (failure instanceof NetworkError) setNotice(NETWORK_MESSAGE)
      else
        setNotice(failure instanceof Error ? failure.message : 'Algo deu errado. Tente novamente.')
    } finally {
      releasePending(plan.id)
    }
  }

  function releasePending(planId: string) {
    setPendingIds((current) => {
      const next = new Set(current)
      next.delete(planId)
      return next
    })
  }

  // Cancelar devolve o foco ao botão "Excluir plano X" da linha.
  function cancelDelete(planId: string) {
    if (pendingIds.has(planId)) return
    focusTarget.current = `delete:${planId}`
    setConfirmingId(undefined)
  }

  async function handleConfirmDelete(plan: Plan) {
    if (pendingIds.has(plan.id)) return
    setNotice(undefined)
    setPendingIds((current) => new Set(current).add(plan.id))
    try {
      await deletePlan(plan.id)
      // Sucesso: o botão da linha some; o foco vai para o título da página, alvo estável.
      focusTarget.current = 'heading'
      setConfirmingId(undefined)
      refetch()
    } catch (failure) {
      if (isNotFound(failure)) {
        handlePlanGone()
        return
      }
      setConfirmingId(undefined)
      if (isSessionExpired(failure)) return
      // 409 (tem assinantes), rede ou outro erro: aviso com foco, o plano permanece na lista.
      setNotice(
        failure instanceof NetworkError
          ? NETWORK_MESSAGE
          : failure instanceof Error
            ? failure.message
            : 'Algo deu errado. Tente novamente.',
      )
      focusTarget.current = 'notice'
    } finally {
      releasePending(plan.id)
    }
  }

  return (
    <main className="mx-auto flex max-w-formulario flex-col gap-md p-sm pt-xl">
      <h1 ref={headingRef} tabIndex={-1} className="font-display text-titulo-pagina text-primaria-forte">Gestão de planos</h1>
      <section aria-label="Lista de planos" className="flex flex-col gap-sm">
        {notice && (
          <div
            ref={noticeRef}
            tabIndex={-1}
            role="alert"
            className="rounded bg-perigo-fundo p-sm text-perigo"
          >
            {notice}
          </div>
        )}
        {loading && !data && (
          <p role="status" className="text-texto-suave">
            Carregando planos…
          </p>
        )}
        {error && !isSessionExpired(error) && (
          <div role="alert" className="flex flex-col gap-xs rounded bg-perigo-fundo p-sm text-perigo">
            <p>{error.message}</p>
            <button
              type="button"
              onClick={refetch}
              className="self-start rounded border border-perigo px-sm py-xs font-semibold"
            >
              Tentar de novo
            </button>
          </div>
        )}
        {data &&
          (data.length === 0 ? (
            <p className="text-texto-suave">
              Nenhum plano cadastrado ainda. Crie o primeiro plano abaixo.
            </p>
          ) : (
            <PlanList
              plans={data}
              pendingIds={pendingIds}
              editButtons={editButtons.current}
              onEdit={(plan) => {
                setNotice(undefined)
                setEditingId(plan.id)
              }}
              onToggleActive={handleToggleActive}
              deleteButtons={deleteButtons.current}
              onDelete={(plan) => {
                if (pendingIds.has(plan.id)) return
                setNotice(undefined)
                setConfirmingId(plan.id)
              }}
            />
          ))}
      </section>
      {confirming && (
        <DeleteConfirmation
          key={confirming.id}
          planName={confirming.name}
          pending={pendingIds.has(confirming.id)}
          onConfirm={() => handleConfirmDelete(confirming)}
          onCancel={() => cancelDelete(confirming.id)}
        />
      )}
      {editing && (
        <section aria-labelledby="editar-plano" className="flex flex-col gap-sm">
          <h2 id="editar-plano" className="text-titulo-card font-semibold text-texto">
            Editar plano
          </h2>
          <PlanForm
            key={editing.id}
            plan={editing}
            onSubmit={(values) => handleEdit(editing, values)}
            onCancel={() => closeEdit(editing.id)}
          />
        </section>
      )}
      <section aria-labelledby="novo-plano" className="flex flex-col gap-sm">
        <h2 id="novo-plano" className="text-titulo-card font-semibold text-texto">
          Novo plano
        </h2>
        <PlanForm onSubmit={handleCreate} />
      </section>
    </main>
  )
}
