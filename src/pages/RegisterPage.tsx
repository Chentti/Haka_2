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

const FIELDS = ['teamName', 'email', 'password'] as const
type Field = (typeof FIELDS)[number]

export default function RegisterPage() {
  const { status, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const target = getRedirectTarget(location.state)

  const [teamName, setTeamName] = useState('')
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
      // El registro devuelve la sesión ya iniciada: entramos directo a la app.
      await register(teamName, email, password)
      navigate(target, { replace: true })
    } catch (err) {
      setErrors(toFormErrors(toApiError(err), FIELDS))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Registrar tripulación" subtitle="Una cuenta por equipo. Los tres integrantes comparten email y contraseña.">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <TextField label="Nombre de la tripulación" name="teamName" autoComplete="organization" value={teamName} onChange={setTeamName} error={errors?.fields.teamName} />
        <TextField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={setEmail} error={errors?.fields.email} />
        <TextField label="Contraseña (8 a 72 caracteres)" name="password" type="password" autoComplete="new-password" value={password} onChange={setPassword} error={errors?.fields.password} />
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
          {submitting ? 'Registrando…' : 'Registrar y zarpar'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Ya tienen cuenta?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-sky-700 underline">
          Inicien sesión
        </Link>
      </p>
    </AuthCard>
  )
}
