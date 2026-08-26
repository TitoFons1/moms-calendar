'use client';

import { useEffect } from 'react';
import { clockInZone, minutesInZone } from '../../lib/settings';
import { useNowTick } from '../../lib/useNowTick';

type Line = {
  kind: 'local' | 'lawyer';
  timeZone: string;
  label: string;
  color: string;
  enabled: boolean;
};

type Props = {
  /** Contenedor del calendario (la tarjeta) donde buscamos la rejilla. */
  rootRef: React.RefObject<HTMLDivElement | null>;
  view: string;
  /** Franja visible del calendario, para situar la línea con precisión. */
  startHour: number;
  endHour: number;
  localTimeZone: string;
  localLabel: string;
  lawyerTimeZone: string;
  lawyerLabel: string;
  showLocal: boolean;
  showLawyer: boolean;
};

const CLASS = 'now-line';

/**
 * Dos líneas de "ahora" sobre la rejilla: la hora de aquí y la del despacho.
 *
 * Se pintan con DOM directo dentro de `.rbc-time-content` (que es el elemento
 * con scroll), así que acompañan al desplazamiento sin escuchar eventos.
 * react-big-calendar solo sabe dibujar una línea, de ahí que la suya se oculte
 * por CSS y estas dos las gestionemos aquí.
 */
export default function NowIndicators({
  rootRef,
  view,
  startHour,
  endHour,
  localTimeZone,
  localLabel,
  lawyerTimeZone,
  lawyerLabel,
  showLocal,
  showLawyer,
}: Props) {
  const tick = useNowTick();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const lines: Line[] = [
      { kind: 'local', timeZone: localTimeZone, label: localLabel, color: 'var(--now)', enabled: showLocal },
      { kind: 'lawyer', timeZone: lawyerTimeZone, label: lawyerLabel, color: 'var(--now-2)', enabled: showLawyer },
    ];

    const draw = () => {
      const content = root.querySelector<HTMLElement>('.rbc-time-content');
      if (!content) {
        root.querySelectorAll(`.${CLASS}`).forEach((node) => node.remove());
        return;
      }
      if (getComputedStyle(content).position === 'static') content.style.position = 'relative';

      const column = content.querySelector<HTMLElement>('.rbc-day-slot');
      const gridHeight = column?.offsetHeight || content.scrollHeight;
      const totalMinutes = Math.max(1, (endHour - startHour) * 60);
      const now = new Date();

      lines.forEach((line) => {
        const selector = `.${CLASS}[data-kind="${line.kind}"]`;
        let node = content.querySelector<HTMLElement>(selector);

        if (!line.enabled) {
          node?.remove();
          return;
        }

        const minutes = minutesInZone(now, line.timeZone);
        const offset = ((minutes - startHour * 60) / totalMinutes) * gridHeight;
        const insideRange = minutes >= startHour * 60 && minutes <= endHour * 60;

        if (!insideRange) {
          node?.remove();
          return;
        }

        if (!node) {
          node = document.createElement('div');
          node.className = CLASS;
          node.dataset.kind = line.kind;
          node.innerHTML = `<span class="${CLASS}__dot"></span><span class="${CLASS}__pill"></span>`;
          content.appendChild(node);
        }

        node.style.setProperty('--now-line-color', line.color);
        node.style.top = `${offset}px`;
        node.title = `${line.label} · ${clockInZone(now, line.timeZone)}`;
        const pill = node.querySelector<HTMLElement>(`.${CLASS}__pill`);
        if (pill) pill.textContent = clockInZone(now, line.timeZone);
      });
    };

    draw();
    // La rejilla puede repintarse justo después de montar (scroll inicial, datos).
    const retry = window.setTimeout(draw, 300);

    return () => {
      window.clearTimeout(retry);
      root.querySelectorAll(`.${CLASS}`).forEach((node) => node.remove());
    };
  }, [
    rootRef,
    view,
    startHour,
    endHour,
    localTimeZone,
    localLabel,
    lawyerTimeZone,
    lawyerLabel,
    showLocal,
    showLawyer,
    tick,
  ]);

  return null;
}
