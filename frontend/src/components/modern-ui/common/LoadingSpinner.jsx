import React from 'react';
import PropTypes from 'prop-types';

/**
 * LoadingSpinner - Spinner de carga para Suspense fallback
 */
const LoadingSpinner = ({ message = 'Cargando...' }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="text-center">
        <div className="relative">
          {/* Spinner principal */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#10b981] border-t-transparent mx-auto mb-4"></div>
          
          {/* Pulso de fondo */}
          <div className="absolute inset-0 animate-pulse">
            <div className="rounded-full h-16 w-16 bg-[#10b981]/20 mx-auto"></div>
          </div>
        </div>
        
        <p className="text-gray-400 text-sm font-medium">{message}</p>
        
        {/* Puntos animados */}
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string
};

export default LoadingSpinner;
