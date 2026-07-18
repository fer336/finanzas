import PropTypes from 'prop-types';
import { AlertCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { getCategoryIcon } from '../common/categoryIcons';
import { useCategories, QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useRefresh } from '../../../hooks/useRefresh';

/**
 * ModernCategoriesView — CRUD de categorías, tema "Kanagawa".
 * Vive como sub-sección embebida dentro de Ajustes (ver
 * design_handoff_rediseno_papel/README.md "7. Ajustes" y "Mapa de
 * migración"), por eso no trae su propio fondo de página / min-h-screen —
 * se monta dentro de la card de la sección que lo contiene.
 *
 * Tabla igual al patrón de CEDEARs/Inversiones (mono uppercase header,
 * hover #e4d794) en vez de la grilla de cards anterior — el pedido
 * explícito fue que la lista de categorías era confusa como grilla.
 */
const ModernCategoriesView = ({ onNewCategory, onEditCategory, onDeleteCategory }) => {
  // ====== REACT QUERY ======
  const { data: categoriesData, isLoading, error } = useCategories();
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.categories]);

  if (isLoading) {
    return <LoadingSpinner message="Cargando categorías..." fullScreen={false} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <AlertCircle className="h-8 w-8 text-[#b83245] dark:text-[#e46876]" />
        <p className="font-serif text-[15px] font-semibold text-foreground">Error al cargar categorías</p>
        <p className="text-[12.5px] text-[#625f55] dark:text-[#c8c093]">{error.message}</p>
      </div>
    );
  }

  const data = (categoriesData || []).map((cat) => ({
    id: cat.id || cat.Id,
    nombre: cat.nombre || cat.Nombre || 'Sin nombre',
    tipo: cat.tipo || cat.Tipo || 'gasto',
    color: cat.color || cat.Color || 'var(--success)',
    icono: cat.icono || cat.Icono || '',
    activa: cat.activa !== undefined ? cat.activa : (cat.Activa !== undefined ? cat.Activa : true),
    descripcion: cat.descripcion || cat.Descripcion || '',
  }));

  const total = data.length;
  const gastos = data.filter((c) => c.tipo === 'gasto').length;
  const ingresos = data.filter((c) => c.tipo === 'ingreso').length;
  const activas = data.filter((c) => c.activa).length;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-[12.5px] text-[#625f55] dark:text-[#c8c093]">Dale orden visual a tus gastos e ingresos.</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-sm border border-[#c8bf91] bg-white px-3 py-[7px] font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-[#e4d794] disabled:opacity-50 dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#363646]"
            title="Actualizar categorías"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Actualizando…' : 'Actualizar'}</span>
          </button>
          <button
            type="button"
            onClick={onNewCategory}
            className="flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-[7px] font-sans text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] dark:hover:bg-[#76946a]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva</span>
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-sm border border-[#c8bf91] bg-white p-3 dark:border-[#363646] dark:bg-[#2a2a37]">
          <p className="text-[10.5px] uppercase tracking-[.06em] text-[#625f55] dark:text-[#c8c093]">Total</p>
          <p className="mt-1 font-mono text-[20px] font-semibold text-foreground">{total}</p>
        </div>
        <div className="rounded-sm border border-[#c8bf91] bg-white p-3 dark:border-[#363646] dark:bg-[#2a2a37]">
          <p className="text-[10.5px] uppercase tracking-[.06em] text-[#625f55] dark:text-[#c8c093]">Gastos</p>
          <p className="mt-1 font-mono text-[20px] font-semibold text-[#b83245] dark:text-[#e46876]">{gastos}</p>
        </div>
        <div className="rounded-sm border border-[#c8bf91] bg-white p-3 dark:border-[#363646] dark:bg-[#2a2a37]">
          <p className="text-[10.5px] uppercase tracking-[.06em] text-[#625f55] dark:text-[#c8c093]">Ingresos</p>
          <p className="mt-1 font-mono text-[20px] font-semibold text-[#526a3a] dark:text-[#98bb6c]">{ingresos}</p>
        </div>
        <div className="rounded-sm border border-[#c8bf91] bg-white p-3 dark:border-[#363646] dark:bg-[#2a2a37]">
          <p className="text-[10.5px] uppercase tracking-[.06em] text-[#625f55] dark:text-[#c8c093]">Activas</p>
          <p className="mt-1 font-mono text-[20px] font-semibold text-primary">{activas}</p>
        </div>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-md border border-[#c8bf91] bg-card dark:border-[#363646]">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b-2 border-[#c8bf91] dark:border-[#363646]">
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#625f55] dark:text-[#c8c093]" style={{ letterSpacing: '.08em' }}>Categoría</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#625f55] dark:text-[#c8c093]" style={{ letterSpacing: '.08em' }}>Tipo</th>
              <th className="hidden px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#625f55] sm:table-cell dark:text-[#c8c093]" style={{ letterSpacing: '.08em' }}>Descripción</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#625f55] dark:text-[#c8c093]" style={{ letterSpacing: '.08em' }}>Estado</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#625f55] dark:text-[#c8c093]" style={{ letterSpacing: '.08em' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center">
                  <p className="text-[13.5px] italic text-muted-foreground">Sin categorías creadas.</p>
                </td>
              </tr>
            ) : (
              data.map((cat) => {
                const Icon = getCategoryIcon(cat.icono);
                const isIngreso = cat.tipo === 'ingreso';
                return (
                  <tr key={cat.id} className="group border-b border-[#d5cea3] transition-colors hover:bg-[#e4d794] dark:border-[#363646] dark:hover:bg-[#2a2a37]">
                    <td className="px-3.5 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-base"
                          style={{ backgroundColor: `${cat.color}22` }}
                        >
                          {Icon ? <Icon size={16} color={cat.color} /> : (cat.icono || '📁')}
                        </div>
                        <span className="truncate font-serif text-[14.5px] font-semibold text-foreground">{cat.nombre}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className="inline-flex rounded-full border px-2 py-[2px] font-mono text-[10.5px] uppercase tracking-[.04em]"
                        style={{
                          borderColor: isIngreso ? 'var(--primary)' : 'var(--destructive)',
                          color: isIngreso ? 'var(--success)' : 'var(--destructive)',
                        }}
                      >
                        {cat.tipo}
                      </span>
                    </td>
                    <td className="hidden max-w-[240px] px-3.5 py-2.5 text-[12.5px] text-[#625f55] sm:table-cell dark:text-[#c8c093]">
                      <span className="line-clamp-1">{cat.descripcion || '—'}</span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-[2px] font-mono text-[10.5px] uppercase tracking-[.04em] ${
                          cat.activa ? 'border-[#526a3a] text-[#526a3a] dark:border-[#98bb6c] dark:text-[#98bb6c]' : 'border-[#c8bf91] text-[#625f55] dark:border-[#363646] dark:text-[#c8c093]'
                        }`}
                      >
                        {cat.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onEditCategory && onEditCategory(cat)}
                          className="rounded-sm p-1.5 text-[#625f55] transition-colors hover:bg-black/5 hover:text-foreground dark:text-[#c8c093] dark:hover:bg-white/5"
                          title="Editar categoría"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory && onDeleteCategory(cat.id)}
                          className="rounded-sm p-1.5 text-[#625f55] transition-colors hover:bg-black/5 hover:text-[#b83245] dark:text-[#c8c093] dark:hover:bg-white/5 dark:hover:text-[#e46876]"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
