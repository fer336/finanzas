import React from 'react';
import PropTypes from 'prop-types';
import { Calendar, AlertCircle } from 'lucide-react';

/**
 * PagosPendientesWidget - Widget de pagos pendientes
 */
const PagosPendientesWidget = ({ 
  totalPendiente = 89500, 
  cantidadPagos = 3,
  proximoVencimiento = 5, 
  onClick 
}) => {
  return (
    <div 
      className="bg-[#18181b] rounded-3xl p-5 border-2 border-[#ffd60a] shadow-lg shadow-[#ffd60a]/10 cursor-pointer hover:border-[#ffd60a]/80 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          PAGOS PENDIENTES
        </h3>
        <span className="px-3 py-1 bg-[#ffd60a] text-black text-xs font-bold rounded-full uppercase">
          {cantidadPagos} PAGOS
        </span>
      </div>
      <p className="text-3xl font-bold text-white mb-3">
        ${totalPendiente.toLocaleString()}
      </p>
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="w-4 h-4 text-[#ffd60a]" />
        <span className="text-gray-300">
          Próximo vence en <strong className="text-[#ffd60a]">{proximoVencimiento} días</strong>
        </span>
      </div>
    </div>
  );
};

PagosPendientesWidget.propTypes = {
  totalPendiente: PropTypes.number,
  cantidadPagos: PropTypes.number,
  proximoVencimiento: PropTypes.number,
  onClick: PropTypes.func,
};

export default PagosPendientesWidget;
