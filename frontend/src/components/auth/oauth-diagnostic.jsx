import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  Copy, 
  Eye, 
  EyeOff,
  RefreshCw 
} from 'lucide-react';
import { Button } from '../ui/button';
import { useConfig } from '../../hooks/useConfig';

const DiagnosticRow = ({ label, status, value, description, action }) => {
  const [showValue, setShowValue] = useState(false);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default: return <Settings className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'border-green-500/30 bg-green-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h4 className="text-white font-semibold">{label}</h4>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {value && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowValue(!showValue)}
                className="h-8 w-8 p-0"
              >
                {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              
              {showValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(value)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {action}
        </div>
      </div>
      
      {showValue && value && (
        <div className="mt-3 p-2 bg-black/30 rounded text-xs font-mono text-gray-300 break-all">
          {value}
        </div>
      )}
    </div>
  );
};

export const OAuthDiagnostic = ({ visible = false, onClose }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { config, loading: configLoading, error: configError, getDebugInfo, reload } = useConfig();
  
  const runDiagnostics = () => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      const debugInfo = getDebugInfo();
      
      console.log('🔍 Running OAuth diagnostics with runtime config', debugInfo);
      
      const diagnosticResults = [
        // Estado de Configuración
        {
          label: 'Configuración Runtime',
          status: config ? 'success' : configError ? 'error' : 'warning',
          value: config ? 'Cargada' : configError || 'Cargando...',
          description: configLoading ? 'Cargando configuración desde servidor' : 
                      configError ? 'Error cargando configuración' : 
                      'Configuración cargada desde runtime'
        },
        
        // Google Client ID
        {
          label: 'Google Client ID',
          status: config?.oauth?.google_client_id ? 'success' : 'error',
          value: config?.oauth?.google_client_id,
          description: config?.oauth?.google_client_id 
            ? 'Configurado correctamente desde servidor' 
            : 'REQUERIDO - No disponible en configuración runtime'
        },
        
        // Backend URL
        {
          label: 'Backend URL',
          status: config?.api?.base_url ? 'success' : 'error',
          value: config?.api?.base_url,
          description: 'URL del backend desde configuración runtime'
        },
        
        // OAuth URL
        {
          label: 'OAuth URL',
          status: config?.oauth?.auth_url ? 'success' : 'error',
          value: config?.oauth?.auth_url,
          description: 'URL completa para iniciar OAuth'
        },
        
        // Environment
        {
          label: 'Environment',
          status: 'success',
          value: debugInfo.environment,
          description: `Ambiente detectado: ${debugInfo.environment}`
        },
        
        // Validación URL
        {
          label: 'Validación de Usuario',
          status: config?.api?.base_url ? 'success' : 'error',
          value: config?.api?.base_url ? `${config.api.base_url}/auth/validate-user` : 'No disponible',
          description: 'Endpoint para validar usuarios activos',
          action: config?.api?.base_url ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => testValidationEndpoint(config.api.base_url)}
              className="text-blue-400 hover:text-blue-300"
            >
              Probar
            </Button>
          ) : null
        }
      ];
      
      // Agregar información adicional si hay errores
      if (configError) {
        diagnosticResults.push({
          label: 'Error Details',
          status: 'error',
          value: configError,
          description: 'Detalles del error de configuración'
        });
      }
      
      setDiagnostics(diagnosticResults);
      setIsRefreshing(false);
    }, 500);
  };
  
  const testValidationEndpoint = async (baseUrl) => {
    try {
      const response = await fetch(`${baseUrl}/auth/validate-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
      
      const result = await response.text();
      console.log('🔍 Validation endpoint test:', { status: response.status, result });
      
      alert(response.ok 
        ? '✅ Endpoint responde correctamente' 
        : `❌ Endpoint error: ${response.status}`
      );
    } catch (error) {
      console.error('❌ Validation endpoint test failed:', error);
      alert(`❌ Error conectando: ${error.message}`);
    }
  };
  
  useEffect(() => {
    if (visible) {
      runDiagnostics();
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="h-6 w-6 text-blue-400" />
                Diagnóstico OAuth
              </h2>
              <p className="text-gray-400 mt-1">
                Verificación de configuración y conectividad
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  reload();
                  runDiagnostics();
                }}
                disabled={isRefreshing || configLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || configLoading ? 'animate-spin' : ''}`} />
                {isRefreshing || configLoading ? 'Verificando...' : 'Actualizar'}
              </Button>
              
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {diagnostics ? (
            <div className="space-y-4">
              {diagnostics.map((diagnostic, index) => (
                <DiagnosticRow
                  key={index}
                  label={diagnostic.label}
                  status={diagnostic.status}
                  value={diagnostic.value}
                  description={diagnostic.description}
                  action={diagnostic.action}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-gray-400">Ejecutando diagnósticos...</p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <h3 className="text-blue-400 font-semibold mb-2">💡 Consejos de Troubleshooting Runtime:</h3>
            <ul className="text-blue-300 text-sm space-y-1 list-disc list-inside">
              <li><strong>Configuración Runtime:</strong> La configuración se carga desde {config?.api?.base_url || 'el servidor'}/config</li>
              <li><strong>Secrets en Producción:</strong> Las variables OAuth se manejan como secrets del servidor</li>
              <li><strong>Backend:</strong> Verificar que el endpoint /config esté disponible y devuelva google_client_id</li>
              <li><strong>Google Console:</strong> Confirmar que las URLs están correctamente configuradas</li>
              <li><strong>Docker Secrets:</strong> En producción, verificar que el secret backend.env tenga GOOGLE_CLIENT_ID</li>
              <li><strong>Desarrollo:</strong> Verificar que el archivo backend/.env tenga GOOGLE_CLIENT_ID</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};