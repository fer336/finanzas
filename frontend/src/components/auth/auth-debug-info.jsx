import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { handleAuthError } from '../../utils/auth-utils';

export function AuthDebugInfo({ error, visible = false }) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  if (!visible || !error) return null;

  const errorInfo = handleAuthError(error.code || 'unknown', error.description || '');
  
  const debugData = {
    timestamp: new Date().toISOString(),
    error: error,
    url: window.location.href,
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    localStorage: {
      hasToken: !!localStorage.getItem('auth_token'),
      hasUserData: !!localStorage.getItem('user_data')
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-red-900/90 border border-red-700 rounded-lg p-4 text-white shadow-lg z-50">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <span className="font-semibold">Error de Autenticación</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="ml-auto h-6 w-6 p-0"
        >
          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      
      <p className="text-sm mb-3">{errorInfo.userMessage}</p>
      
      {errorInfo.shouldRetry && (
        <Button
          size="sm"
          onClick={() => window.location.reload()}
          className="mb-3 w-full bg-blue-600 hover:bg-blue-700"
        >
          Intentar Nuevamente
        </Button>
      )}
      
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-red-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold">Información de Debug:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-6 w-6 p-0"
            >
              {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          
          <div className="bg-black/30 rounded p-2 text-xs font-mono max-h-40 overflow-y-auto">
            <div><strong>Código:</strong> {error.code || 'N/A'}</div>
            <div><strong>Descripción:</strong> {error.description || 'N/A'}</div>
            <div><strong>Timestamp:</strong> {debugData.timestamp}</div>
            <div><strong>URL:</strong> {window.location.pathname}</div>
            {debugData.localStorage.hasToken && (
              <div className="text-yellow-400"><strong>⚠️ Token presente en localStorage</strong></div>
            )}
          </div>
          
          <div className="text-xs text-red-300 mt-2">
            💡 Copia esta información para reportar el error al desarrollador
          </div>
        </div>
      )}
    </div>
  );
}