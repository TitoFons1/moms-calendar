'use client';

import { useSyncExternalStore } from 'react';

/**
 * "Reloj" compartido: avisa a los componentes cada 15 segundos.
 * Es un sistema externo (el tiempo), así que se lee con useSyncExternalStore
 * en lugar de con setState dentro de un efecto.
 */
const INTERVAL_MS = 15_000;

const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, INTERVAL_MS);
  return () => clearInterval(id);
};

// El snapshot debe ser estable entre avisos: usamos el "cubo" de 15 s.
const getSnapshot = () => Math.floor(Date.now() / INTERVAL_MS);
const getServerSnapshot = () => 0;

export const useNowTick = (): number =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
