import React, { useState, useEffect } from 'react';
import { CreditCard, ChevronRight, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import apiServices from '../../services/api';

export const DeudaTarjetasWidget = ({ onViewDetails, onPagarResumen }) => {
  const [deudaData, setDeudaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDeuda();
  }, []);

  const fetchDeuda = async () => {
    try {
      setLoading(true);
      const data = await apiServices.tarjetasApi.getDeuda();
      setDeudaData(data);
    } catch (err) {
      console.error('Error fetching deuda tarjetas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('es-AR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  };

  if (loading) {
    return (
      <div className="bg-[#0f151a] border border-white/5 rounded-3xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0f151a] border border-white/5 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-red-400" />
          Tarjetas
        </h3>
        <p className="text-sm text-zinc-500">Error cargando deuda</p>
      </div>
    );
  }

  const deudaTotal = deudaData?.deuda_total || 0;
  const cantidadTransacciones = deudaData?.cantidad_transacciones || 0;
  const deudaPorTarjeta = deudaData?.deuda_por_tarjeta || [];

  return (
    <div className="bg-[#0f151a] border border-white/5 rounded-3xl p-4 md:p-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
          Deuda Tarjetas
        </h3>
        {cantidadTransacciones > 0 && (
          <button
            onClick={onViewDetails}
            className="text-xs md:text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            Ver detalle
          </button>
        )}
      </div>

      {cantidadTransacciones === 0 ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-sm text-zinc-400">Sin deuda de tarjetas</p>
          <p className="text-xs text-zinc-600">
            Todos los gastos de tarjeta están pagos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Deuda Total */}
          <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">Deuda Total</span>
              <span className="text-xs text-zinc-500">{cantidadTransacciones} transacciones</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-white">
                ${formatCurrency(deudaTotal)}
              </span>
              <span className="text-sm text-zinc-400">ARS</span>
            </div>
          </div>

          {/* Deuda por Tarjeta */}
          {deudaPorTarjeta.length > 0 && (
            <div className="space-y-2">
              {deudaPorTarjeta.slice(0, 3).map((tarjeta, index) => (
                <div
                  key={index}
                  className="p-3 bg-[#162028] border border-white/10 rounded-xl hover:bg-[#1a2830] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg shrink-0">{tarjeta.icono || '💳'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {tarjeta.nombre}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {tarjeta.cantidad_transacciones} {tarjeta.cantidad_transacciones === 1 ? 'gasto' : 'gastos'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-400 shrink-0">
                      ${formatCurrency(tarjeta.deuda)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón Pagar Resumen */}
          <button
            onClick={() => onPagarResumen && onPagarResumen(deudaData)}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-2xl transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-lg shadow-red-500/25"
          >
            <DollarSign size={16} />
            Pagar Resumen
          </button>

          {deudaPorTarjeta.length > 3 && (
            <button
              onClick={onViewDetails}
              className="w-full text-xs text-center text-zinc-500 hover:text-white transition-colors py-2 flex items-center justify-center gap-1"
            >
              Ver {deudaPorTarjeta.length - 3} tarjetas más
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DeudaTarjetasWidget;

