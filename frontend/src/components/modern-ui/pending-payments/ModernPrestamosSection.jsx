import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Check, Plus, RefreshCw, Search } from 'lucide-react';
import { Badge } from '../../ui/badge';
import KpiCard from '../common/KpiCard';
import ConfirmModal from '../common/ConfirmModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import PaymentRowActions from './PaymentRowActions';
import { usePrestamos, QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { useRefresh } from '../../../hooks/useRefresh';
import { useIsMobile } from '../../../hooks/use-mobile';
import { normalizePaymentDocument } from '../../../utils/documentPreviewUrl';
import { useDebounce } from '../../../hooks/useDebounce';

const PAGE_SIZE = 25;

const parseDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const EmptyState = ({ children }) => (
  <p className="text-[13.5px] italic text-muted-foreground">{children}</p>
);
EmptyState.propTypes = { children: PropTypes.node };

const EstadoPill = ({ isPaid }) => (
  <Badge variant="outline" className={isPaid ? 'border-success text-success' : 'border-warning text-warning'}>
    {isPaid ? 'pagado' : 'pendiente'}
  </Badge>
);
EstadoPill.propTypes = { isPaid: PropTypes.bool.isRequired };

const ModernPrestamosSection = ({ onNewPrestamo, onEditPrestamo, onDeletePrestamo, onMarcarPagado }) => {
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.prestamos]);
  const { formatAmount } = useAmountVisibility();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [offset, setOffset] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [prestamoToDelete, setPrestamoToDelete] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const pendingFilters = { limit: PAGE_SIZE, offset: 0, estado: 'pendiente' };
  const listFilters = {
    limit: PAGE_SIZE,
    offset,
    ...(estado === 'all' ? {} : { estado }),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const pendingQuery = usePrestamos(pendingFilters);
  const { data: prestamosData, isLoading, error } = usePrestamos(listFilters);

  useEffect(() => {
    setOffset(0);
  }, [estado, searchQuery]);

  const normalizeLoans = (response) => (response?.list || []).map((p) => ({
    ...p,
    nombre_fuente: p.nombre_fuente || 'Sin nombre',
    monto_prestado: parseFloat(p.monto_prestado || 0),
    monto_a_devolver: parseFloat(p.monto_a_devolver || 0),
    moneda: p.moneda || 'ARS',
    estado: (p.estado || 'pendiente').toString().toLowerCase(),
    document: normalizePaymentDocument(p),
  }));
  const prestamos = normalizeLoans(prestamosData);
  const pendientes = normalizeLoans(pendingQuery.data);
  const totalPrestado = pendientes.reduce((sum, p) => sum + p.monto_prestado, 0);
  const totalADevolver = pendientes.reduce((sum, p) => sum + p.monto_a_devolver, 0);
  const pageInfo = prestamosData?.pageInfo || {};
  const isPaid = (prestamo) => prestamo.estado === 'pagado';

  const renderFecha = (fecha) => {
    const parsed = parseDateSafe(fecha);
    if (!parsed) return <span className="font-mono text-[12px] italic text-muted-foreground">sin fecha</span>;
    return <span className="font-mono text-[12px] text-muted-foreground">{parsed.toLocaleDateString('es-AR')}</span>;
  };

  const openDocumentPreview = (prestamo) => {
    if (prestamo.document.isValid) setPreviewDocument(prestamo);
  };

  const requestDelete = (prestamo) => {
    setPrestamoToDelete(prestamo);
    setShowDeleteConfirm(true);
  };

  const renderActions = (prestamo) => (
    <PaymentRowActions
      entityName={prestamo.nombre_fuente}
      entityType="préstamo"
      onDocument={prestamo.document.isValid ? () => openDocumentPreview(prestamo) : undefined}
      onEdit={() => onEditPrestamo?.(prestamo)}
      onDelete={() => requestDelete(prestamo)}
    />
  );

  const renderMarkPaid = (prestamo) => !isPaid(prestamo) && (
    <button
      type="button"
      onClick={() => onMarcarPagado?.(prestamo)}
      className="flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover active:bg-primary-active focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={`Marcar préstamo ${prestamo.nombre_fuente} como pagado`}
    >
      <Check className="h-3.5 w-3.5" />
      Marcar pagado
    </button>
  );

  const handleDeleteConfirm = () => {
    if (prestamoToDelete) onDeletePrestamo?.(prestamoToDelete.id);
  };

  if (isLoading) return <div className="mt-4 h-64 w-full animate-pulse rounded-md bg-muted" />;
  if (error) return <p className="text-[13.5px] text-destructive">Error al cargar préstamos: {error.message}</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:gap-2.5">
          <KpiCard
            label="Prestado (pendiente)"
            value={formatAmount(totalPrestado, { decimals: 0 })}
            borderColor="var(--info)"
            valueColor="var(--info)"
          />
          <KpiCard
            label="A devolver (pendiente)"
            value={formatAmount(totalADevolver, { decimals: 0 })}
            subtext={`${pendientes.length} préstamo${pendientes.length !== 1 ? 's' : ''}`}
            borderColor="var(--warning)"
            valueColor="var(--warning)"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            aria-label={isRefreshing ? 'Actualizando préstamos' : 'Actualizar préstamos'}
            className="flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-[7px] font-sans text-[13px] text-foreground transition-colors hover:bg-card-hover disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Actualizando…' : 'Actualizar'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNewPrestamo?.()}
            className="flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-[7px] font-sans text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover active:bg-primary-active focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1">
          <label htmlFor="loan-search" className="sr-only">Buscar préstamos por fuente y notas</label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="loan-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por fuente o notas…"
            className="w-full max-w-sm rounded-sm border border-border bg-secondary py-[7px] pl-9 pr-3 font-mono text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <label className="sr-only" htmlFor="loan-status">Filtrar préstamos por estado</label>
        <select id="loan-status" value={estado} onChange={(event) => setEstado(event.target.value)} className="rounded-sm border border-border bg-secondary px-3 py-[7px] font-mono text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="pendiente">Pendientes</option>
          <option value="pagado">Pagados</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {isMobile ? (
        <div className="flex flex-col gap-2">
          {prestamos.length === 0 ? (
            <div className="rounded-md border border-border bg-card py-10 text-center">
              <EmptyState>{searchQuery ? `Sin resultados para "${searchQuery}".` : 'Sin préstamos registrados.'}</EmptyState>
            </div>
          ) : prestamos.map((p) => (
            <article key={p.id} data-loan-card className="rounded-md border border-border bg-card px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] text-foreground">{p.nombre_fuente}</p>
                  <div className="mt-1">{renderFecha(p.fecha_vencimiento)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[13.5px] font-semibold text-foreground">{formatAmount(p.monto_a_devolver, { decimals: 0 })}</p>
                  <div className="mt-1"><EstadoPill isPaid={isPaid(p)} /></div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-muted pt-2">
                {renderActions(p)}
                {renderMarkPaid(p)}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                {['Fuente', 'Prestado', 'A devolver', 'Vence', 'Estado', 'Acciones'].map((heading, index) => (
                  <th key={heading} className={`px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-muted-foreground ${index === 1 || index === 2 || index === 5 ? 'text-right' : 'text-left'}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prestamos.length === 0 ? (
                <tr><td colSpan={6} className="py-14 text-center"><EmptyState>{searchQuery ? `Sin resultados para "${searchQuery}".` : 'Sin préstamos registrados.'}</EmptyState></td></tr>
              ) : prestamos.map((p) => (
                <tr key={p.id} className="border-b border-muted transition-colors hover:bg-card-hover">
                  <td className="px-3.5 py-2.5 text-[13.5px] text-foreground">{p.nombre_fuente}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">{formatAmount(p.monto_prestado, { decimals: 0 })}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-foreground">{formatAmount(p.monto_a_devolver, { decimals: 0 })}</td>
                  <td className="px-3.5 py-2.5">{renderFecha(p.fecha_vencimiento)}</td>
                  <td className="px-3.5 py-2.5"><EstadoPill isPaid={isPaid(p)} /></td>
                  <td className="px-3.5 py-2.5"><div className="flex items-center justify-end gap-2">{renderMarkPaid(p)}{renderActions(p)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!pageInfo.isFirstPage || !pageInfo.isLastPage ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
            disabled={pageInfo.isFirstPage}
            aria-label="Página anterior"
            className="rounded-sm border border-border bg-secondary px-3 py-1.5 text-[12px] text-foreground disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setOffset((current) => current + PAGE_SIZE)}
            disabled={pageInfo.isLastPage}
            aria-label="Página siguiente"
            className="rounded-sm border border-border bg-secondary px-3 py-1.5 text-[12px] text-foreground disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      ) : null}

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
      <DocumentPreviewModal
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        documentUrl={previewDocument?.document.href || ''}
        title={previewDocument ? `Documento de ${previewDocument.nombre_fuente}` : 'Vista previa del documento'}
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
