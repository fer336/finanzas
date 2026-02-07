// Utilidades para manejo de autenticación

/**
 * Maneja los errores de autenticación OAuth
 * @param {string} errorCode - Código de error OAuth
 * @param {string} errorDescription - Descripción del error
 * @returns {object} - Información sobre cómo manejar el error
 */
export const handleAuthError = (errorCode, errorDescription) => {
  const errorHandlers = {
    'invalid_grant': {
      message: 'Error en el intercambio de tokens. El código de autorización puede haber expirado.',
      userMessage: 'Por favor, intenta iniciar sesión nuevamente.',
      shouldRetry: true,
      retryDelay: 2000
    },
    'access_denied': {
      message: 'El usuario canceló la autorización.',
      userMessage: 'Autorización cancelada. Necesitas autorizar el acceso para continuar.',
      shouldRetry: false,
      retryDelay: 0
    },
    'invalid_request': {
      message: 'Solicitud OAuth inválida.',
      userMessage: 'Error en la configuración de autenticación. Contacta al administrador.',
      shouldRetry: false,
      retryDelay: 0
    },
    'unauthorized_client': {
      message: 'Cliente no autorizado.',
      userMessage: 'Error de configuración del cliente OAuth. Contacta al administrador.',
      shouldRetry: false,
      retryDelay: 0
    },
    'unsupported_response_type': {
      message: 'Tipo de respuesta no soportado.',
      userMessage: 'Error de configuración OAuth. Contacta al administrador.',
      shouldRetry: false,
      retryDelay: 0
    },
    'invalid_scope': {
      message: 'Alcance OAuth inválido.',
      userMessage: 'Error en los permisos solicitados. Contacta al administrador.',
      shouldRetry: false,
      retryDelay: 0
    }
  };

  return errorHandlers[errorCode] || {
    message: `Error OAuth desconocido: ${errorCode} - ${errorDescription}`,
    userMessage: 'Error de autenticación. Por favor, intenta nuevamente o contacta al administrador.',
    shouldRetry: true,
    retryDelay: 3000
  };
};

/**
 * Valida si un token JWT es válido (no expirado)
 * @param {string} token - Token JWT
 * @returns {boolean} - true si el token es válido
 */
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Decodificar el payload del JWT
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Verificar si el token ha expirado
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

/**
 * Genera un estado único para OAuth para prevenir ataques CSRF
 * @returns {string} - Estado único
 */
export const generateOAuthState = () => {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return btoa(String.fromCharCode.apply(null, randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Valida el estado OAuth para prevenir ataques CSRF
 * @param {string} receivedState - Estado recibido del callback
 * @param {string} originalState - Estado original enviado
 * @returns {boolean} - true si el estado es válido
 */
export const validateOAuthState = (receivedState, originalState) => {
  return receivedState === originalState;
};

/**
 * Limpia los datos de autenticación del almacenamiento local
 */
export const clearAuthData = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('oauth_state');
};

/**
 * Verifica si el usuario está autenticado basado en localStorage
 * @returns {object} - Estado de autenticación
 */
export const checkAuthStatus = () => {
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('user_data');
  
  if (!token || !userData) {
    return { isAuthenticated: false, user: null, token: null };
  }
  
  // Verificar si el token es válido
  if (!isTokenValid(token)) {
    clearAuthData();
    return { isAuthenticated: false, user: null, token: null };
  }
  
  try {
    const user = JSON.parse(userData);
    return { isAuthenticated: true, user, token };
  } catch (error) {
    console.error('Error parsing user data:', error);
    clearAuthData();
    return { isAuthenticated: false, user: null, token: null };
  }
};