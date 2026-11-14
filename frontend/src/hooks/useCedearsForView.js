import { useCallback, useEffect, useRef, useState } from 'react';
import yfinanceService from '../services/yfinanceService';

// Views that render CEDEAR data. Other views never trigger the Yahoo download,
// which is slow on a cold backend cache.
const CEDEAR_VIEWS = new Set(['cedears', 'inversiones']);
const CEDEARS_LIMIT = 30;

export function useCedearsForView(currentView) {
  const [cedears, setCedears] = useState([]);
  const loadedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const data = await yfinanceService.getAllCedears(CEDEARS_LIMIT);
      setCedears(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error cargando CEDEARs:', error);
    }
  }, []);

  useEffect(() => {
    if (!CEDEAR_VIEWS.has(currentView) || loadedRef.current) return;
    loadedRef.current = true;
    refresh();
  }, [currentView, refresh]);

  return { cedears, setCedears, refresh };
}

export default useCedearsForView;
