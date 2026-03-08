import React from 'react';
import PropTypes from 'prop-types';
import { Target } from 'lucide-react';

/**
 * ObjetivosWidget - Widget de objetivos con diseño de Stitch
 */
const ObjetivosWidget = ({ objetivos = [], onNavigate }) => {
  console.log('🎯 ObjetivosWidget recibió:', objetivos);
  
  const data = objetivos;

  // Formatear monto
  const formatMonto = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="bg-[#18181b] rounded-3xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#10b981]/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#10b981]" />
          </div>
          <h2 className="text-base font-semibold text-white">
            Objetivos de Ahorro
          </h2>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('objetivos-full')}
          className="text-sm text-[#10b981] hover:text-[#34d399] transition-colors font-medium"
        >
          Ver todos
        </button>
      </div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-4xl mb-2 block">🎯</span>
            <p className="text-sm text-gray-500 mb-2">No hay objetivos activos</p>
            <button 
              onClick={() => onNavigate && onNavigate('objetivos-full')}
              className="text-xs text-[#10b981] hover:text-[#34d399] transition-colors"
            >
              Crear objetivo →
            </button>
          </div>
        ) : (
          data.slice(0, 3).map((objetivo, index) => (
            <div key={objetivo.id || index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{objetivo.icono}</span>
                  <span className="text-sm text-white truncate">
                    {objetivo.nombre}
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ color: objetivo.color }}>
                  {objetivo.porcentaje}%
                </span>
              </div>
              <div className="w-full bg-[#0a0a0a] rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(objetivo.porcentaje, 100)}%`,
                    backgroundColor: objetivo.color
                  }}
                />
              </div>
              {objetivo.montoActual !== undefined && objetivo.montoObjetivo !== undefined && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {formatMonto(objetivo.montoActual)} / {formatMonto(objetivo.montoObjetivo)}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

ObjetivosWidget.propTypes = {
  objetivos: PropTypes.array,
  onNavigate: PropTypes.func,
};

export default ObjetivosWidget;
