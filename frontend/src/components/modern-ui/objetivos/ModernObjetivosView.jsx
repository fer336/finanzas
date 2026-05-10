import PropTypes from 'prop-types';
import { Plus, Home, Plane, Car, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';

const ModernObjetivosView = ({ objetivos = [], onNewObjetivo, onEditObjetivo, onDeleteObjetivo, onAportar }) => {
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.objetivos]);
  // Normalizar objetivos del API
  const normalizedObjetivos = objetivos.map(obj => {
    const montoObjetivo = parseFloat(obj.monto_objetivo || obj.MontoObjetivo || obj.montoObjetivo || 0);
    const montoActual = parseFloat(obj.monto_actual || obj.MontoActual || obj.montoActual || 0);
    const porcentaje = montoObjetivo > 0 ? Math.round((montoActual / montoObjetivo) * 100) : 0;
    
    const getColor = (pct) => {
      if (pct >= 80) return '#10b981';
      if (pct >= 50) return '#fbbf24';
      return '#3b82f6';
    };
    
    return {
      id: obj.id || obj.Id,
      nombre: obj.nombre || obj.Nombre,
      montoObjetivo,
      montoActual,
      porcentaje,
      monto_objetivo: montoObjetivo,
      monto_actual: montoActual,
      porcentaje_completado: porcentaje,
      moneda: obj.moneda || obj.Moneda || 'ARS',
      icono: obj.icono || obj.Icono || 'Home',
      color: getColor(porcentaje)
    };
  });

  const data = normalizedObjetivos;
  const icons = { Home, Plane, Car };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 pb-32">
      {/* Barra superior */}
      <div className="flex items-center justify-end mb-4 gap-2">
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 bg-[#18181b] hover:bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50"
          title="Actualizar objetivos"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
        <button onClick={onNewObjetivo} className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#0ea572] rounded-xl text-sm text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          <span>Nuevo</span>
        </button>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No hay objetivos de ahorro</h3>
          <p className="text-gray-400 mb-6">
            Crea objetivos para alcanzar tus metas financieras
          </p>
          <button 
            onClick={onNewObjetivo}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-medium hover:shadow-lg transition-all"
          >
            Crear Primer Objetivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data.map((obj) => {
          const Icon = icons[obj.icono] || Home;
          return (
            <div key={obj.id} className="bg-[#18181b] rounded-3xl p-6 border border-white/5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center"><Icon className="w-6 h-6 text-[#10b981]" /></div>
                <h3 className="text-lg font-bold text-white">{obj.nombre}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditObjetivo && onEditObjetivo(obj)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title="Editar objetivo"
                  >
                    <Pencil className="w-4 h-4 text-zinc-400 hover:text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteObjetivo && onDeleteObjetivo(obj.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Eliminar objetivo"
                  >
                    <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progreso</span>
                  <span className="text-2xl font-bold text-[#10b981]">{obj.porcentaje}%</span>
                </div>
                <div className="w-full bg-[#0a0a0a] rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(obj.porcentaje, 100)}%`,
                      background: `linear-gradient(to right, ${obj.color}, ${obj.color}dd)`
                    }} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-[#0a0a0a] rounded-xl"><p className="text-xs text-gray-500 mb-1">Actual</p><p className="text-sm font-bold text-white">${obj.montoActual.toLocaleString()}</p></div>
                <div className="text-center p-3 bg-[#0a0a0a] rounded-xl"><p className="text-xs text-gray-500 mb-1">Meta</p><p className="text-sm font-bold text-white">${obj.montoObjetivo.toLocaleString()}</p></div>
              </div>
              <button
                type="button"
                onClick={() => onAportar && onAportar(obj)}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-medium hover:shadow-lg transition-all"
              >
                Aportar
              </button>
            </div>
          );
          })}
        </div>
      )}
      

    </div>
  );
};

ModernObjetivosView.propTypes = { objetivos: PropTypes.array, onNewObjetivo: PropTypes.func, onEditObjetivo: PropTypes.func, onDeleteObjetivo: PropTypes.func, onAportar: PropTypes.func };
export default ModernObjetivosView;
