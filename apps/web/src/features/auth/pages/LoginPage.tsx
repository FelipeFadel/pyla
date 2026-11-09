import { useNavigate } from 'react-router'
import { login } from '../api/authApi'
import { AuthForm } from '../components/AuthForm'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Entrar"
      submitLabel="Entrar"
      passwordAutoComplete="current-password"
      onSubmit={async (credentials) => {
        await login(credentials)
        await navigate('/')
      }}
    />
  )
}
