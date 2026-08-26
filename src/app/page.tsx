import CalendarWrapper from '../components/Calendar/CalendarView';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
  return (
    <main className="flex h-dvh min-h-[640px] flex-col gap-3 bg-app-bg px-4 py-4 sm:px-6">
      {/* ---------------- Cabecera ---------------- */}
      <header className="anim-fade-up flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Mom&apos;s Calendar
          </h1>
          <p className="text-[14px] text-ink-soft">
            Agenda de vistas, deposiciones y llamadas
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* ---------------- Calendario (ocupa todo el alto libre) ---------------- */}
      <div className="anim-fade-up delay-1 min-h-0 flex-1">
        <CalendarWrapper />
      </div>

      {/* ---------------- Footer ---------------- */}
      <footer className="anim-fade-up delay-2 shrink-0 rounded-2xl border border-line bg-panel px-5 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="text-[13.5px] leading-snug text-ink-soft">
            <span className="font-semibold text-ink">Para mi señora madre</span>
            <span className="mx-1.5" aria-hidden>💖</span>
            la abogada más brillante y la mujer más valiente que conozco.
            Que cada cita de este calendario te traiga días tranquilos.
          </p>
          <div className="flex items-center gap-4 sm:shrink-0">
            <span className="hidden h-8 w-px bg-line sm:block" aria-hidden />
            <p className="text-[12.5px] leading-snug text-ink-soft">
              <span className="font-bold text-ink">Mom&apos;s Calendar</span>
              <span className="mx-1.5 opacity-40">·</span>
              Desarrollado por Roberto Latino
              <span className="mx-1.5 opacity-40">·</span>
              <span className="tabular-nums">© 2026</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
