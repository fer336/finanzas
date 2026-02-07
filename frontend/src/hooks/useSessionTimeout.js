import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook para manejar timeout de sesión por inactividad
 * @param {Function} onTimeout - Callback cuando expira la sesión
 * @param {number} timeoutMinutes - Minutos de inactividad antes de cerrar sesión (default: 10)
 * @param {number} warningMinutes - Minutos antes del timeout para mostrar advertencia (default: 2)
 * @returns {Object} - Estado y funciones del timeout
 */
export const useSessionTimeout = (onTimeout, timeoutMinutes = 10, warningMinutes = 2) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  
  const timeoutIdRef = useRef(null);
  const warningTimeoutIdRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const TIMEOUT_MS = timeoutMinutes * 60 * 1000;
  const WARNING_MS = (timeoutMinutes - warningMinutes) * 60 * 1000;

  // Limpiar todos los timers
  const clearAllTimers = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (warningTimeoutIdRef.current) {
      clearTimeout(warningTimeoutIdRef.current);
      warningTimeoutIdRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Función para cerrar sesión
  const handleTimeout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    console.warn('🔒 Sesión cerrada por inactividad');
    onTimeout();
  }, [onTimeout, clearAllTimers]);

  // Función para mostrar advertencia
  const showWarningModal = useCallback(() => {
    setShowWarning(true);
    const warningDurationSeconds = warningMinutes * 60;
    setRemainingSeconds(warningDurationSeconds);

    // Countdown cada segundo
    countdownIntervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningMinutes, handleTimeout]);

  // Resetear el timer de inactividad
  const resetTimeout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    // Timer para la advertencia
    warningTimeoutIdRef.current = setTimeout(() => {
      showWarningModal();
    }, WARNING_MS);

    // Timer para el timeout final
    timeoutIdRef.current = setTimeout(() => {
      handleTimeout();
    }, TIMEOUT_MS);
  }, [TIMEOUT_MS, WARNING_MS, showWarningModal, handleTimeout, clearAllTimers]);

  // Eventos que resetean el timer
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  // Handler de eventos de actividad con throttle
  const handleActivity = useCallback(() => {
    const now = Date.now();
    // Throttle: solo resetear si han pasado al menos 1 segundo desde la última actividad
    if (now - lastActivityRef.current > 1000) {
      resetTimeout();
    }
  }, [resetTimeout]);

  // Extender sesión manualmente (botón "Seguir conectado")
  const extendSession = useCallback(() => {
    console.log('✅ Sesión extendida por el usuario');
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    // Iniciar el timer al montar
    resetTimeout();

    // Agregar listeners de actividad
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Listener para detectar cambios de visibilidad (cuando el usuario vuelve al tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const inactiveTime = Date.now() - lastActivityRef.current;
        // Si estuvo inactivo más del tiempo permitido, cerrar sesión
        if (inactiveTime > TIMEOUT_MS) {
          handleTimeout();
        } else if (inactiveTime > WARNING_MS) {
          // Mostrar advertencia si está cerca del timeout
          showWarningModal();
        } else {
          // Resetear si aún está dentro del tiempo
          resetTimeout();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearAllTimers();
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    resetTimeout,
    handleActivity,
    handleTimeout,
    showWarningModal,
    clearAllTimers,
    TIMEOUT_MS,
    WARNING_MS
  ]);

  return {
    showWarning,
    remainingSeconds,
    extendSession,
    resetTimeout
  };
};

