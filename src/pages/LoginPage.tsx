import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { toApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { getRedirectTarget } from '../auth/redirect'
import { TextField } from '../components/TextField'
import { FullScreenLoader } from '../components/ui'
import { AuthCard } from '../layouts/AuthCard'
import { toFormErrors } from '../lib/fieldErrors'
import type { FormErrors } from '../lib/fieldErrors'

const FIELDS = ['email', 'password'] as const
type Field = (typeof FIELDS)[number]

export default function LoginPage() {
  const { status, login, sessionExpired } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const target = getRedirectTarget(location.state)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors<Field> | null>(null)

  if (status === 'checking') return <FullScreenLoader label="Verificando sesión…" />
  if (status === 'authenticated') return <Navigate to={target} replace />

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setErrors(null)
    try {
      await login(email, password)
      navigate(target, { replace: true })
    } catch (err) {
      setErrors(toFormErrors(toApiError(err), FIELDS))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Iniciar sesión" subtitle="Usa el email y la contraseña de tu tripulación.">
      {sessionExpired && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Tu sesión ya no es válida. Inicia sesión de nuevo.
        </p>
      )}
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <TextField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={setEmail} error={errors?.fields.email} />
        <TextField label="Contraseña" name="password" type="password" autoComplete="current-password" value={password} onChange={setPassword} error={errors?.fields.password} />
        {errors?.general && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {errors.general}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Aún no tienen tripulación?{' '}
        <Link to="/register" state={location.state} className="font-semibold text-sky-700 underline">
          Regístrenla
        </Link>
      </p>
    </AuthCard>
  )
}
