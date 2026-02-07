// Utilidades para testing de conectividad OAuth

/**
 * Prueba la conectividad con el backend
 * @param {string} baseUrl - URL base del backend
 * @returns {Promise<object>} Resultado del test
 */
export const testBackendConnectivity = async (baseUrl) => {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        responseTime: responseTime,
        data: data,
        message: `Conexión exitosa (${responseTime}ms)`
      };
    } else {
      return {
        success: false,
        status: response.status,
        responseTime: responseTime,
        message: `Error HTTP: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      status: 0,
      responseTime: responseTime,
      error: error.message,
      message: `Error de conexión: ${error.message}`
    };
  }
};

/**
 * Prueba el endpoint de autenticación OAuth
 * @param {string} oauthUrl - URL de OAuth
 * @returns {Promise<object>} Resultado del test
 */
export const testOAuthEndpoint = async (oauthUrl) => {
  const startTime = Date.now();
  
  try {
    // Hacer una petición HEAD para verificar que el endpoint existe
    // sin iniciar el flujo OAuth completo
    const response = await fetch(oauthUrl, {
      method: 'HEAD',
      timeout: 5000
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Para OAuth, esperamos un redirect (302) o similar
    if (response.status >= 300 && response.status < 400) {
      return {
        success: true,
        status: response.status,
        responseTime: responseTime,
        message: `Endpoint OAuth disponible (${responseTime}ms) - Redirección detectada`
      };
    } else if (response.status === 200) {
      return {
        success: true,
        status: response.status,
        responseTime: responseTime,
        message: `Endpoint OAuth responde (${responseTime}ms) - OK`
      };
    } else {
      return {
        success: false,
        status: response.status,
        responseTime: responseTime,
        message: `Endpoint OAuth error: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      status: 0,
      responseTime: responseTime,
      error: error.message,
      message: `Error verificando OAuth: ${error.message}`
    };
  }
};

/**
 * Prueba el endpoint de validación de usuarios
 * @param {string} baseUrl - URL base del backend
 * @returns {Promise<object>} Resultado del test
 */
export const testUserValidationEndpoint = async (baseUrl) => {
  const startTime = Date.now();
  const validateUrl = `${baseUrl}/auth/validate-user`;
  
  try {
    const response = await fetch(validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email: 'test@example.com' 
      }),
      timeout: 5000
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.status === 401) {
      return {
        success: true,
        status: response.status,
        responseTime: responseTime,
        message: `Endpoint validación funciona (${responseTime}ms) - Requiere token (esperado)`
      };
    } else if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        responseTime: responseTime,
        data: data,
        message: `Endpoint validación OK (${responseTime}ms)`
      };
    } else {
      return {
        success: false,
        status: response.status,
        responseTime: responseTime,
        message: `Error validación: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      status: 0,
      responseTime: responseTime,
      error: error.message,
      message: `Error endpoint validación: ${error.message}`
    };
  }
};

/**
 * Ejecuta todos los tests de conectividad
 * @param {object} config - Configuración con URLs
 * @returns {Promise<object>} Resultados completos
 */
export const runFullConnectivityTest = async (config) => {
  console.log('🔍 Ejecutando tests de conectividad...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: config.environment,
    tests: {}
  };
  
  // Test 1: Backend general
  console.log('🔍 Testing backend connectivity...');
  results.tests.backend = await testBackendConnectivity(config.backendUrl);
  
  // Test 2: OAuth endpoint
  console.log('🔍 Testing OAuth endpoint...');
  results.tests.oauth = await testOAuthEndpoint(config.authUrl);
  
  // Test 3: User validation
  console.log('🔍 Testing user validation endpoint...');
  results.tests.validation = await testUserValidationEndpoint(config.backendUrl);
  
  // Resumen
  const successCount = Object.values(results.tests).filter(test => test.success).length;
  const totalTests = Object.keys(results.tests).length;
  
  results.summary = {
    totalTests: totalTests,
    successCount: successCount,
    failureCount: totalTests - successCount,
    allPassed: successCount === totalTests,
    overallStatus: successCount === totalTests ? 'success' : 
                   successCount > 0 ? 'partial' : 'failure'
  };
  
  console.log('✅ Tests completados:', results.summary);
  
  return results;
};

/**
 * Prueba de ping simple
 * @param {string} url - URL a testear
 * @returns {Promise<number>} Tiempo de respuesta en ms
 */
export const pingUrl = async (url) => {
  const startTime = Date.now();
  
  try {
    await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors',
      timeout: 3000 
    });
    return Date.now() - startTime;
  } catch {
    return -1; // Error
  }
};

/**
 * Verifica si estamos online
 * @returns {boolean} Estado de conectividad
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Obtiene información de la conexión (si está disponible)
 * @returns {object} Información de conexión
 */
export const getConnectionInfo = () => {
  const connection = navigator.connection || 
                    navigator.mozConnection || 
                    navigator.webkitConnection;
  
  if (!connection) {
    return {
      available: false,
      message: 'Información de conexión no disponible'
    };
  }
  
  return {
    available: true,
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
    type: connection.type
  };
};