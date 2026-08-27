'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Lee una media query y se mantiene al día con sus cambios.
 *
 * En el servidor devuelve `false`, y en el primer pintado del cliente también,
 * así que el HTML de ambos coincide: nada de errores de hidratación. El valor
 * real llega en cuanto React se conecta.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Puntos de corte que usa la app (los mismos que Tailwind). */
export const MOBILE_QUERY = '(max-width: 767px)';
export const COMPACT_QUERY = '(max-width: 1023px)';
