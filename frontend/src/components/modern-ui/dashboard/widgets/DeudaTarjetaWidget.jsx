import React from 'react';
import PropTypes from 'prop-types';
import { Calendar } from 'lucide-react';

/**
 * DeudaTarjetaWidget - Widget de deuda con diseño EXACTO de Stitch
 * Fondo oscuro con BORDE rojo (no todo rojo)
 */
const DeudaTarjetaWidget = ({ deuda = 89500, diasVencimiento = 5, onClick }) => {
  return (
    <div 
      className="bg-[#18181b] rounded-3xl p-5 border-2 border-[#ec4899] shadow-lg shadow-[#ec4899]/10 cursor-pointer hover:border-[#ec4899]/80 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          DEUDA DE TARJETA
        </h3>
        <span className="px-3 py-1 bg-[#ec4899] text-white text-xs font-bold rounded-full uppercase">
          URGENTE
        </span>
      </div>
      <p className="text-3xl font-bold text-white mb-3">
        ${deuda.toLocaleString()}
      </p>
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="w-4 h-4 text-[#ec4899]" />
        <span className="text-gray-300">
          Vence en <strong className="text-[#ec4899]">{diasVencimiento} días</strong>
        </span>
      </div>
    </div>
  );
};

DeudaTarjetaWidget.propTypes = {
  deuda: PropTypes.number,
  diasVencimiento: PropTypes.number,
  onClick: PropTypes.func,
};

export default DeudaTarjetaWidget;
