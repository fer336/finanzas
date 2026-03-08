import PropTypes from 'prop-types';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';

const ModernPresupuestosView = ({ 
  presupuestos = [], 
  transactions = [],
  categories = [],
  onNewPresupuesto, 
  onEditPresupuesto, 
  onDeletePresupuesto 
}) => {
  // Normalizar presupuestos del backend y calcular gastos reales
  const normalizedData = presupuestos.map(p => {
    const categoriaId = p.categoria_id || p.categorias_id;
    const montoLimite = parseFloat(p.monto_limite || p.MontoLimite || p.montoLimite || 0);
    
    // Calcular gastos REALES del mes actual para esta categoría
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const gastosCategoria = transactions.filter(t => {
      const fecha = new Date(t.fecha_transaccion);
      return (
        t.tipo === 'gasto' &&
        !t.es_credito &&
        (t.categoria_id === categoriaId || t.categorias_id === categoriaId) &&
        fecha.getMonth() === currentMonth &&
        fecha.getFullYear() === currentYear
      );
    });

    const montoGastado = gastosCategoria.reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || 0)), 0);
    const porcentaje = montoLimite > 0 ? Math.round((montoGastado / montoLimite) * 100) : 0;
    
    const categoriaObj = categories.find(c => c.id === categoriaId);
    const categoriaNombre = categoriaObj?.nombre || categoriaObj?.Nombre || p.categoria_nombre || 'Sin categoría';
    
    return {
      ...p,
      id: p.id || p.Id,
      nombre: p.nombre || p.Nombre,
      montoLimite,
      monto_limite: montoLimite,
      montoGastado,
      porcentaje,
      estado: porcentaje >= 100 ? 'excedido' : 'activo',
      categoria: categoriaNombre,
      categoria_id: categoriaId
    };
  });

  console.log('💰 Presupuestos normalizados en vista:', normalizedData);

  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.presupuestos, QUERY_KEYS.transactions]);

  const data = normalizedData;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 pb-32 sm:p-6">
      {/* Barra superior */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 bg-[#18181b] hover:bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50"
          title="Actualizar presupuestos"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
        <button onClick={onNewPresupuesto} className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#0ea572] rounded-xl text-sm text-white font-semibold transition-all active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          <span>Nuevo</span>
        </button>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💰</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No hay presupuestos activos</h3>
          <p className="text-gray-400 mb-6">
            Crea presupuestos para controlar tus gastos mensuales
          </p>
          <button 
            onClick={onNewPresupuesto}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-medium hover:shadow-lg transition-all"
          >
            Crear Primer Presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {data.map((p) => {
          const isExcedido = p.porcentaje >= 100;
          const isAlerta = p.porcentaje >= 80;
          const disponible = p.montoLimite - p.montoGastado;
          return (
            <div key={p.id} className={`bg-[#18181b] rounded-3xl p-4 border-2 ${isExcedido ? 'border-[#ec4899]' : isAlerta ? 'border-[#ffd60a]' : 'border-white/5'} sm:p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white mb-1 sm:text-lg">{p.nombre}</h3>
                  <p className="text-xs text-gray-400">{p.categoria}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onEditPresupuesto && onEditPresupuesto(p)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => onDeletePresupuesto && onDeletePresupuesto(p.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Progreso</span>
                  <span className={`text-lg font-bold ${isExcedido ? 'text-[#ec4899]' : isAlerta ? 'text-[#ffd60a]' : 'text-[#10b981]'} sm:text-xl`}>{p.porcentaje}%</span>
                </div>
                <div className="w-full bg-[#0a0a0a] rounded-full h-3 overflow-hidden">
                  <div className={`h-full ${isExcedido ? 'bg-[#ec4899]' : isAlerta ? 'bg-[#ffd60a]' : 'bg-gradient-to-r from-[#10b981] to-[#34d399]'}`} style={{ width: `${Math.min(p.porcentaje, 100)}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="text-center p-3 bg-[#0a0a0a] rounded-xl"><p className="text-xs text-gray-500 mb-1">Gastado</p><p className="text-sm font-bold text-white">${p.montoGastado.toLocaleString()}</p></div>
                <div className="text-center p-3 bg-[#0a0a0a] rounded-xl"><p className="text-xs text-gray-500 mb-1">Límite</p><p className="text-sm font-bold text-white">${p.montoLimite.toLocaleString()}</p></div>
                <div className="text-center p-3 bg-[#0a0a0a] rounded-xl"><p className="text-xs text-gray-500 mb-1">Disponible</p><p className={`text-sm font-bold ${disponible >= 0 ? 'text-[#10b981]' : 'text-[#ec4899]'}`}>${Math.abs(disponible).toLocaleString()}</p></div>
              </div>
            </div>
          );
          })}
        </div>
      )}
      

    </div>
  );
};

ModernPresupuestosView.propTypes = { 
  presupuestos: PropTypes.array, 
  transactions: PropTypes.array,
  categories: PropTypes.array,
  onNewPresupuesto: PropTypes.func, 
  onEditPresupuesto: PropTypes.func, 
  onDeletePresupuesto: PropTypes.func 
};
export default ModernPresupuestosView;
