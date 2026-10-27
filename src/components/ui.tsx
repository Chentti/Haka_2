import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { errorMessage } from '../api/client'
import type { ApiError } from '../api/client'

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600 motion-reduce:animate-none" />
      {label}
    </span>
  )
}

export function FullScreenLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner label={label} />
    </div>
  )
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}

export function LogPoseLocked() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
      <h2 className="text-lg font-bold">🧭 Necesitan el Log Pose</h2>
      <p className="mt-2 text-sm">
        Esta zona es parte del Grand Line. Se desbloquea cuando la tripulación aprueba la inspección
        de Reverse Mountain (CP3).
      </p>
      <Link to="/" className="mt-3 inline-block text-sm font-semibold underline">
        Ver el estado del Log Pose en el dashboard
      </Link>
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
  title = 'No se pudo cargar la información',
}: {
  error: ApiError
  onRetry?: () => void
  title?: string
}) {
  if (error.code === 'LOG_POSE_REQUIRED') return <LogPoseLocked />
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
      <h2 className="font-bold">{error.status === 404 ? 'No encontrado' : title}</h2>
      <p className="mt-1 text-sm">{errorMessage(error)}</p>
      {onRetry && error.status !== 404 && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
      <p className="font-semibold text-slate-800">{title}</p>
      {children && <div className="mt-2 text-sm">{children}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  )
}
