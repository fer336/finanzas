import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, ChevronRight, DollarSign } from 'lucide-react';
import apiServices from '../../services/api';

export const BudgetWidget = ({ onViewDetails, onAnalyzePurchase }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await apiServices.presupuestosApi.getActive();
      console.log('📊 BudgetWidget: Fetched budgets:', response);
      setBudgets(response.list || []);
    } catch (err) {
      console.error('❌ BudgetWidget: Error fetching budgets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (porcentaje) => {
    if (porcentaje >= 100) return { bg: 'bg-red-500/10', text: 'text-red-400', bar: 'bg-red-500' };
    if (porcentaje >= 90) return { bg: 'bg-orange-500/10', text: 'text-orange-400', bar: 'bg-orange-500' };
    if (porcentaje >= 70) return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', bar: 'bg-yellow-500' };
    return { bg: 'bg-green-500/10', text: 'text-green-400', bar: 'bg-green-500' };
  };

  const getStatusIcon = (porcentaje) => {
    if (porcentaje >= 90) return <AlertCircle size={16} />;
    return <CheckCircle size={16} />;
  };

  if (loading) {
    console.log('⏳ BudgetWidget: Loading...');
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
    console.log('❌ BudgetWidget: Rendering error state:', error);
    return (
      <div className="bg-[#0f151a] border border-white/5 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-400" />
          Presupuestos
        </h3>
        <p className="text-sm text-zinc-500">Error cargando presupuestos</p>
      </div>
    );
  }

  console.log('✅ BudgetWidget: Rendering with', budgets.length, 'budgets');
  
  return (
    <div className="bg-[#0f151a] border border-white/5 rounded-3xl p-4 space-y-3 h-full flex flex-col min-h-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-purple-400" />
          Presupuestos
        </h3>
        <button
          onClick={onViewDetails}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
        >
          Ver todos
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-6 space-y-2 flex-1 flex flex-col items-center justify-center">
          <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
            <DollarSign className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-xs text-zinc-400">No hay presupuestos activos</p>
          <button
            onClick={onViewDetails}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline"
          >
            Crear primer presupuesto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Budget Items */}
          {budgets.slice(0, 2).map((budget) => {
            const porcentaje = budget.porcentaje_usado || 0;
            const status = getStatusColor(porcentaje);
            
            return (
              <div
                key={budget.id}
                className="p-3 bg-[#162028] border border-white/10 rounded-2xl hover:bg-[#1a2830] transition-all cursor-pointer active:scale-[0.98]"
                onClick={onViewDetails}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium text-white truncate">
                      {budget.categoria?.nombre || 'General'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{budget.nombre}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${status.bg} ${status.text} shrink-0`}>
                    {getStatusIcon(porcentaje)}
                    <span className="text-xs font-bold">{porcentaje.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`absolute top-0 left-0 h-full ${status.bar} transition-all duration-500`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 truncate">
                    ${(budget.monto_gastado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })} / ${(budget.monto_limite || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </span>
                  <span className={`${status.text} ml-2 shrink-0`}>
                    ${(budget.monto_disponible || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Analyze Purchase Button - More compact */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyzePurchase && onAnalyzePurchase();
            }}
            className="w-full px-3 py-2.5 border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-medium"
          >
            <AlertCircle size={14} />
            ¿Puedo hacer esta compra?
          </button>

          {budgets.length > 2 && (
            <button
              onClick={onViewDetails}
              className="w-full text-xs text-center text-zinc-500 hover:text-white transition-colors py-1"
            >
              Ver {budgets.length - 2} más →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

