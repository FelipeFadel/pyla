import { useNavigate } from 'react-router'
import { register } from '../api/authApi'
import { AuthForm } from '../components/AuthForm'

export default function RegisterPage() {
  const navigate = useNavigate()

  return (
    <AuthForm
      tabs={[
        { label: 'Entrar', to: '/login', current: false },
        { label: 'Criar conta', to: '/cadastro', current: true },
      ]}
      footer={{ text: 'Já tem uma conta?', linkLabel: 'Entrar', to: '/login' }}
      submitLabel="Criar conta"
      errorTitle="Erro no cadastro"
      passwordAutoComplete="new-password"
      passwordHint="Mínimo de 8 caracteres, com letra e número"
      onSubmit={async (credentials) => {
        await register(credentials)
        await navigate('/')
      }}
    />
  )
}
