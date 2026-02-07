/**
 * Servicio para obtener datos de CEDEARs argentinos usando yfinance
 * Los precios son en PESOS ARGENTINOS directamente del mercado local (BYMA)
 */

/**
 * Determina la URL del backend basado en el entorno
 * Compatible con desarrollo (localhost) y producción (finanzas.qeva.xyz)
 */
const getBackendUrl = () => {
  // En desarrollo, usar localhost
  if (import.meta.env.MODE === 'development') {
    return import.meta.env.VITE_DEV_BACKEND_URL || 
           import.meta.env.VITE_BACKEND_URL || 
           'http://localhost:8000';
  }
  
  // En producción, usar el dominio actual
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Si estamos en el dominio de producción
  if (hostname === 'finanzas.qeva.xyz') {
    return `${protocol}//finanzas.qeva.xyz`;
  }
  
  // Fallback
  return import.meta.env.VITE_BACKEND_URL || 
         `${protocol}//${hostname}:8000`;
};

const BACKEND_BASE_URL = getBackendUrl();
const YFINANCE_API_URL = `${BACKEND_BASE_URL}/api/yfinance`;

// Funciones de debug
const debugLog = (...args) => console.log('[yfinance]', ...args);
const debugError = (...args) => console.error('[yfinance]', ...args);

// Log de configuración al cargar
debugLog(`🔧 Configuración YFinance:`, {
  entorno: import.meta.env.MODE,
  backendUrl: BACKEND_BASE_URL,
  apiUrl: YFINANCE_API_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A'
});

class YFinanceService {
  constructor() {
    this.cache = {
      cedears: null,
      timestamp: null,
      sectores: null,
    };
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtiene todos los CEDEARs con precios en PESOS ARGENTINOS
   * @param {number} limite - Cantidad de CEDEARs a obtener
   * @param {string} sector - Sector para filtrar (opcional)
   * @param {string} search - Término de búsqueda (opcional)
   */
  async getAllCedears(limite = 30, sector = null, search = null) {
    try {
      const now = new Date().getTime();
      const cacheKey = `${limite}-${sector}-${search || ''}`;
      
      // Verificar cache (solo si no es búsqueda, para búsquedas queremos resultados frescos o cache específico)
      if (this.cache.cedears && 
          this.cache.cacheKey === cacheKey &&
          (now - this.cache.timestamp < this.cacheDuration)) {
        debugLog('🔄 Usando cache para CEDEARs');
        return this.cache.cedears;
      }

      debugLog(`🌐 Obteniendo CEDEARs desde yfinance... (límite: ${limite}, sector: ${sector || 'todos'}, search: ${search || 'none'})`);
      
      const params = new URLSearchParams();
      params.append('limite', limite.toString());
      if (sector) {
        params.append('sector', sector);
      }
      if (search) {
        params.append('search', search);
      }

      const url = `${YFINANCE_API_URL}/cedears?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // El backend retorna {cedears: [...], total: ..., is_demo: ..., timestamp: ...}
      const cedearsArray = data.cedears || data || [];
      debugLog(`✅ ${cedearsArray.length} CEDEARs obtenidos con precios en ARS`, data.is_demo ? '(DEMO)' : '');

      // Guardar en cache
      this.cache.cedears = cedearsArray;
      this.cache.cacheKey = cacheKey;
      this.cache.timestamp = now;

      return cedearsArray;
    } catch (error) {
      debugError('❌ Error en YFinanceService.getAllCedears:', error);
      throw error;
    }
  }

  /**
   * Obtiene detalles de un CEDEAR específico
   * @param {string} ticker - Ticker del CEDEAR (ej: AAPL, GOOGL)
   */
  async getCedearDetalle(ticker) {
    try {
      debugLog(`🌐 Obteniendo detalles de ${ticker}...`);
      
      const url = `${YFINANCE_API_URL}/cedears/${ticker}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`CEDEAR ${ticker} no encontrado`);
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      debugLog(`✅ Detalles de ${ticker} obtenidos:`, data);
      
      return data;
    } catch (error) {
      debugError(`❌ Error en YFinanceService.getCedearDetalle (${ticker}):`, error);
      throw error;
    }
  }

  /**
   * Obtiene histórico de precios de un CEDEAR en PESOS ARGENTINOS
   * @param {string} ticker - Ticker del CEDEAR
   * @param {string} periodo - Período (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
   */
  async getCedearHistorico(ticker, periodo = '1mo') {
    try {
      debugLog(`📊 Obteniendo histórico de ${ticker} (período: ${periodo})...`);
      
      const url = `${YFINANCE_API_URL}/cedears/${ticker}/historico?periodo=${periodo}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      debugLog(`✅ Histórico de ${ticker} obtenido (${data.total_registros} registros)`);
      
      return data;
    } catch (error) {
      debugError(`❌ Error en YFinanceService.getCedearHistorico (${ticker}):`, error);
      throw error;
    }
  }

  /**
   * Busca CEDEARs por nombre o ticker
   * @param {string} query - Texto a buscar
   */
  async buscarCedears(query) {
    try {
      if (!query || query.trim().length < 2) {
        return { resultados: [], total: 0 };
      }

      debugLog(`🔍 Buscando CEDEARs: "${query}"...`);
      
      const url = `${YFINANCE_API_URL}/cedears/buscar/${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      debugLog(`✅ Búsqueda completada: ${data.total} resultados`);
      
      return data;
    } catch (error) {
      debugError(`❌ Error en YFinanceService.buscarCedears:`, error);
      throw error;
    }
  }

  /**
   * Obtiene lista de sectores disponibles
   */
  async getSectores() {
    try {
      const now = new Date().getTime();
      
      // Verificar cache
      if (this.cache.sectores && (now - this.cache.timestamp < this.cacheDuration)) {
        debugLog('🔄 Usando cache para sectores');
        return this.cache.sectores;
      }

      debugLog('🌐 Obteniendo sectores...');
      
      const url = `${YFINANCE_API_URL}/sectores`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      debugLog(`✅ ${data.total} sectores obtenidos`);
      
      // Guardar en cache
      this.cache.sectores = data.sectores;
      this.cache.timestamp = now;

      return data.sectores;
    } catch (error) {
      debugError('❌ Error en YFinanceService.getSectores:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado del servicio
   */
  async healthCheck() {
    try {
      const url = `${YFINANCE_API_URL}/health`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return { status: 'error', message: 'Servicio no disponible' };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      debugError('❌ Error en YFinanceService.healthCheck:', error);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache = {
      cedears: null,
      timestamp: null,
      sectores: null,
    };
    debugLog('🗑️ Cache de yfinance limpiado');
  }
}

const yfinanceService = new YFinanceService();
export default yfinanceService;
