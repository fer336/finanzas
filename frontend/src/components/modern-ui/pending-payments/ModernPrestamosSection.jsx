import { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, Edit, Trash2, Check, RefreshCw, Plus } from 'lucide-react';
import { Badge } from '../../ui/badge';
import KpiCard from '../common/KpiCard';
import ConfirmModal from '../common/ConfirmModal';
import { usePrestamos, QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { useRefresh } from '../../../hooks/useRefresh';

const parseDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const EmptyState = ({ children }) => (
  <p className="text-[13.5px] italic text-muted-foreground">{children}</p>
);
EmptyState.propTypes = { children: PropTypes.node };

const EstadoPill = ({ isPaid }) => {
  const pillClassName = isPaid
    ? 'border-[#476442] text-[#476442] dark:border-[#8fae7f] dark:text-[#8fae7f]'
    : 'border-[#e0c98a] text-[#8a6a1f] dark:border-[#d8ac5a] dark:text-[#d8ac5a]';
  return (
    <Badge variant="outline" className={pillClassName}>
      {isPaid ? 'pagado' : 'pendiente'}
    </Badge>
  );
};
EstadoPill.propTypes = { isPaid: PropTypes.bool.isRequired };

/**
 * ModernPrestamosSection — pestaña "Préstamos" dentro de Vencimientos.
 * Mismos tokens Papel que ModernPendingPaymentsView (tabla mono uppercase
 * header, hover #f0ead9, pills pendiente/pagado).
 */
const ModernPrestamosSection = ({
  onNewPrestamo,
  onEditPrestamo,
  onDeletePrestamo,
  onMarcarPagado,
}) => {
  const { data: prestamosData, isLoading, error } = usePrestamos();
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.prestamos]);
  const { formatAmount } = useAmountVisibility();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [prestamoToDelete, setPrestamoToDelete] = useState(null);

  const prestamos = (prestamosData || []).map((p) => ({
    ...p,
    id: p.id,
    nombre_fuente: p.nombre_fuente || 'Sin nombre',
    monto_prestado: parseFloat(p.monto_prestado || 0),
    monto_a_devolver: parseFloat(p.monto_a_devolver || 0),
    moneda: p.moneda || 'ARS',
    estado: (p.estado || 'pendiente').toString().toLowerCase(),
  }));

  const isPaid = (p) => p.estado === 'pagado';

  let filteredData = prestamos;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = filteredData.filter((p) => p.nombre_fuente.toLowerCase().includes(query));
  }

  const sortedData = [...filteredData].sort((a, b) => {
    const fa = parseDateSafe(a.fecha_vencimiento);
    const fb = parseDateSafe(b.fecha_vencimiento);
    if (!fa) return 1;
    if (!fb) return -1;
    return fa - fb;
  });

  const pendientes = prestamos.filter((p) => !isPaid(p));
  const totalPrestado = pendientes.reduce((sum, p) => sum + p.monto_prestado, 0);
  const totalADevolver = pendientes.reduce((sum, p) => sum + p.monto_a_devolver, 0);

  const renderFecha = (fecha) => {
    const parsed = parseDateSafe(fecha);
    if (!parsed) return <span className="font-mono text-[12px] italic text-[#8a8677] dark:text-[#93a0af]">sin fecha</span>;
    return <span className="font-mono text-[12px] text-[#5d6470] dark:text-[#93a0af]">{parsed.toLocaleDateString('es-AR')}</span>;
  };

  const handleDeleteConfirm = () => {
    if (prestamoToDelete) onDeletePrestamo && onDeletePrestamo(prestamoToDelete.id);
  };

  if (isLoading) {
    return <div className="mt-4 h-64 w-full animate-pulse rounded-md bg-[#e7e0cf] dark:bg-[#2e3844]" />;
  }

  if (error) {
    return <p className="text-[13.5px] text-[#a04a34] dark:text-[#c26a52]">Error al cargar préstamos: {error.message}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:gap-2.5">
          <KpiCard
            label="Prestado (pendiente)"
            value={formatAmount(totalPrestado, { decimals: 0 })}
            borderColor="#3d5a80"
            valueColor="#3d5a80"
          />
          <KpiCard
            label="A devolver (pendiente)"
            value={formatAmount(totalADevolver, { decimals: 0 })}
            subtext={`${pendientes.length} préstamo${pendientes.length !== 1 ? 's' : ''}`}
            borderColor="#e9c46a"
            valueColor="var(--accent-foreground)"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] px-3 py-[7px] font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9] dark:hover:bg-[#212836] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Actualizando…' : 'Actualizar'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNewPrestamo && onNewPrestamo()}
            className="flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-[7px] font-sans text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047] dark:hover:bg-[#7d9970]"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8677] dark:text-[#93a0af]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por fuente…"
          className="w-full max-w-sm rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] py-[7px] pl-9 pr-3 font-mono text-[12px] text-foreground placeholder:text-[#8a8677] dark:placeholder:text-[#93a0af] focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-md border border-[#ddd5c2] dark:border-[#2e3844] bg-card">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b-2 border-[#ddd5c2] dark:border-[#2e3844]">
              <th className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Fuente</th>
              <th className="text-right px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Prestado</th>
              <th className="text-right px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>A devolver</th>
              <th className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Vence</th>
              <th className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Estado</th>
              <th className="text-right px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <EmptyState>
                    {searchQuery ? `Sin resultados para "${searchQuery}".` : 'Sin préstamos registrados.'}
                  </EmptyState>
                </td>
              </tr>
            ) : (
              sortedData.map((p) => {
                const paid = isPaid(p);
                return (
                  <tr key={p.id} className="group border-b border-[#e7e0cf] dark:border-[#2e3844] hover:bg-[#f0ead9] dark:hover:bg-[#212836] transition-colors">
                    <td className="px-3.5 py-2.5 text-[13.5px] text-foreground">{p.nombre_fuente}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-[#5d6470] dark:text-[#93a0af]">
                      {formatAmount(p.monto_prestado, { decimals: 0 })}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-foreground">
                      {formatAmount(p.monto_a_devolver, { decimals: 0 })}
                    </td>
                    <td className="px-3.5 py-2.5">{renderFecha(p.fecha_vencimiento)}</td>
                    <td className="px-3.5 py-2.5">
                      <EstadoPill isPaid={paid} />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {!paid && (
                          <button
                            onClick={() => onMarcarPagado && onMarcarPagado(p)}
                            className="flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047] dark:hover:bg-[#7d9970]"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Marcar pagado
                          </button>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditPrestamo && onEditPrestamo(p)}
                            className="p-1.5 rounded-sm hover:bg-black/5 transition-colors dark:hover:bg-card-hover"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4 text-[#8a8677] dark:text-[#93a0af]" />
                          </button>
                          <button
                            onClick={() => { setPrestamoToDelete(p); setShowDeleteConfirm(true); }}
                            className="p-1.5 rounded-sm hover:bg-black/5 transition-colors dark:hover:bg-card-hover"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-[#8a8677] dark:text-[#93a0af] hover:text-[#a04a34] dark:hover:text-[#c26a52]" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setPrestamoToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar préstamo?"
        message={`¿Estás seguro de eliminar el préstamo de "${prestamoToDelete?.nombre_fuente}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

ModernPrestamosSection.propTypes = {
  onNewPrestamo: PropTypes.func,
  onEditPrestamo: PropTypes.func,
  onDeletePrestamo: PropTypes.func,
  onMarcarPagado: PropTypes.func,
};

export default ModernPrestamosSection;
