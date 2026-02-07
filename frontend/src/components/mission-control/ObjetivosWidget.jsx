import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, ChevronRight, Plus } from 'lucide-react';
import apiServices from '../../services/api';

export const ObjetivosWidget = ({ onViewDetails, onCreateNew, onObjetivoClick }) => {
  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchObjetivos();
  }, []);

  const fetchObjetivos = async () => {
    try {
      setLoading(true);
      const response = await apiServices.objetivosApi.getActive();
      setObjetivos(response.list || []);
    } catch (err) {
      console.error('Error fetching objetivos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (porcentaje) => {
    if (porcentaje >= 100) return { bg: 'bg-green-500/10', text: 'text-green-400', bar: 'bg-green-500' };
    if (porcentaje >= 75) return { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' };
    if (porcentaje >= 50) return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', bar: 'bg-yellow-500' };
    return { bg: 'bg-red-500/10', text: 'text-red-400', bar: 'bg-red-500' };
  };

  const formatCurrency = (amount, currency = 'ARS') => {
    const formatted = amount.toLocaleString('es-AR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
    return currency === 'USD' ? `USD ${formatted}` : `$${formatted}`;
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
          <Target className="w-5 h-5 text-cyan-400" />
          Objetivos
        </h3>
        <p className="text-sm text-zinc-500">Error cargando objetivos</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f151a] border border-white/5 rounded-3xl p-4 md:p-6 space-y-3 h-full flex flex-col min-h-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
          Objetivos
          {objetivos.length > 0 && (
            <span className="text-xs text-zinc-500">({objetivos.length})</span>
          )}
        </h3>
        <button
          onClick={onViewDetails}
          className="text-xs md:text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
        >
          Ver todos
        </button>
      </div>

      {objetivos.length === 0 ? (
        <div className="text-center py-8 space-y-3 flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-sm text-zinc-400">No hay objetivos activos</p>
          <button
            onClick={onCreateNew}
            className="text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            Crear primer objetivo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Objetivo Items */}
          {objetivos.slice(0, 2).map((objetivo) => {
            const porcentaje = objetivo.porcentaje_completado || 0;
            const status = getStatusColor(porcentaje);
            const faltante = objetivo.monto_objetivo - objetivo.monto_actual;
            
            return (
              <div
                key={objetivo.id}
                className="p-3 md:p-4 bg-[#162028] border border-white/10 rounded-2xl hover:bg-[#1a2830] transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => onObjetivoClick ? onObjetivoClick(objetivo) : onViewDetails()}
              >
                {/* Header with icon and percentage */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="text-2xl shrink-0">
                      {objetivo.icono || '🎯'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {objetivo.nombre}
                      </p>
                      {objetivo.tipo && (
                        <p className="text-xs text-zinc-500 capitalize">{objetivo.tipo}</p>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${status.bg} ${status.text} shrink-0 ml-2`}>
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-bold">{porcentaje.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`absolute top-0 left-0 h-full ${status.bar} transition-all duration-500`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>

                {/* Amount Info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="text-zinc-400">
                    <span className="font-medium text-white">
                      {formatCurrency(objetivo.monto_actual, objetivo.moneda)}
                    </span>
                    <span className="mx-1 text-zinc-600">/</span>
                    <span>
                      {formatCurrency(objetivo.monto_objetivo, objetivo.moneda)}
                    </span>
                  </div>
                  {faltante > 0 && (
                    <span className={`${status.text} font-medium`}>
                      Faltan {formatCurrency(faltante, objetivo.moneda)}
                    </span>
                  )}
                </div>

                {/* Fecha objetivo */}
                {objetivo.fecha_objetivo && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-xs text-zinc-500">
                      Meta: {new Date(objetivo.fecha_objetivo).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Create New Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateNew && onCreateNew();
            }}
            className="w-full px-3 py-3 border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            Nuevo Objetivo
          </button>

          {objetivos.length > 2 && (
            <button
              onClick={onViewDetails}
              className="w-full text-xs text-center text-zinc-500 hover:text-white transition-colors py-2 flex items-center justify-center gap-1"
            >
              Ver {objetivos.length - 2} más
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ObjetivosWidget;

