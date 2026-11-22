import type { Plan } from '../api/plansApi'

const priceFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Intl separa o símbolo do número com espaço não separável; normaliza para "R$ 19,90".
function formatPrice(price: number) {
  return priceFormat.format(price).replace(/ /g, ' ')
}

interface PlanListProps {
  plans: Plan[]
  pendingIds: ReadonlySet<string>
  // Registro dos botões Editar por id, para a página devolver o foco ao fechar a edição.
  editButtons: Map<string, HTMLButtonElement>
  onEdit: (plan: Plan) => void
  onToggleActive: (plan: Plan) => void
  // Registro dos botões Excluir por id, para a página devolver o foco ao cancelar.
  deleteButtons: Map<string, HTMLButtonElement>
  onDelete: (plan: Plan) => void
}

const actionClass =
  'rounded border border-desabilitado px-sm py-xs font-semibold text-texto aria-disabled:cursor-not-allowed aria-disabled:text-texto-suave'

export function PlanList({
  plans,
  pendingIds,
  editButtons,
  onEdit,
  onToggleActive,
  deleteButtons,
  onDelete,
}: PlanListProps) {
  return (
    <table className="w-full text-left">
      <caption className="sr-only">Planos de assinatura</caption>
      <thead>
        <tr className="border-b border-superficie-media text-legenda text-texto-suave">
          <th scope="col" className="py-xs pr-sm font-semibold">
            Nome
          </th>
          <th scope="col" className="py-xs pr-sm font-semibold">
            Preço
          </th>
          <th scope="col" className="py-xs pr-sm font-semibold">
            Estado
          </th>
          <th scope="col" className="py-xs font-semibold">
            Ações
          </th>
        </tr>
      </thead>
      <tbody>
        {plans.map((plan) => (
          <tr key={plan.id} className="border-b border-superficie-media">
            <td className="py-xs pr-sm text-texto">{plan.name}</td>
            <td className="py-xs pr-sm text-texto">{formatPrice(plan.price)}</td>
            <td className="py-xs pr-sm">
              <span
                className={`rounded px-xs py-xxs text-legenda font-semibold ${plan.active ? 'bg-sucesso-fundo text-sucesso' : 'bg-superficie-media text-texto-suave'}`}
              >
                {plan.active ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td className="flex gap-xs py-xs">
              <button
                type="button"
                ref={(element) => {
                  if (element) editButtons.set(plan.id, element)
                  else editButtons.delete(plan.id)
                }}
                aria-label={`Editar plano ${plan.name}`}
                onClick={() => onEdit(plan)}
                className={actionClass}
              >
                Editar
              </button>
              <button
                type="button"
                aria-label={`${plan.active ? 'Desativar' : 'Ativar'} plano ${plan.name}`}
                aria-disabled={pendingIds.has(plan.id)}
                onClick={() => onToggleActive(plan)}
                className={actionClass}
              >
                {plan.active ? 'Desativar' : 'Ativar'}
              </button>
              <button
                type="button"
                ref={(element) => {
                  if (element) deleteButtons.set(plan.id, element)
                  else deleteButtons.delete(plan.id)
                }}
                aria-label={`Excluir plano ${plan.name}`}
                aria-disabled={pendingIds.has(plan.id)}
                onClick={() => onDelete(plan)}
                className={actionClass}
              >
                Excluir
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
