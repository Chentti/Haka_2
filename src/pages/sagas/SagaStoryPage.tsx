import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { getSagaStory } from '../../api/endpoints'
import type { SagaStory } from '../../api/types'
import { ErrorState, Spinner } from '../../components/ui'
import { formatNumber } from '../../lib/format'
import { supportsScrollTimeline, transitionName, usePrefersReducedMotion } from '../../lib/motion'
import { useApi } from '../../lib/useApi'
import { SagaMap } from './SagaMap'

export default function SagaStoryPage() {
  const { id = '' } = useParams()
  const story = useApi(`saga/${id}`, (signal) => getSagaStory(id, signal))

  if (story.loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Spinner label="Descifrando el Poneglyph…" />
      </main>
    )
  }
  if (story.error || !story.data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        {story.error && <ErrorState error={story.error} onRetry={story.reload} />}
        <Link to="/sagas" viewTransition className="mt-4 inline-block font-semibold text-sky-700 underline">
          ← Volver a las sagas
        </Link>
      </main>
    )
  }
  return <Story key={id} story={story.data} />
}

function Story({ story }: { story: SagaStory }) {
  const { saga, map, stages } = story
  const [searchParams, setSearchParams] = useSearchParams()
  const reducedMotion = usePrefersReducedMotion()
  const [scrollTimeline] = useState(supportsScrollTimeline)

  // Etapa inicial desde la URL (?stage=slug). Si no existe, la primera.
  const [initialIndex] = useState(() => Math.max(0, stages.findIndex((s) => s.slug === searchParams.get('stage'))))
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([initialIndex]))
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const progressRef = useRef<HTMLDivElement>(null)

  const active = stages[activeIndex] ?? stages[0]

  // Abrir la URL lleva directo a esa etapa.
  useLayoutEffect(() => {
    const el = sectionRefs.current[initialIndex]
    if (initialIndex > 0 && el) el.scrollIntoView({ block: 'start' })
    else window.scrollTo(0, 0)
  }, [initialIndex])

  // Etapa activa = la sección que cruza la línea central de la pantalla.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index)
          if (Number.isNaN(index)) continue
          if (entry.isIntersecting) {
            setActiveIndex(index)
            setSeen((prev) => (prev.has(index) ? prev : new Set(prev).add(index)))
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )
    for (const el of sectionRefs.current) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [stages.length])

  // La URL siempre indica la etapa activa (replace: no llena el historial).
  const activeSlug = active?.slug
  useEffect(() => {
    if (!activeSlug || searchParams.get('stage') === activeSlug) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('stage', activeSlug)
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  }, [activeSlug, searchParams, setSearchParams])

  // Respaldo sin CSS Scroll-driven Animations: la barra de progreso se mueve con JS.
  useEffect(() => {
    if (scrollTimeline) return
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0
      progressRef.current?.style.setProperty('--scroll-progress', String(ratio))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [scrollTimeline])

  // Navegación por teclado: botones y flechas ← →.
  const goTo = useCallback(
    (index: number) => {
      const target = Math.min(Math.max(index, 0), stages.length - 1)
      const el = sectionRefs.current[target]
      if (!el) return
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
      el.focus({ preventScroll: true })
      setActiveIndex(target)
      setSeen((prev) => (prev.has(target) ? prev : new Set(prev).add(target)))
    },
    [stages.length, reducedMotion],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goTo(activeIndex + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goTo(activeIndex - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, goTo])

  if (!active) return null
  const palette = active.palette
  const themeStyle = {
    '--story-bg': palette.background,
    '--story-surface': palette.surface,
    '--story-primary': palette.primary,
    '--story-accent': palette.accent,
    '--story-text': palette.text,
  } as CSSProperties
  const progress = stages.length > 0 ? (activeIndex + 1) / stages.length : 0

  return (
    <div className="story min-h-screen" style={themeStyle}>
      {/* progreso global de lectura (scroll-driven si hay soporte) */}
      <div className="fixed inset-x-0 top-14 z-30 h-1 bg-black/20">
        <div ref={progressRef} className="scroll-progress h-full bg-[var(--story-accent)]" />
      </div>

      <header className="mx-auto max-w-6xl px-4 pt-8 pb-4">
        <Link to="/sagas" viewTransition className="text-sm font-semibold underline opacity-80 hover:opacity-100">
          ← Todas las sagas
        </Link>
        <p className="mt-4 text-xs font-bold tracking-widest text-[var(--story-accent)] uppercase">Saga {saga.order}</p>
        <h1 className="text-3xl font-black md:text-5xl" style={{ viewTransitionName: transitionName('saga-title', saga.id) }}>
          {saga.title}
        </h1>
        <p className="mt-2 text-lg opacity-90">{saga.subtitle}</p>
        <p className="mt-4 max-w-2xl leading-relaxed opacity-90">{saga.intro}</p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-[40vh] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Panel persistente: mapa, progreso y métricas de la etapa activa */}
        <aside className="sticky top-16 z-20 self-start rounded-2xl bg-[var(--story-surface)] p-3 shadow-lg lg:top-20 lg:p-4" aria-label="Mapa y métricas">
          <div className="aspect-[16/10] max-h-[26vh] w-full lg:max-h-none">
            <SagaMap width={map.width} height={map.height} stages={stages} activeIndex={activeIndex} palette={palette} reducedMotion={reducedMotion} />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Etapa anterior"
              className="rounded-lg bg-[var(--story-bg)] px-3 py-1.5 text-sm font-bold disabled:opacity-40"
            >
              ←
            </button>
            <div className="flex-1">
              <p className="text-xs font-semibold" aria-live="polite">
                Etapa {activeIndex + 1} de {stages.length} · {active.island.name}
              </p>
              <div
                className="mt-1 h-2 rounded-full bg-black/25"
                role="progressbar"
                aria-label="Progreso del recorrido"
                aria-valuemin={1}
                aria-valuemax={stages.length}
                aria-valuenow={activeIndex + 1}
              >
                <div className="stage-progress h-2 rounded-full bg-[var(--story-primary)]" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === stages.length - 1}
              aria-label="Etapa siguiente"
              className="rounded-lg bg-[var(--story-bg)] px-3 py-1.5 text-sm font-bold disabled:opacity-40"
            >
              →
            </button>
          </div>

          <dl className="mt-3 grid grid-cols-4 gap-2 lg:grid-cols-2" aria-live="polite" aria-label={`Métricas de la etapa ${activeIndex + 1}`}>
            {active.metrics.map((metric) => (
              <div key={metric.key} className="rounded-lg bg-[var(--story-bg)] p-2 lg:p-3">
                <dt className="truncate text-[10px] font-semibold uppercase opacity-75 lg:text-xs">{metric.label}</dt>
                <dd className="truncate text-sm font-black lg:text-xl">
                  {formatNumber(metric.value)} <span className="text-[10px] font-semibold opacity-75 lg:text-xs">{metric.unit}</span>
                </dd>
              </div>
            ))}
          </dl>

          <nav aria-label="Etapas de la saga" className="mt-3 hidden lg:block">
            <ol className="flex flex-wrap gap-1">
              {stages.map((stage, i) => (
                <li key={stage.id}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={i === activeIndex ? 'step' : undefined}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${i === activeIndex ? 'bg-[var(--story-primary)] text-[var(--story-bg)]' : 'bg-[var(--story-bg)] opacity-80'}`}
                  >
                    {i + 1}. {stage.island.name}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Narrativa por etapas: el scroll activa cada una */}
        <div className="flex flex-col">
          {stages.map((stage, i) => (
            <section
              key={stage.id}
              id={`stage-${stage.slug}`}
              data-index={i}
              ref={(el) => {
                sectionRefs.current[i] = el
              }}
              tabIndex={-1}
              aria-labelledby={`stage-title-${stage.id}`}
              className="flex min-h-[85vh] scroll-mt-[calc(26vh+11rem)] items-center py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--story-accent)] lg:scroll-mt-24"
            >
              <div
                className={`stage-card w-full rounded-2xl p-6 shadow-xl ${scrollTimeline ? 'stage-reveal' : 'stage-reveal-fallback'} ${i === activeIndex ? 'ring-2 ring-[var(--story-primary)]' : ''}`}
                data-visible={seen.has(i) || i === activeIndex ? 'true' : 'false'}
                style={{ backgroundColor: stage.palette.surface, color: stage.palette.text }}
              >
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: stage.palette.accent }}>
                  Etapa {stage.order} · {stage.island.name}
                </p>
                <h2 id={`stage-title-${stage.id}`} className="mt-1 text-2xl font-black md:text-3xl">
                  {stage.title}
                </h2>
                <div className="mt-4 flex flex-col gap-3 leading-relaxed">
                  {stage.narrative.map((paragraph, p) => (
                    <p key={p}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>
          ))}
          <p className="py-10 text-center text-sm opacity-80">
            Fin del recorrido · {formatNumber(saga.totalDistanceNm)} millas navegadas.{' '}
            <Link to="/sagas" viewTransition className="font-semibold underline">
              Elegir otra saga
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
