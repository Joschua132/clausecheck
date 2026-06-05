/**
 * @file useRateLimit.ts
 * @description Client-seitiger Rate Limiter für die Analyse-Funktion.
 * Verhindert versehentliches Doppelklicken und gibt UX-Feedback.
 * Echtes Rate Limiting erfolgt server-seitig in der Vercel Function.
 */

import { useState, useCallback } from 'react';

const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 1000; // 1 Minute
const STORAGE_KEY = 'clausecheck_requests';

export function useRateLimit() {
  const [isLimited, setIsLimited] = useState(false);

  const checkAndRecord = useCallback((): boolean => {
    const now = Date.now();
    const stored: number[] = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) || '[]'
    );

    // Alte Einträge außerhalb des Zeitfensters entfernen
    const recent = stored.filter(ts => now - ts < WINDOW_MS);

    if (recent.length >= MAX_REQUESTS) {
      setIsLimited(true);
      return false;
    }

    recent.push(now);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    setIsLimited(false);
    return true;
  }, []);

  return { checkAndRecord, isLimited };
}
