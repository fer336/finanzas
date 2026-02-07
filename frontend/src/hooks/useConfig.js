// Hook de React para el servicio de configuración
import { useState, useEffect } from 'react';
import configService from '../services/config-service';

/**
 * Hook para usar el servicio de configuración
 */
export const useConfig = () => {
  const [state, setState] = useState({
    config: configService.config,
    loading: configService.loading,
    error: configService.error
  });

  useEffect(() => {
    // Cargar configuración si no está cargada
    if (!configService.isLoaded() && !configService.isLoading()) {
      configService.loadConfig();
    }

    // Suscribirse a cambios
    const unsubscribe = configService.subscribe((data) => {
      setState(prev => ({ ...prev, ...data }));
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    reload: () => configService.loadConfig(),
    getDebugInfo: () => configService.getDebugInfo(),
    getGoogleClientId: () => configService.getGoogleClientId(),
    getAuthUrl: () => configService.getAuthUrl(),
    getOAuthConfig: () => configService.getOAuthConfig(),
    getApiConfig: () => configService.getApiConfig()
  };
};