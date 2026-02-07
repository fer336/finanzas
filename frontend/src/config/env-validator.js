// Validador de variables de entorno para Vite

/**
 * Variables de entorno requeridas para la aplicación
 */
const REQUIRED_ENV_VARS = {
  // OAuth - siempre requerido
  VITE_GOOGLE_CLIENT_ID: {
    required: true,
    description: 'Google OAuth Client ID',
    example: 'tu-client-id.apps.googleusercontent.com'
  },
  
  // URLs de desarrollo - requeridas en desarrollo
  VITE_DEV_BACKEND_URL: {
    required: 'development',
    description: 'URL del backend en desarrollo',
    example: 'http://localhost:8000'
  },
  VITE_DEV_FRONTEND_URL: {
    required: 'development',
    description: 'URL del frontend en desarrollo', 
    example: 'http://localhost:3000'
  },
  VITE_OAUTH_DEV_URL: {
    required: 'development',
    description: 'URL OAuth completa para desarrollo',
    example: 'http://localhost:8000/auth/google/dev'
  },
  
  // URLs de producción - requeridas en producción
  VITE_BACKEND_URL: {
    required: 'production',
    description: 'URL del backend en producción',
    example: 'https://tu-dominio.com'
  },
  VITE_OAUTH_PROD_URL: {
    required: 'production',
    description: 'URL OAuth completa para producción',
    example: 'https://tu-dominio.com/auth/google'
  }
};

/**
 * Variables opcionales con valores por defecto
 */
const OPTIONAL_ENV_VARS = {
  VITE_DOMAIN: {
    description: 'Dominio principal de la aplicación',
    example: 'tu-dominio.com'
  },
  VITE_PROTOCOL: {
    description: 'Protocolo (http/https)',
    example: 'https'
  },
  VITE_DEBUG: {
    description: 'Habilitar modo debug',
    example: 'false'
  }
};

/**
 * Determina si estamos en desarrollo
 */
const isDevelopment = () => {
  return import.meta.env.MODE === 'development';
};

/**
 * Valida todas las variables de entorno requeridas
 * @returns {object} Resultado de la validación
 */
export const validateEnvironment = () => {
  const environment = isDevelopment() ? 'development' : 'production';
  const errors = [];
  const warnings = [];
  const config = {};
  
  console.log(`🔧 Validating environment variables for: ${environment}`);
  
  // Validar variables requeridas
  Object.entries(REQUIRED_ENV_VARS).forEach(([varName, varConfig]) => {
    const value = import.meta.env[varName];
    const isRequired = varConfig.required === true || varConfig.required === environment;
    
    if (isRequired && !value) {
      errors.push({
        variable: varName,
        description: varConfig.description,
        example: varConfig.example,
        message: `Variable requerida no encontrada: ${varName}`
      });
    } else if (value) {
      config[varName] = value;
      console.log(`✅ ${varName}: configurado`);
    } else {
      console.log(`ℹ️  ${varName}: no requerido en ${environment}`);
    }
  });
  
  // Verificar variables opcionales
  Object.entries(OPTIONAL_ENV_VARS).forEach(([varName, varConfig]) => {
    const value = import.meta.env[varName];
    if (value) {
      config[varName] = value;
      console.log(`✅ ${varName}: configurado (opcional)`);
    } else {
      warnings.push({
        variable: varName,
        description: varConfig.description,
        example: varConfig.example,
        message: `Variable opcional no configurada: ${varName}`
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    environment,
    errors,
    warnings,
    config
  };
};

/**
 * Muestra un reporte detallado de la configuración
 */
export const showEnvironmentReport = () => {
  const validation = validateEnvironment();
  
  console.log('\n🔧 ==================== REPORTE DE CONFIGURACIÓN ====================');
  console.log(`📊 Entorno: ${validation.environment.toUpperCase()}`);
  console.log(`✅ Estado: ${validation.isValid ? 'VÁLIDO' : '❌ INVÁLIDO'}`);
  
  if (validation.errors.length > 0) {
    console.log('\n❌ ERRORES CRÍTICOS:');
    validation.errors.forEach(error => {
      console.log(`   • ${error.message}`);
      console.log(`     Descripción: ${error.description}`);
      console.log(`     Ejemplo: ${error.example}`);
      console.log('');
    });
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS:');
    validation.warnings.forEach(warning => {
      console.log(`   • ${warning.message}`);
      console.log(`     Descripción: ${warning.description}`);
      console.log(`     Ejemplo: ${warning.example}`);
      console.log('');
    });
  }
  
  console.log('\n📋 CONFIGURACIÓN ACTUAL:');
  Object.entries(validation.config).forEach(([key, value]) => {
    // Ocultar valores sensibles
    const displayValue = key.includes('SECRET') || key.includes('TOKEN') 
      ? '[CONFIGURADO]' 
      : value;
    console.log(`   ${key}: ${displayValue}`);
  });
  
  console.log('\n==================================================================\n');
  
  if (!validation.isValid) {
    console.error('💥 La aplicación puede no funcionar correctamente sin las variables requeridas.');
    console.error('📖 Consulta el archivo .env.example para ver todas las variables necesarias.');
  }
  
  return validation;
};

/**
 * Valida una configuración específica (para usar en tests)
 */
export const validateSpecificConfig = (requiredVars) => {
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Ejecutar validación automáticamente en desarrollo
if (isDevelopment() && typeof window !== 'undefined') {
  // Ejecutar después de que el DOM esté listo
  setTimeout(() => {
    showEnvironmentReport();
  }, 100);
}
