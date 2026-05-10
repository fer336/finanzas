import React from 'react';
import PropTypes from 'prop-types';
import { Building2, AlertCircle } from 'lucide-react';

/**
 * ResumenesBancariosWidget - Widget de resúmenes bancarios pendientes
 */
const ResumenesBancariosWidget = ({ resumenes = [], onClick }) => {
  // Normalizar datos — los campos vienen anidados en JSONB (ciclo_facturacion, totales)
  const data = resumenes.map(r => {
    const ciclo = r.ciclo_facturacion || {};
    const totales = r.totales || {};
    const estadoRaw = r.minimo_pagado || r.total_pagado ? 'pagado' : 'pendiente';
    return {
      id: r.id || r.Id,
      banco: r.banco || r.Banco || 'Banco',
      monto: parseFloat(totales.saldo_actual_pesos || totales.saldo_pesos || r.saldo_pesos || 0),
      vencimiento: ciclo.vencimiento_actual || ciclo.fecha_vencimiento || r.fecha_vencimiento || null,
      estado: (r.estado || r.Estado || estadoRaw).toString().toLowerCase()
    };
  });

  const totalPendiente = data.reduce((sum, r) => sum + r.monto, 0);
  const cantidad = data.length;

  // Calcular próximo vencimiento
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proximosVencimientos = data
    .map(r => {
      if (!r.vencimiento) return null;
      const fechaVenc = new Date(r.vencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      const dias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
      return { ...r, dias };
    })
    .filter(r => r && r.dias >= 0)
    .sort((a, b) => a.dias - b.dias);

  const proximoVencimiento = proximosVencimientos.length > 0 ? proximosVencimientos[0].dias : null;

  const hasData = data.length > 0;

  return (
    <div 
      className="bg-[#18181b] rounded-3xl p-5 border border-white/5 cursor-pointer hover:border-white/10 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-pink-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">
            Resúmenes Bancarios
          </h2>
        </div>
        {cantidad > 0 && (
          <span className="px-2 py-1 bg-pink-500/10 text-pink-400 text-xs font-bold rounded-full">
            {cantidad}
          </span>
        )}
      </div>
      
      {hasData ? (
        <>
          <p className="text-2xl font-bold text-white mb-2">
            ${totalPendiente.toLocaleString()}
          </p>
          
          {proximoVencimiento !== null && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <AlertCircle className="w-4 h-4 text-pink-400" />
              <span>
                {proximoVencimiento === 0 
                  ? 'Vence hoy' 
                  : `Próximo vence en ${proximoVencimiento} día${proximoVencimiento !== 1 ? 's' : ''}`
                }
              </span>
            </div>
          )}
          
          {/* Mostrar bancos */}
          <div className="mt-3 space-y-1">
            {data.slice(0, 2).map((resumen, idx) => (
              <div key={idx} className="text-xs text-gray-500 flex items-center justify-between">
                <span className="truncate">{resumen.banco}</span>
                <span className="font-medium">${resumen.monto.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Sin resúmenes pendientes</p>
          <p className="text-xs text-gray-600 mt-1">¡Todo al día! 🎉</p>
        </div>
      )}
    </div>
  );
};

ResumenesBancariosWidget.propTypes = {
  resumenes: PropTypes.array,
  onClick: PropTypes.func,
};

export default ResumenesBancariosWidget;
