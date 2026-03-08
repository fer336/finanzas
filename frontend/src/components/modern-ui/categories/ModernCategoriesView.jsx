import PropTypes from 'prop-types';
import { Plus, AlertCircle, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { useCategories, QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useRefresh } from '../../../hooks/useRefresh';

const ModernCategoriesView = ({ onNewCategory, onEditCategory, onDeleteCategory }) => {
  // ====== REACT QUERY ======
  const { data: categoriesData, isLoading, error } = useCategories();
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.categories]);
  
  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Cargando categorías..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error al cargar categorías</h2>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  const data = (categoriesData || []).map((cat) => ({
    id: cat.id || cat.Id,
    nombre: cat.nombre || cat.Nombre || 'Sin nombre',
    tipo: cat.tipo || cat.Tipo || 'gasto',
    color: cat.color || cat.Color || '#10b981',
    icono: cat.icono || cat.Icono || '📁',
    activa: cat.activa !== undefined ? cat.activa : (cat.Activa !== undefined ? cat.Activa : true),
    descripcion: cat.descripcion || cat.Descripcion || '',
  }));

  const total = data.length;
  const gastos = data.filter((c) => c.tipo === 'gasto').length;
  const ingresos = data.filter((c) => c.tipo === 'ingreso').length;
  const activas = data.filter((c) => c.activa).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3 pb-28 sm:p-5">
      <div className="mb-4 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1927] via-[#161925] to-[#1c1523] p-3.5 sm:mb-5 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2.5">
          <div>
            <h1 className="text-lg font-bold text-white sm:text-2xl">Categorías</h1>
            <p className="mt-0.5 text-[11px] text-white/60 sm:text-sm">Dale orden visual a tus gastos e ingresos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#18181b]/90 px-2.5 py-1.5 text-xs text-gray-300 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm"
              title="Actualizar categorías"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
            <button onClick={onNewCategory} className="flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[#0ea572] active:scale-[0.98] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
              <Plus className="w-4 h-4" />
              <span>Nueva</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5 sm:p-3">
            <p className="text-[10px] text-white/50">TOTAL</p>
            <p className="mt-0.5 text-xl font-bold text-white sm:text-2xl">{total}</p>
          </div>
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-2.5 sm:p-3">
            <p className="text-[10px] text-red-300/80">GASTOS</p>
            <p className="mt-0.5 text-xl font-bold text-red-300 sm:text-2xl">{gastos}</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-2.5 sm:p-3">
            <p className="text-[10px] text-cyan-300/80">INGRESOS</p>
            <p className="mt-0.5 text-xl font-bold text-cyan-300 sm:text-2xl">{ingresos}</p>
          </div>
          <div className="rounded-2xl border border-[#10b981]/20 bg-[#10b981]/10 p-2.5 sm:p-3">
            <p className="text-[10px] text-[#10b981]/80">ACTIVAS</p>
            <p className="mt-0.5 text-xl font-bold text-[#10b981] sm:text-2xl">{activas}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-4">
        {data.map((cat) => (
          <div key={cat.id} className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#18181b] via-[#171724] to-[#121823] p-3.5 transition-all hover:border-cyan-400/30 sm:p-4">
            <div className="flex items-start justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl text-2xl flex items-center justify-center shrink-0 border border-white/10" style={{ backgroundColor: `${cat.color}20` }}>{cat.icono}</div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-white truncate sm:text-base">{cat.nombre}</h3>
                  <p className="text-[11px] text-white/60 capitalize">{cat.tipo}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onEditCategory && onEditCategory(cat)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  title="Editar categoría"
                >
                  <Pencil className="w-4 h-4 text-cyan-400" />
                </button>
                <button
                  onClick={() => onDeleteCategory && onDeleteCategory(cat.id)}
                  className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  title="Eliminar categoría"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {cat.descripcion && (
              <p className="mb-2.5 text-[11px] text-white/45 line-clamp-2">{cat.descripcion}</p>
            )}

            <div className="flex items-center justify-between">
              <span className={`text-xs px-2.5 py-1 rounded-full border ${cat.activa ? 'border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]' : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'}`}>{cat.activa ? 'Activa' : 'Inactiva'}</span>
              <span className="text-[10px] uppercase tracking-wide text-white/40">{cat.tipo}</span>
            </div>
          </div>
        ))}
      </div>
      

    </div>
  );
};

ModernCategoriesView.propTypes = {
  onNewCategory: PropTypes.func,
  onEditCategory: PropTypes.func,
  onDeleteCategory: PropTypes.func,
};
export default ModernCategoriesView;
