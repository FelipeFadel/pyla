import { useNavigate } from 'react-router'
import { login } from '../api/authApi'
import { AuthForm } from '../components/AuthForm'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <AuthForm
      tabs={[
        { label: 'Entrar', to: '/login', current: true },
        { label: 'Criar conta', to: '/cadastro', current: false },
      ]}
      footer={{ text: 'Não tem uma conta?', linkLabel: 'Criar conta', to: '/cadastro' }}
      submitLabel="Entrar"
      errorTitle="Erro de autenticação"
      passwordAutoComplete="current-password"
      onSubmit={async (credentials) => {
        await login(credentials)
        await navigate('/')
      }}
    />
  )
}
