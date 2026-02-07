/**
 * SERVICIOS API - FASTAPI BACKEND (PostgreSQL)
 * Conecta directamente al backend FastAPI en localhost:8000
 */

// Configuración del backend FastAPI - FORZAR LOCALHOST EN DESARROLLO
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? '/api/v1'  // En producción usa proxy
  : 'http://localhost:8000/api/v1';  // En desarrollo usa localhost directo

// Debug logging
const IS_PRODUCTION = import.meta.env.MODE === 'production';
const debugLog = IS_PRODUCTION ? () => {} : console.log;
const debugError = IS_PRODUCTION ? () => {} : console.error;
const debugWarn = IS_PRODUCTION ? () => {} : console.warn;

// 📦 Función auxiliar para hacer requests
const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', data = null, params = null } = options;
  
  try {
    // Ensure endpoint starts with /
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    
    // Add trailing slash if not present and no ID in path
    // (FastAPI redirects without trailing slash)
    if (!endpoint.endsWith('/') && !endpoint.match(/\/[a-f0-9-]{36}$/i)) {
      endpoint = endpoint + '/';
    }
    
    // Construir URL with query params si existen
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }
    
    debugLog(`🌐 API Request: ${method} ${url}`);
    if (data) debugLog('📤 Request data:', data);
    
    // 🔐 Obtener token JWT del localStorage
    const token = localStorage.getItem('auth_token');
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // 🔐 Agregar token de autorización si existe
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      debugLog('🔑 Auth token included');
    } else {
      debugWarn('⚠️ No auth token found in localStorage');
    }
    
    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, config);
    
    debugLog(`📥 API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      debugError('❌ API Error:', errorData);
      
      // 🔒 Manejo especial para errores de autenticación
      if (response.status === 401 || response.status === 403) {
        console.warn('🔒 Sesión expirada o no autorizada. Redirigiendo al login...');
        
        // Limpiar datos de autenticación
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('last_activity');
        
        // Mostrar mensaje al usuario
        const isTokenExpired = errorData.detail?.toLowerCase().includes('token') || 
                               errorData.detail?.toLowerCase().includes('expired') ||
                               errorData.detail?.toLowerCase().includes('invalid');
        
        if (isTokenExpired) {
          // Redirigir con parámetro de sesión expirada
          window.location.href = '/?session_expired=true';
        } else {
          // Error de autorización (no tiene permisos)
          window.location.href = '/?auth=unauthorized';
        }
        
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }
    
    // Si es 204 No Content, no hay body que parsear
    if (response.status === 204) {
      debugLog('✅ API Response: 204 No Content');
      return null;
    }
    
    const result = await response.json();
    debugLog('✅ API Response data:', result);
    return result;
    
  } catch (error) {
    debugError('❌ API Request failed:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// 💳 TRANSACCIONES API
// ═══════════════════════════════════════════════════════════════
const transaccionesApi = {
  async getAll(limit = 100, offset = 0, filters = {}) {
    debugLog('🔵 transaccionesApi.getAll called:', { limit, offset, filters });
    const params = { limit, offset };

    // Add date filters if provided
    if (filters.fecha_desde) {
      params.fecha_desde = filters.fecha_desde;
    }
    if (filters.fecha_hasta) {
      params.fecha_hasta = filters.fecha_hasta;
    }

    // Add other filters
    if (filters.tipo) {
      params.tipo = filters.tipo;
    }
    if (filters.categoria_id) {
      params.categoria_id = filters.categoria_id;
    }

    const result = await apiRequest('/transacciones', { params });
    debugLog('🔵 transaccionesApi.getAll result:', result ? `${result.list?.length || 0} items` : 'null');
    return result;
  },

  async getById(id) {
    return await apiRequest(`/transacciones/${id}`);
  },

  async create(data) {
    return await apiRequest('/transacciones', { method: 'POST', data });
  },

  async update(id, data) {
    return await apiRequest(`/transacciones/${id}`, { method: 'PATCH', data });
  },

  async delete(id) {
    return await apiRequest(`/transacciones/${id}`, { method: 'DELETE' });
  },

  async bulkDelete(ids) {
    debugLog('🗑️ transaccionesApi.bulkDelete called:', { count: ids.length });
    return await apiRequest('/transacciones/bulk-delete', { method: 'POST', data: { ids } });
  },

  async bulkCreate(transactions) {
    debugLog('📦 transaccionesApi.bulkCreate called:', { count: transactions.length });
    return await apiRequest('/transacciones/bulk-create', { method: 'POST', data: { transactions } });
  },

  async downloadCsvTemplate() {
    debugLog('📥 transaccionesApi.downloadCsvTemplate called');
    const response = await fetch(`${API_BASE_URL}/transacciones/csv-template`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_transacciones.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async getEstadisticas(fecha_desde, fecha_hasta) {
    debugLog('📊 transaccionesApi.getEstadisticas called:', { fecha_desde, fecha_hasta });
    const params = { fecha_desde, fecha_hasta };
    const result = await apiRequest('/transacciones/estadisticas/', { params });
    debugLog('📊 transaccionesApi.getEstadisticas result:', result);
    return result;
  }
};

// 💰 Presupuestos API
const presupuestosApi = {
  async getAll(limit = 100, offset = 0, activo = null, categoria_id = null) {
    debugLog('💰 presupuestosApi.getAll called', { limit, offset, activo, categoria_id });
    const params = { limit, offset };
    if (activo !== null) params.activo = activo;
    if (categoria_id) params.categoria_id = categoria_id;
    return await apiRequest('/presupuestos', { params });
  },

  async getActive() {
    debugLog('💰 presupuestosApi.getActive called');
    return await apiRequest('/presupuestos/active');
  },

  async getById(id) {
    return await apiRequest(`/presupuestos/${id}`);
  },

  async create(data) {
    return await apiRequest('/presupuestos', { method: 'POST', data });
  },

  async update(id, data) {
    return await apiRequest(`/presupuestos/${id}`, { method: 'PATCH', data });
  },

  async delete(id) {
    return await apiRequest(`/presupuestos/${id}`, { method: 'DELETE' });
  },

  async analyzePurchase(data) {
    debugLog('🤔 presupuestosApi.analyzePurchase called:', data);
    return await apiRequest('/presupuestos/analyze-purchase', { method: 'POST', data });
  }
};

// ═══════════════════════════════════════════════════════════════
// 💰 PAGOS PENDIENTES API
// ═══════════════════════════════════════════════════════════════
const pagosPendientesApi = {
  async getAll(limit = 100, offset = 0) {
    debugLog('🔵 pagosPendientesApi.getAll called:', { limit, offset });
    const params = { limit, offset };
    const result = await apiRequest('/pagos-pendientes', { params });
    debugLog('🔵 pagosPendientesApi.getAll result:', result ? `${result.list?.length || 0} items` : 'null');
    return result;
  },

  async getById(id) {
    return await apiRequest(`/pagos-pendientes/${id}`);
  },

  async create(data) {
    debugLog('📝 Creating pending payment:', data);
    return await apiRequest('/pagos-pendientes', { method: 'POST', data });
  },

  async update(id, data) {
    debugLog('✏️ Updating pending payment:', id, data);
    return await apiRequest(`/pagos-pendientes/${id}`, { method: 'PATCH', data });
  },

  async delete(id) {
    return await apiRequest(`/pagos-pendientes/${id}`, { method: 'DELETE' });
  },

  async getDashboardStats() {
    return await apiRequest('/pagos-pendientes/dashboard-stats');
  }
};

// ═══════════════════════════════════════════════════════════════
// 📁 CATEGORÍAS API
// ═══════════════════════════════════════════════════════════════
const categoriasApi = {
  async getAll(limit = 500, offset = 0) {
    const params = { limit, offset };
    return await apiRequest('/categories', { params });
  },

  async getById(id) {
    return await apiRequest(`/categories/${id}`);
  },

  async create(data) {
    return await apiRequest('/categories', { method: 'POST', data });
  },

  async update(id, data) {
    return await apiRequest(`/categories/${id}`, { method: 'PATCH', data });
  },

  async delete(id) {
    return await apiRequest(`/categories/${id}`, { method: 'DELETE' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 💳 MÉTODOS DE PAGO API
// ═══════════════════════════════════════════════════════════════
const metodosPagoApi = {
  async getAll(limit = 500, offset = 0) {
    const params = { limit, offset };
    return await apiRequest('/payment-methods', { params });
  },

  async getById(id) {
    return await apiRequest(`/payment-methods/${id}`);
  },

  async create(data) {
    return await apiRequest('/payment-methods', { method: 'POST', data });
  },

  async update(id, data) {
    return await apiRequest(`/payment-methods/${id}`, { method: 'PATCH', data });
  },

  async delete(id) {
    return await apiRequest(`/payment-methods/${id}`, { method: 'DELETE' });
  }
};

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// 📁 FILES API (MinIO)
// ═══════════════════════════════════════════════════════════════
const filesApi = {
  /**
   * Eliminar archivo de MinIO
   * @param {string} fileUrl - URL completa del archivo (ej: https://s3.qeva.xyz/facturas/comprobantes/file.jpg)
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteFile(fileUrl) {
    debugLog('🗑️ filesApi.deleteFile called:', fileUrl);
    
    try {
      // Extraer object_name de la URL
      // Formato: https://s3.qeva.xyz/facturas/comprobantes/2025-11-23-xxxxx.jpg
      // Necesitamos: comprobantes/2025-11-23-xxxxx.jpg
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      // Eliminar el primer elemento vacío y el bucket name
      const objectName = pathParts.slice(2).join('/'); // comprobantes/file.jpg
      
      debugLog('🗑️ Extracted object_name:', objectName);
      
      // Usar URL completa en desarrollo
      const baseUrl = import.meta.env.MODE === 'production' 
        ? '' 
        : 'http://localhost:8000';
      const endpoint = `${baseUrl}/api/files/delete?object_name=${encodeURIComponent(objectName)}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Delete failed' }));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      debugLog('✅ File deleted successfully:', result);
      return result;
      
    } catch (error) {
      debugError('❌ Error deleting file from MinIO:', error);
      throw error;
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// 🏦 RESÚMENES BANCARIOS API
// ═══════════════════════════════════════════════════════════════
const resumenesBancariosApi = {
  async getAll(limit = 100, offset = 0) {
    const params = { limit, offset };
    return await apiRequest('/resumenes-bancarios', { params });
  },

  async getById(id) {
    return await apiRequest(`/resumenes-bancarios/${id}`);
  },

  async create(data) {
    return await apiRequest('/resumenes-bancarios', { method: 'POST', data });
  },

  async update(id, data) {
    return await apiRequest(`/resumenes-bancarios/${id}`, { method: 'PATCH', data });
  },

  async delete(id) {
    return await apiRequest(`/resumenes-bancarios/${id}`, { method: 'DELETE' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 💳 PAGOS API (Registrar pagos de pending payments y bank summaries)
// ═══════════════════════════════════════════════════════════════
const pagosApi = {
  async registrarPago(pagoData) {
    return await apiRequest('/pagos/registrar', { method: 'POST', data: pagoData });
  },
  
  async deshacerPago(itemId, itemType, eliminarTransacciones = true, transaccionIds = [], moneda = null) {
    return await apiRequest(`/pagos/deshacer/${itemId}`, {
      method: 'POST',
      data: {
        item_type: itemType,
        eliminar_transacciones: eliminarTransacciones,
        transaccion_ids: transaccionIds,
        moneda: moneda  // 'ARS', 'USD', o null para deshacer todo
      }
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// 🎯 OBJETIVOS DE AHORRO API
// ═══════════════════════════════════════════════════════════════
const objetivosApi = {
  // Obtener todos los objetivos
  async getAll(usuario_id = null, estado = null) {
    debugLog('🎯 objetivosApi.getAll called', { usuario_id, estado });
    const params = {};
    if (usuario_id) params.usuario_id = usuario_id;
    if (estado) params.estado = estado;
    return await apiRequest('/objetivos', { params });
  },

  // Obtener solo objetivos activos
  async getActive(usuario_id = null) {
    debugLog('🎯 objetivosApi.getActive called', { usuario_id });
    const params = {};
    if (usuario_id) params.usuario_id = usuario_id;
    return await apiRequest('/objetivos/active', { params });
  },

  // Obtener estadísticas
  async getStats(usuario_id = null) {
    debugLog('🎯 objetivosApi.getStats called', { usuario_id });
    const params = {};
    if (usuario_id) params.usuario_id = usuario_id;
    return await apiRequest('/objetivos/stats', { params });
  },

  // Obtener un objetivo por ID
  async getById(id) {
    debugLog('🎯 objetivosApi.getById called', { id });
    return await apiRequest(`/objetivos/${id}`);
  },

  // Crear un nuevo objetivo
  async create(objetivoData) {
    debugLog('🎯 objetivosApi.create called', { objetivoData });
    return await apiRequest('/objetivos', {
      method: 'POST',
      data: objetivoData
    });
  },

  // Actualizar un objetivo
  async update(id, objetivoData) {
    debugLog('🎯 objetivosApi.update called', { id, objetivoData });
    return await apiRequest(`/objetivos/${id}`, {
      method: 'PUT',
      data: objetivoData
    });
  },

  // Eliminar un objetivo
  async delete(id) {
    debugLog('🎯 objetivosApi.delete called', { id });
    return await apiRequest(`/objetivos/${id}`, {
      method: 'DELETE'
    });
  },

  // === APORTES ===
  
  // Agregar un aporte a un objetivo
  async addContribution(aporteData) {
    debugLog('🎯 objetivosApi.addContribution called', { aporteData });
    return await apiRequest('/objetivos/aportes', {
      method: 'POST',
      data: aporteData
    });
  },

  // Obtener aportes de un objetivo
  async getContributions(objetivo_id) {
    debugLog('🎯 objetivosApi.getContributions called', { objetivo_id });
    return await apiRequest(`/objetivos/${objetivo_id}/aportes`);
  },

  // Eliminar un aporte
  async deleteContribution(aporte_id) {
    debugLog('🎯 objetivosApi.deleteContribution called', { aporte_id });
    return await apiRequest(`/objetivos/aportes/${aporte_id}`, {
      method: 'DELETE'
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// 💳 TARJETAS DE CRÉDITO API
// ═══════════════════════════════════════════════════════════════
const tarjetasApi = {
  // Obtener deuda total y detalle (por mes)
  async getDeuda(mes = null, usuario_id = null) {
    debugLog('💳 tarjetasApi.getDeuda called', { mes, usuario_id });
    const params = {};
    if (mes) params.mes = mes;
    if (usuario_id) params.user_id = usuario_id;
    return await apiRequest('/transacciones/tarjetas/deuda', {
      method: 'GET',
      params
    });
  },

  // Resumen mensual de gastos con tarjeta
  async getResumenMensual(monthsBack = 12) {
    debugLog('💳 tarjetasApi.getResumenMensual called', { monthsBack });
    return await apiRequest('/transacciones/tarjetas/resumen-mensual', {
      method: 'GET',
      params: { months_back: monthsBack }
    });
  },

  // Pagar resumen de tarjeta
  async pagarResumen(data) {
    debugLog('💳 tarjetasApi.pagarResumen called', data);
    return await apiRequest('/transacciones/tarjetas/pagar-resumen', {
      method: 'POST',
      data
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// 💱 MONEDAS USUARIO API (Monedas Personalizadas)
// ═══════════════════════════════════════════════════════════════
const monedasApi = {
  // Obtener todas las monedas del usuario
  async getAll(params = {}) {
    debugLog('💱 monedasApi.getAll called', { params });
    return await apiRequest('/monedas-usuario', {
      method: 'GET',
      params // activa, orden_by
    });
  },

  // Obtener una moneda por ID
  async getById(moneda_id) {
    debugLog('💱 monedasApi.getById called', { moneda_id });
    return await apiRequest(`/monedas-usuario/${moneda_id}`);
  },

  // Obtener una moneda por código (USD, EUR, etc.)
  async getByCodigo(codigo) {
    debugLog('💱 monedasApi.getByCodigo called', { codigo });
    return await apiRequest(`/monedas-usuario/codigo/${codigo}`);
  },

  // Crear nueva moneda personalizada
  async create(monedaData) {
    debugLog('💱 monedasApi.create called', { monedaData });
    return await apiRequest('/monedas-usuario', {
      method: 'POST',
      data: monedaData
    });
  },

  // Actualizar una moneda
  async update(moneda_id, monedaData) {
    debugLog('💱 monedasApi.update called', { moneda_id, monedaData });
    return await apiRequest(`/monedas-usuario/${moneda_id}`, {
      method: 'PUT',
      data: monedaData
    });
  },

  // Eliminar una moneda personalizada
  async delete(moneda_id) {
    debugLog('💱 monedasApi.delete called', { moneda_id });
    return await apiRequest(`/monedas-usuario/${moneda_id}`, {
      method: 'DELETE'
    });
  },

  // Cambiar estado activo/inactivo
  async toggleActive(moneda_id) {
    debugLog('💱 monedasApi.toggleActive called', { moneda_id });
    return await apiRequest(`/monedas-usuario/${moneda_id}/toggle-active`, {
      method: 'PATCH'
    });
  },

  // Reordenar monedas
  async reorder(monedasOrden) {
    debugLog('💱 monedasApi.reorder called', { monedasOrden });
    return await apiRequest('/monedas-usuario/reorder', {
      method: 'POST',
      data: { monedas: monedasOrden }
    });
  },

  // Inicializar monedas predeterminadas (ARS, USD, EUR, BRL, GBP)
  async initializeDefault() {
    debugLog('💱 monedasApi.initializeDefault called');
    return await apiRequest('/monedas-usuario/initialize-default', {
      method: 'POST'
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// 📤 EXPORTAR TODOS LOS SERVICIOS
// ═══════════════════════════════════════════════════════════════
const apiServices = {
  transaccionesApi,
  pagosPendientesApi,
  categoriasApi,
  metodosPagoApi,
  presupuestosApi,
  resumenesBancariosApi,
  filesApi,
  pagosApi,
  objetivosApi,
  tarjetasApi,
  monedasApi
};

debugLog('✅ API Services initialized with FastAPI backend');
debugLog('🌐 API Base URL:', API_BASE_URL);

export default apiServices;
