import { useNavigate } from 'react-router'
import { register } from '../api/authApi'
import { AuthForm } from '../components/AuthForm'

export default function RegisterPage() {
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Criar conta"
      submitLabel="Criar conta"
      passwordAutoComplete="new-password"
      onSubmit={async (credentials) => {
        await register(credentials)
        await navigate('/')
      }}
    />
  )
}
