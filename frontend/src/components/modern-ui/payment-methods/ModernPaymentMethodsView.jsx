import PropTypes from 'prop-types';
import { CreditCard, Landmark, Pencil, Plus, RefreshCw, Trash2, Wallet } from 'lucide-react';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';

/**
 * ModernPaymentMethodsView — CRUD de métodos de pago, tema "Kanagawa".
 * Vive como sub-sección embebida dentro de Ajustes (tab "Métodos de
 * pago"), por eso no trae fondo de página propio — mismo patrón que
 * ModernCategoriesView (tabla mono uppercase header, hover #e4d794) en
 * vez de la grilla de cards oscura anterior.
 */
const resolveIcon = (icono = '', tipo = '') => {
  const iconText = (icono || '').toString().trim();
  const tipoText = (tipo || '').toString().toLowerCase();

  if (iconText && iconText.length <= 2) return null; // emoji, se renderiza tal cual
  if (iconText.toLowerCase().includes('wallet') || tipoText.includes('efectivo')) return Wallet;
  if (iconText.toLowerCase().includes('bank') || tipoText.includes('transfer')) return Landmark;
  return CreditCard;
};

const formatTypeLabel = (tipo = '') => {
  const clean = tipo.toString().replace(/_/g, ' ').trim();
  if (!clean) return 'Otro';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const ModernPaymentMethodsView = ({
  paymentMethods = [],
  onNewPaymentMethod,
  onEditPaymentMethod,
  onDeletePaymentMethod,
}) => {
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.paymentMethods]);

  const data = paymentMethods.map((pm) => ({
    id: pm.id || pm.Id,
    nombre: pm.nombre || pm.Nombre || 'Sin nombre',
    tipo: pm.tipo || pm.Tipo || 'otro',
    color: pm.color || pm.Color || 'var(--success)',
    icono: pm.icono || pm.Icono || '',
    activo: pm.activo !== undefined ? pm.activo : (pm.Activo !== undefined ? pm.Activo : true),
    descripcion: pm.descripcion || pm.Descripcion || '',
  }));

  const total = data.length;
  const activos = data.filter((pm) => pm.activo).length;
  const inactivos = data.filter((pm) => !pm.activo).length;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-[12.5px] text-[#625f55] dark:text-[#c8c093]">Organizá cómo registrás cada movimiento.</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-sm border border-[#c8bf91] bg-white px-3 py-[7px] font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-[#e4d794] disabled:opacity-50 dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#2a2a37]"
            title="Actualizar métodos de pago"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Actualizando…' : 'Actualizar'}</span>
          </button>
          <button
            type="button"
            onClick={onNewPaymentMethod}
            className="flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-[7px] font-sans text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] dark:hover:bg-[#76946a]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-sm border border-[#c8bf91] bg-white p-3 dark:border-[#363646] dark:bg-[#2a2a37]">
          <p className="text-[10.5px] uppercase tracking-[.06em] text-[#625f55] dark:text-[#c8c093]">Total</p>
          <p className="mt-1 font-mono text-[20px] font-semibold text-foreground">{total}</p>
        </div>
        <div className="rounded-sm border border-[#c8bf91] bg-white p-3 dark:border-[#363646] dark:bg-[#2a2a37]">
          <p className="text-[10.5px] uppercase tracking-[.06em] text-[#625f55] dark:text-[#c8c093]">Activos</p>
          <p className="mt-1 font-mono text-[20px] font-semibold text-primary">{activos}</p>
        </div>
        <div className="rounded-sm border border-[#c8bf91] bg-white p-3 dark:border-[#363646] dark:bg-[#2a2a37]">
          <p className="text-[10.5px] uppercase tracking-[.06em] text-[#625f55] dark:text-[#c8c093]">Inactivos</p>
          <p className="mt-1 font-mono text-[20px] font-semibold text-[#625f55] dark:text-[#c8c093]">{inactivos}</p>
        </div>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-md border border-[#c8bf91] bg-card dark:border-[#363646]">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b-2 border-[#c8bf91] dark:border-[#363646]">
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#625f55] dark:text-[#c8c093]" style={{ letterSpacing: '.08em' }}>Método</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#625f55] dark:text-[#c8c093]" style={{ letterSpacing: '.08em' }}>Tipo</th>
              <th className="hidden px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#625f55] dark:text-[#c8c093] sm:table-cell" style={{ letterSpacing: '.08em' }}>Descripción</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#625f55] dark:text-[#c8c093]" style={{ letterSpacing: '.08em' }}>Estado</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#625f55] dark:text-[#c8c093]" style={{ letterSpacing: '.08em' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center">
                  <p className="text-[13.5px] italic text-muted-foreground">Sin métodos de pago creados.</p>
                </td>
              </tr>
            ) : (
              data.map((pm) => {
                const Icon = resolveIcon(pm.icono, pm.tipo);
                return (
                  <tr key={pm.id} className="group border-b border-[#d5cea3] transition-colors hover:bg-[#e4d794] dark:border-[#363646] dark:hover:bg-[#2a2a37]">
                    <td className="px-3.5 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-base"
                          style={{ backgroundColor: `${pm.color}22` }}
                        >
                          {Icon ? <Icon size={16} color={pm.color} /> : (pm.icono || '💳')}
                        </div>
                        <span className="truncate font-serif text-[14.5px] font-semibold text-foreground">{pm.nombre}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-flex rounded-full border border-[#c8bf91] px-2 py-[2px] font-mono text-[10.5px] uppercase tracking-[.04em] text-[#43436c] dark:border-[#363646] dark:text-[#c8c093]">
                        {formatTypeLabel(pm.tipo)}
                      </span>
                    </td>
                    <td className="hidden max-w-[240px] px-3.5 py-2.5 text-[12.5px] text-[#625f55] dark:text-[#c8c093] sm:table-cell">
                      <span className="line-clamp-1">{pm.descripcion || '—'}</span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-[2px] font-mono text-[10.5px] uppercase tracking-[.04em] ${
                          pm.activo ? 'border-[#526a3a] text-[#526a3a] dark:border-[#98bb6c] dark:text-[#98bb6c]' : 'border-[#c8bf91] text-[#625f55] dark:border-[#363646] dark:text-[#c8c093]'
                        }`}
                      >
                        {pm.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onEditPaymentMethod && onEditPaymentMethod(pm)}
                          className="rounded-sm p-1.5 text-[#625f55] transition-colors hover:bg-black/5 hover:text-foreground dark:text-[#c8c093]"
                          title="Editar método de pago"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar método "${pm.nombre}"?`)) {
                              onDeletePaymentMethod && onDeletePaymentMethod(pm.id);
                            }
                          }}
                          className="rounded-sm p-1.5 text-[#625f55] transition-colors hover:bg-black/5 hover:text-[#b83245] dark:text-[#c8c093] dark:hover:text-[#e46876]"
                          title="Eliminar método de pago"
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

ModernPaymentMethodsView.propTypes = {
  paymentMethods: PropTypes.array,
  onNewPaymentMethod: PropTypes.func,
  onEditPaymentMethod: PropTypes.func,
  onDeletePaymentMethod: PropTypes.func,
};

export default ModernPaymentMethodsView;
