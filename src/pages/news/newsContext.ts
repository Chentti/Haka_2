import type { NewsItem } from '../../api/types'

export interface NewsOutletContext {
  /** El detalle avisa al feed cuando una noticia cambia de estado. */
  updateItem: (item: NewsItem) => void
}
