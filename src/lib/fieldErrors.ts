import { errorMessage } from '../api/client'
import type { ApiError } from '../api/client'

export interface FormErrors<F extends string> {
  fields: Partial<Record<F, string>>
  general: string | null
}

/** Reparte los errores del servidor entre los campos del formulario. */
export function toFormErrors<F extends string>(error: ApiError, fields: readonly F[]): FormErrors<F> {
  const result: Partial<Record<string, string>> = {}
  const unmatched: string[] = []
  const isField = (name: string): name is F => (fields as readonly string[]).includes(name)

  for (const detail of error.details) {
    const name = detail.field.split(/[.[\]/]/).filter(Boolean).pop() ?? detail.field
    if (isField(name)) {
      result[name] ??= detail.message
    } else {
      unmatched.push(detail.message)
    }
  }
  if (error.code === 'EMAIL_ALREADY_REGISTERED' && isField('email')) result.email = error.message
  if (error.code === 'TEAM_NAME_TAKEN' && isField('teamName')) result.teamName = error.message

  const hasFieldErrors = Object.keys(result).length > 0
  const general = unmatched.length > 0 ? unmatched.join(' ') : hasFieldErrors ? null : errorMessage(error)
  return { fields: result as Partial<Record<F, string>>, general }
}
