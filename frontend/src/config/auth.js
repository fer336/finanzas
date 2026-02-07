// Configuración de autenticación para el frontend
import { validateEnvironment } from './env-validator';

// Validar configuración al cargar el módulo
const envValidation = validateEnvironment();
if (!envValidation.isValid && import.meta.env.MODE === 'development') {
  console.warn('⚠️  Problemas detectados en la configuración OAuth. Revisa las variables de entorno.');
}

export const AUTH_CONFIG = {
  // URLs del backend - usar variables de entorno con fallbacks
  DEV_BACKEND_URL: import.meta.env.VITE_DEV_BACKEND_URL || 'http://localhost:8000',
  PRODUCTION_BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'https://finanzas.qeva.xyz',
  
  // URLs del frontend - usar variables de entorno con fallbacks
  DEV_FRONTEND_URL: import.meta.env.VITE_DEV_FRONTEND_URL || 'http://localhost:3000',
  PRODUCTION_FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || import.meta.env.VITE_BACKEND_URL || 'https://finanzas.qeva.xyz',
  
  // URLs OAuth completas desde variables de entorno
  OAUTH_DEV_URL: import.meta.env.VITE_OAUTH_DEV_URL || 'http://localhost:8000/auth/google/dev',
  OAUTH_PROD_URL: import.meta.env.VITE_OAUTH_PROD_URL || 'https://finanzas.qeva.xyz/auth/google',
  
  // Endpoints relativos (para compatibilidad)
  AUTH_ENDPOINTS: {
    GOOGLE_DEV: '/auth/google/dev',
    GOOGLE_PROD: '/auth/google',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    VALIDATE_USER: '/auth/validate-user'
  },
  
  // Configuración OAuth
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID
};

// Helper para determinar si estamos en desarrollo
export const isDevelopment = () => {
  // Verificar NODE_ENV primero
  if (import.meta.env.MODE === 'development') return true;
  if (import.meta.env.MODE === 'production') return false;
  
  // Fallback: verificar hostname
  const hostname = window.location.hostname;
  const developmentHosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
  ];
  
  return developmentHosts.includes(hostname) || 
         hostname.startsWith('192.168.') ||
         hostname.startsWith('10.') ||
         hostname.endsWith('.local');
};

// Helper para obtener la URL base del backend
export const getBackendUrl = () => {
  return isDevelopment() ? AUTH_CONFIG.DEV_BACKEND_URL : AUTH_CONFIG.PRODUCTION_BACKEND_URL;
};

// Helper para obtener la URL base del frontend
export const getFrontendUrl = () => {
  return isDevelopment() ? AUTH_CONFIG.DEV_FRONTEND_URL : AUTH_CONFIG.PRODUCTION_FRONTEND_URL;
};

// Helper para obtener el endpoint de autenticación correcto
export const getGoogleAuthUrl = () => {
  // Usar URLs completas de OAuth si están disponibles
  if (isDevelopment()) {
    return AUTH_CONFIG.OAUTH_DEV_URL;
  } else {
    return AUTH_CONFIG.OAUTH_PROD_URL;
  }
};

// Helper para obtener la URL del endpoint de validación de usuario
export const getValidateUserUrl = () => {
  const baseUrl = getBackendUrl();
  return `${baseUrl}${AUTH_CONFIG.AUTH_ENDPOINTS.VALIDATE_USER}`;
};

// Helper para obtener la configuración del entorno actual
export const getEnvironmentInfo = () => {
  const isDev = isDevelopment();
  return {
    isDevelopment: isDev,
    environment: isDev ? 'development' : 'production',
    backendUrl: getBackendUrl(),
    frontendUrl: getFrontendUrl(),
    authUrl: getGoogleAuthUrl(),
    hostname: window.location.hostname,
    nodeEnv: import.meta.env.MODE,
    hasGoogleClientId: !!AUTH_CONFIG.GOOGLE_CLIENT_ID
  };
};

// Helper para logging de debug (solo en desarrollo)
export const authDebugLog = (message, data) => {
  if (isDevelopment()) {
    console.log(`🔐 AUTH DEBUG: ${message}`, data);
  }
};