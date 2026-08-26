import CalendarWrapper from '../components/Calendar/CalendarView';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mom's Calendar</h1>
          <p className="text-slate-500">Gestión de vistas, deposiciones y llamadas</p>
        </header>

        <div className="flex-1">
          <CalendarWrapper />
        </div>

        <footer className="mt-8 rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-100 px-6 py-4 text-center shadow-sm">
          <p className="text-lg font-semibold tracking-wide text-pink-700">
            Aun sigo trabajando en ello mama <span className="text-2xl">💖</span>
          </p>
        </footer>
      </div>
    </main>
  );
}