// Servicio de configuración runtime para secrets en producción

class ConfigService {
  constructor() {
    this.config = null;
    this.loading = false;
    this.error = null;
    this.listeners = new Set();
  }

  /**
   * Carga la configuración desde el backend (runtime)
   */
  async loadConfig() {
    if (this.loading) return this.config;
    
    this.loading = true;
    this.error = null;
    this.notifyListeners({ loading: true });

    try {
      // Determinar la URL del backend
      const backendUrl = this.getBackendUrl();
      const configUrl = `${backendUrl}/config`;
      
      console.log('🔧 Cargando configuración desde:', configUrl);
      
      const response = await fetch(configUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config = await response.json();
      
      // Validar que tenemos las configuraciones críticas
      this.validateConfig(config);
      
      this.config = config;
      console.log('✅ Configuración cargada exitosamente');
      
      this.notifyListeners({ config: this.config, loading: false });
      
      return this.config;
      
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      this.error = error.message;
      
      // Fallback a configuración de desarrollo si falla
      this.config = this.getFallbackConfig();
      
      this.notifyListeners({ 
        config: this.config, 
        error: this.error, 
        loading: false 
      });
      
      return this.config;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Determina la URL del backend basado en el entorno
   */
  getBackendUrl() {
    // En desarrollo, usar variable de entorno si está disponible
    if (import.meta.env.MODE === 'development') {
      return import.meta.env.VITE_DEV_BACKEND_URL || 
             import.meta.env.VITE_BACKEND_URL || 
             'http://localhost:8000';
    }
    
    // En producción, intentar diferentes métodos
    const hostname = window.location.hostname;
    
    // Si estamos en el mismo dominio, FORZAR HTTPS en producción
    if (hostname === 'finanzas.qeva.xyz') {
      return `https://finanzas.qeva.xyz`;
    }
    
    // Para otros dominios, usar HTTPS por defecto (seguro)
    const protocol = hostname === 'localhost' ? 'http:' : 'https:';
    
    // Fallback a variable de entorno si existe
    return import.meta.env.VITE_BACKEND_URL || 
           `${protocol}//${hostname}:8000`;
  }

  /**
   * Valida que la configuración tenga los campos requeridos
   */
  validateConfig(config) {
    const requiredFields = [
      'oauth.google_client_id',
      'api.base_url'
    ];

    for (const field of requiredFields) {
      const value = this.getNestedValue(config, field);
      if (!value) {
        throw new Error(`Campo requerido faltante: ${field}`);
      }
    }
  }

  /**
   * Obtiene un valor anidado del objeto config
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Configuración de fallback para desarrollo
   */
  getFallbackConfig() {
    return {
      oauth: {
        google_client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'fallback-client-id',
        auth_url: '/auth/google'
      },
      api: {
        base_url: this.getBackendUrl(),
        version: '1.0.0',
        environment: 'development'
      },
      app: {
        name: 'Finance',
        version: '1.0.0'
      }
    };
  }

  /**
   * Obtiene la configuración OAuth
   */
  getOAuthConfig() {
    return this.config?.oauth || this.getFallbackConfig().oauth;
  }

  /**
   * Obtiene la configuración de la API
   */
  getApiConfig() {
    return this.config?.api || this.getFallbackConfig().api;
  }

  /**
   * Obtiene el Google Client ID
   */
  getGoogleClientId() {
    return this.config?.oauth?.google_client_id;
  }

  /**
   * Obtiene la URL de autenticación
   */
  getAuthUrl() {
    const baseUrl = this.getApiConfig().base_url;
    const authPath = this.config?.oauth?.auth_url || '/auth/google';
    
    if (authPath.startsWith('http')) {
      return authPath;
    }
    
    return `${baseUrl}${authPath}`;
  }

  /**
   * Verifica si la configuración está cargada
   */
  isLoaded() {
    return this.config !== null;
  }

  /**
   * Verifica si está cargando
   */
  isLoading() {
    return this.loading;
  }

  /**
   * Obtiene el error actual
   */
  getError() {
    return this.error;
  }

  /**
   * Suscribe un listener para cambios de configuración
   */
  subscribe(listener) {
    this.listeners.add(listener);
    
    // Devolver función de desuscripción
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica a todos los listeners
   */
  notifyListeners(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error en config listener:', error);
      }
    });
  }

  /**
   * Obtiene información de debug
   */
  getDebugInfo() {
    return {
      config: this.config,
      loading: this.loading,
      error: this.error,
      backendUrl: this.getBackendUrl(),
      isLoaded: this.isLoaded(),
      environment: import.meta.env.MODE
    };
  }
}

// Instancia singleton
const configService = new ConfigService();

export default configService;

// Exportar solo el servicio - los hooks van en archivos separados
export { configService };