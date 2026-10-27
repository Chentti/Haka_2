import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <p className="text-6xl font-black text-sky-800">404</p>
      <h1 className="text-xl font-bold text-slate-900">Esta isla no aparece en ningún mapa</h1>
      <p className="max-w-sm text-sm text-slate-600">La ruta que buscas no existe. Revisa la dirección o vuelve a puerto seguro.</p>
      <Link to="/" className="rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800">
        Volver al inicio
      </Link>
    </main>
  )
}
