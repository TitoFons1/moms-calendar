import CalendarWrapper from '../components/Calendar/CalendarView';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
  return (
    /* Alto de pantalla en todos los tamaños: así el calendario tiene un alto
       definido y es él quien se desplaza por dentro, no la página entera.
       El `min-h` es la red de seguridad: si la ventana es muy baja — móvil en
       horizontal, o el navegador con mucho zoom — se desplaza la página en
       lugar de aplastar el calendario. */
    <main className="app-shell flex h-dvh min-h-[600px] flex-col gap-2.5 bg-app-bg sm:min-h-[620px] sm:gap-3">
      {/* ---------------- Cabecera ---------------- */}
      <header className="anim-fade-up flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl lg:text-3xl">
            Mom&apos;s Calendar
          </h1>
          <p className="hidden text-[13px] text-ink-soft sm:block sm:text-[14px]">
            Agenda de vistas, deposiciones y llamadas
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* ---------------- Calendario (ocupa todo el alto libre) ----------------
          Aparece con `anim-fade-in` (solo opacidad) y no con `anim-fade-up`:
          animar `transform` convertiría este div en bloque contenedor de los
          diálogos `position: fixed` que viven dentro de la tarjeta, y en móvil
          se recortarían en vez de ocupar toda la pantalla. */}
      <div className="anim-fade-in delay-1 min-h-0 flex-1">
        <CalendarWrapper />
      </div>

      {/* ---------------- Footer ---------------- */}
      <footer className="anim-fade-up delay-2 shrink-0 rounded-2xl border border-line bg-panel px-3.5 py-2.5 sm:px-5 sm:py-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <p className="text-[12.5px] leading-snug text-ink-soft sm:text-[13.5px]">
            <span className="font-semibold text-ink">Para mi señora madre </span>
            la abogada más brillante y la mujer más valiente que conozco.
            <span className="hidden sm:inline">
              {' '}Que cada cita de este calendario te traiga días tranquilos.
            </span>
          </p>
          <div className="flex items-center gap-4 lg:shrink-0">
            <span className="hidden h-8 w-px bg-line lg:block" aria-hidden />
            <p className="text-[11.5px] leading-snug text-ink-soft sm:text-[12.5px]">
              <span className="font-bold text-ink">Mom&apos;s Calendar</span>
              <span className="mx-1.5 opacity-40">·</span>
              <span className="hidden sm:inline">Desarrollado por </span>
              Roberto Latino
              <span className="mx-1.5 opacity-40">·</span>
              <span className="tabular-nums">© 2026</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
