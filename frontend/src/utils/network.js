/**
 * Utilidades para manejo de red y estado offline
 */

/**
 * Verifica si hay conexión a internet
 * @returns {boolean}
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Inicializa el interceptor global de fetch para manejar errores offline
 * Esto previene que se muestren errores ERR_INTERNET_DISCONNECTED en la consola
 */
export const initOfflineInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const [url, options = {}] = args;
    
    // Si no hay conexión, no intentar el request
    if (!navigator.onLine) {
      console.warn(`🔌 Modo offline: Request cancelado para ${url}`);
      // Retornar una promesa rechazada silenciosamente
      return Promise.reject(new Error('No hay conexión a internet'));
    }
    
    try {
      return await originalFetch(url, options);
    } catch (error) {
      // Si es un error de red típico, no mostrarlo en consola
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        console.warn(`⚠️ Request falló (offline): ${url}`);
      }
      throw error;
    }
  };
};

/**
 * Hace un fetch con manejo de errores offline
 * @param {string} url - URL del request
 * @param {object} options - Opciones de fetch
 * @param {boolean} allowOffline - Si permite retornar cache cuando está offline
 * @returns {Promise<Response>}
 */
export const fetchWithOfflineSupport = async (url, options = {}, allowOffline = true) => {
  // Si no hay conexión y no se permite offline, lanzar error inmediatamente
  if (!isOnline() && !allowOffline) {
    throw new Error('No hay conexión a internet');
  }

  try {
    const response = await fetch(url, {
      ...options,
      // Agregar timeout
      signal: AbortSignal.timeout(10000) // 10 segundos timeout
    });
    
    return response;
  } catch (error) {
    // Si es error de red y se permite offline, intentar cache
    if (allowOffline && (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
      console.warn(`⚠️ Request falló, usando cache: ${url}`);
      throw new Error('OFFLINE_MODE');
    }
    throw error;
  }
};

/**
 * Listener de cambios de estado de conexión
 * @param {Function} onOnline - Callback cuando vuelve la conexión
 * @param {Function} onOffline - Callback cuando se pierde la conexión
 * @returns {Function} - Función para remover los listeners
 */
export const addConnectionListener = (onOnline, onOffline) => {
  const handleOnline = () => onOnline?.();
  const handleOffline = () => onOffline?.();
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
