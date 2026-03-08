import React from 'react';
import PropTypes from 'prop-types';
import { DollarSign } from 'lucide-react';

/**
 * PresupuestosWidget - Widget de presupuestos mensuales
 */
const PresupuestosWidget = ({ presupuestos = [], onClick }) => {
  const data = presupuestos;

  return (
    <div 
      className="bg-[#18181b] rounded-3xl p-5 border border-white/5 cursor-pointer hover:border-white/10 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-base font-semibold text-white">
            Presupuestos
          </h2>
        </div>
        <button 
          className="text-sm text-[#10b981] hover:text-[#34d399] transition-colors font-medium"
        >
          Ver todos
        </button>
      </div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No hay presupuestos activos</p>
            <p className="text-xs text-gray-600 mt-1">Crea presupuestos para controlar tus gastos</p>
          </div>
        ) : (
          data.slice(0, 3).map((presupuesto, index) => {
          const isOverBudget = presupuesto.porcentaje >= 100;
          const isWarning = presupuesto.porcentaje >= 80;
          
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white truncate">
                  {presupuesto.categoria}
                </span>
                <span className={`text-sm font-bold ${
                  isOverBudget ? 'text-[#ec4899]' : isWarning ? 'text-[#fbbf24]' : 'text-[#10b981]'
                }`}>
                  {presupuesto.porcentaje}%
                </span>
              </div>
              <div className="w-full bg-[#0a0a0a] rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(presupuesto.porcentaje, 100)}%`,
                    backgroundColor: isOverBudget ? '#ec4899' : isWarning ? '#fbbf24' : presupuesto.color
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  ${presupuesto.gastado.toLocaleString()} / ${presupuesto.limite.toLocaleString()}
                </span>
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
};

PresupuestosWidget.propTypes = {
  presupuestos: PropTypes.array,
  onClick: PropTypes.func,
};

export default PresupuestosWidget;
