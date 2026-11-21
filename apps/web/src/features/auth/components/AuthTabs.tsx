import { Link } from 'react-router'

export interface AuthTab {
  label: string
  to: string
  current: boolean
}

interface AuthTabsProps {
  tabs: AuthTab[]
}

export function AuthTabs({ tabs }: AuthTabsProps) {
  return (
    <nav
      aria-label="Entrar ou criar conta"
      className="grid grid-cols-2 gap-xxs rounded bg-superficie-media p-xxs"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          aria-current={tab.current ? 'page' : undefined}
          className={
            tab.current
              ? 'rounded bg-primaria py-xs text-center font-semibold text-superficie'
              : 'rounded py-xs text-center text-texto-suave'
          }
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
