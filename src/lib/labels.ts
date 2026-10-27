import type { CrewRole, FruitFilter, NewsPriority, NewsStatus, NewsType, WantedSort, WantedStatus } from '../api/types'

export const WANTED_STATUS_LABEL: Record<WantedStatus, string> = {
  AT_LARGE: 'Prófugo',
  CAPTURED: 'Capturado',
  MISSING: 'Desaparecido',
}

export const FRUIT_LABEL: Record<FruitFilter, string> = {
  PARAMECIA: 'Paramecia',
  ZOAN: 'Zoan',
  LOGIA: 'Logia',
  NONE: 'Sin fruta',
}

export const SORT_LABEL: Record<WantedSort, string> = {
  'bounty,desc': 'Mayor recompensa',
  'name,asc': 'Nombre (A-Z)',
  'updatedAt,desc': 'Actualizados recientemente',
}

export const ROLE_LABEL: Record<CrewRole, string> = {
  CAPTAIN: 'Capitán',
  FIRST_MATE: 'Segundo al mando',
  NAVIGATOR: 'Navegante',
  SNIPER: 'Francotirador',
  COOK: 'Cocinero',
  DOCTOR: 'Médico',
  SHIPWRIGHT: 'Carpintero',
  MUSICIAN: 'Músico',
  ARCHAEOLOGIST: 'Arqueólogo',
  HELMSMAN: 'Timonel',
  FIGHTER: 'Combatiente',
}

export const NEWS_TYPE_LABEL: Record<NewsType, string> = {
  BOUNTY_UPDATE: 'Recompensa',
  BATTLE: 'Batalla',
  MARINE_OPERATION: 'Operación de la Marina',
  WORLD_GOVERNMENT: 'Gobierno Mundial',
  DISCOVERY: 'Descubrimiento',
}

export const PRIORITY_LABEL: Record<NewsPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const NEWS_STATUS_LABEL: Record<NewsStatus, string> = {
  RUMOR: 'Rumor',
  CONFIRMED: 'Confirmada',
  DEBUNKED: 'Desmentida',
}

export const WANTED_STATUS_STYLE: Record<WantedStatus, string> = {
  AT_LARGE: 'bg-red-100 text-red-800',
  CAPTURED: 'bg-slate-200 text-slate-700',
  MISSING: 'bg-amber-100 text-amber-800',
}

export const NEWS_STATUS_STYLE: Record<NewsStatus, string> = {
  RUMOR: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  DEBUNKED: 'bg-slate-200 text-slate-700',
}

export const PRIORITY_STYLE: Record<NewsPriority, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-sky-100 text-sky-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-600 text-white',
}
