import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Search, Edit, Trash2, Check, ChevronLeft, ChevronRight, RefreshCw, Plus, Eye } from 'lucide-react';
import { Badge } from '../../ui/badge';
import KpiCard from '../common/KpiCard';
import ConfirmModal from '../common/ConfirmModal';
import ModernPrestamosSection from './ModernPrestamosSection';
import DocumentPreviewModal from './DocumentPreviewModal';
import { usePendingPayments, QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { useRefresh } from '../../../hooks/useRefresh';
import { useIsMobile } from '../../../hooks/use-mobile';
import { normalizePaymentDocument } from '../../../utils/documentPreviewUrl';
import {
  PENDING_PAYMENT_STATUS,
  compareLocalDateOnly,
  derivePendingPaymentStatus,
  formatLocalDateDisplay,
  getSecondDueDateValue,
  isPagoPaid,
  normalizePendingPaymentDueDates,
  parseLocalDateOnly,
} from '../../../utils/pendingPaymentStatus';

const SECTION_KEY = 'vencimientos_section'; // 'vencimientos' | 'prestamos'
const loadSection = () => {
  try {
    return localStorage.getItem(SECTION_KEY) || 'vencimientos';
  } catch {
    return 'vencimientos';
  }
};

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// ─── Piezas de UI compartidas con el patrón Kanagawa (ver ModernTransactionsView) ──
const FilterSelect = ({ className = '', ...props }) => (
  <select
    {...props}
    className={`rounded-sm border border-border bg-secondary px-3 py-[7px] font-mono text-[12px] text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring ${className}`}
  />
);
FilterSelect.propTypes = { className: PropTypes.string };

const EmptyState = ({ children }) => (
  <p className="text-[13.5px] italic text-muted-foreground">{children}</p>
);
EmptyState.propTypes = { children: PropTypes.node };

// Toggle de pills Mensual/Acumulado (mismo patrón visual que Movimientos).
const PillToggle = ({ options, value, onChange, activeClassName, idPrefix, ariaLabel }) => (
  <div className="inline-flex items-center gap-[3px] rounded-full border border-border bg-card p-[3px]" aria-label={ariaLabel}>
    {options.map((opt) => (
      <button
        id={idPrefix ? `${idPrefix}-${opt.value}` : undefined}
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`rounded-full px-3 py-1 font-mono text-[12px] transition-colors duration-150 ${
          value === opt.value ? `${activeClassName} font-semibold` : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

PillToggle.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  activeClassName: PropTypes.string.isRequired,
  idPrefix: PropTypes.string,
  ariaLabel: PropTypes.string,
};

const ModernPendingPaymentsView = ({
  onMarcarPagado,
  onNewPago,
  onEditPago,
  onDeletePago,
  onNewPrestamo,
  onEditPrestamo,
  onDeletePrestamo,
  onMarcarPagadoPrestamo,
}) => {
  const { data: pagosData, isLoading, error } = usePendingPayments();
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.pendingPayments]);
  const isMobile = useIsMobile();
  const { formatAmount } = useAmountVisibility();

  const [section, setSection] = useState(loadSection);
  useEffect(() => {
    try { localStorage.setItem(SECTION_KEY, section); } catch { /* ignore */ }
  }, [section]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(PENDING_PAYMENT_STATUS.PENDING);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'accumulated'
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(getCurrentMonthValue());
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const itemsPerPage = 20;
  const controlIds = {
    mobileViewMode: 'pending-payments-mobile-view-mode',
    mobileMonth: 'pending-payments-mobile-month',
    mobileSearch: 'pending-payments-mobile-search',
    mobileStatus: 'pending-payments-mobile-status',
    desktopViewMode: 'pending-payments-desktop-view-mode',
    desktopMonth: 'pending-payments-desktop-month',
    desktopSearch: 'pending-payments-desktop-search',
    desktopStatus: 'pending-payments-desktop-status',
    section: 'pending-payments-section',
  };

  // Normalizar datos del backend (misma lógica que la versión anterior de esta vista).
  const pagos = (pagosData?.list || pagosData || []).map((p) => {
    const categoriaObj = p.Categorias || p.categorias1 || p.categoria || null;
    const categoriaNombre = categoriaObj?.nombre || categoriaObj?.Nombre || 'Sin categoría';
    const fechaVencimiento = p.fecha_vencimiento || p.FechaVencimiento || p.fechavencimiento || p.Fechavencimiento;
    const segundaFechaVencimiento = getSecondDueDateValue(p);
    const normalizedDates = normalizePendingPaymentDueDates({ ...p, fechaVencimiento, segunda_fecha_vencimiento: segundaFechaVencimiento });
    const normalizedPayment = {
      ...p,
      fechavencimiento: normalizedDates.firstDueDate,
      segunda_fecha_vencimiento: normalizedDates.secondDueDate,
    };
    const temporalStatus = derivePendingPaymentStatus(normalizedPayment);

    return {
      ...p,
      id: p.id || p.Id,
      nombre: p.nombre || p.Nombre || 'Sin nombre',
      descripcion: p.descripcion || p.Descripcion || '',
      monto: parseFloat(p.monto || p.Monto || 0),
      moneda: p.moneda || p.Moneda || 'ARS',
      fechaVencimiento: normalizedDates.firstDueDate,
      segundaFechaVencimiento: normalizedDates.secondDueDate,
      estado: (p.estado || p.Estado || 'pendiente').toString().toLowerCase(),
      temporalStatus,
      categoria: categoriaNombre,
      document: normalizePaymentDocument(p),
    };
  });

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedStatus, viewMode, selectedMonthFilter]);

  // ── Filtros ──────────────────────────────────────────────────────────────
  let baseFilteredData = pagos;

  if (viewMode === 'monthly') {
    const [selYear, selMonth] = selectedMonthFilter.split('-').map(Number);
    baseFilteredData = baseFilteredData.filter((p) => {
      const fecha = parseLocalDateOnly(p.fechaVencimiento);
      if (!fecha) return false;
      return fecha.getMonth() === selMonth - 1 && fecha.getFullYear() === selYear;
    });
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    baseFilteredData = baseFilteredData.filter((p) =>
      p.nombre.toLowerCase().includes(query)
      || p.descripcion.toLowerCase().includes(query)
      || p.categoria.toLowerCase().includes(query)
    );
  }

  const pendientes = baseFilteredData.filter((p) => !isPagoPaid(p));
  const vencidos = pendientes.filter((p) => p.temporalStatus === PENDING_PAYMENT_STATUS.OVERDUE);
  const enMora = pendientes.filter((p) => p.temporalStatus === PENDING_PAYMENT_STATUS.IN_ARREARS);
  const totalPendiente = pendientes.reduce((sum, p) => sum + p.monto, 0);
  const totalVencido = vencidos.reduce((sum, p) => sum + p.monto, 0);

  let filteredData = baseFilteredData;

  if (selectedStatus !== 'all') {
    filteredData = filteredData.filter((p) => p.temporalStatus === selectedStatus);
  }

  const sortedData = [...filteredData].sort(
    (a, b) => compareLocalDateOnly(a.fechaVencimiento, b.fechaVencimiento)
  );

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Render de celda de fecha ("a confirmar" en itálica si no hay fecha) ──
  const renderFecha = (fechaVencimiento, segundaFechaVencimiento) => {
    const firstDisplay = formatLocalDateDisplay(fechaVencimiento);
    const secondDisplay = formatLocalDateDisplay(segundaFechaVencimiento);
    if (!firstDisplay) {
      return <span className="font-mono text-[12px] italic text-muted-foreground">a confirmar</span>;
    }
    return (
      <span className="inline-flex flex-col gap-0.5 font-mono text-[12px] text-muted-foreground" aria-label={secondDisplay ? `Primer vencimiento ${firstDisplay}. Segundo vencimiento ${secondDisplay}.` : `Primer vencimiento ${firstDisplay}.`}>
        <span>1° {firstDisplay}</span>
        {secondDisplay && <span className="text-[11px] text-[#6b572f] dark:text-[#e6c384]">2° {secondDisplay}</span>}
      </span>
    );
  };

  const EstadoPill = ({ status }) => {
    const config = {
      [PENDING_PAYMENT_STATUS.PAID]: {
        label: 'Pagado',
        className: 'border-[#526a3a] text-[#526a3a] dark:border-[#98bb6c] dark:text-[#98bb6c]',
      },
      [PENDING_PAYMENT_STATUS.IN_ARREARS]: {
        label: 'En mora',
        className: 'border-[#a36a00] bg-[#efe1ba] text-[#5e441a] dark:border-[#e6c384] dark:bg-[#3f3544] dark:text-[#e6c384]',
      },
      [PENDING_PAYMENT_STATUS.OVERDUE]: {
        label: 'Vencido',
        className: 'border-[#822d33] bg-[#f5d0d3] text-[#822d33] dark:border-[#d33e48] dark:bg-[#351417] dark:text-[#ff9aa2]',
      },
      [PENDING_PAYMENT_STATUS.PENDING]: {
        label: 'Pendiente',
        className: 'border-[#de9800] text-[#6b572f] dark:border-[#e6c384] dark:text-[#e6c384]',
      },
    }[status] || {
      label: 'Pendiente',
      className: 'border-[#de9800] text-[#6b572f] dark:border-[#e6c384] dark:text-[#e6c384]',
    };
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };
  EstadoPill.propTypes = { status: PropTypes.string.isRequired };

  const rowToneClassName = (status) => {
    if (status === PENDING_PAYMENT_STATUS.OVERDUE) {
      return 'border-[#b83245] bg-[#f9e1e3] text-foreground dark:border-[#d33e48] dark:bg-[#2a1014]';
    }
    if (status === PENDING_PAYMENT_STATUS.IN_ARREARS) {
      return 'border-[#d6a546] bg-[#f5ebcf] text-foreground dark:border-[#e6c384] dark:bg-[#231d24]';
    }
    return 'border-border bg-card';
  };

  const tableRowToneClassName = (status) => {
    if (status === PENDING_PAYMENT_STATUS.OVERDUE) {
      return 'border-[#b83245] bg-[#f9e1e3] hover:bg-[#f4cdd1] dark:border-[#d33e48] dark:bg-[#2a1014] dark:hover:bg-[#351417]';
    }
    if (status === PENDING_PAYMENT_STATUS.IN_ARREARS) {
      return 'border-[#d6a546] bg-[#f5ebcf] hover:bg-[#efe1ba] dark:border-[#e6c384] dark:bg-[#231d24] dark:hover:bg-[#2f2731]';
    }
    return 'border-muted hover:bg-card-hover';
  };

  const RefreshButton = () => (
    <button
      type="button"
      onClick={refresh}
      disabled={isRefreshing}
      title={isRefreshing ? 'Actualizando…' : 'Actualizar'}
      aria-label={isRefreshing ? 'Actualizando…' : 'Actualizar'}
      className="flex items-center justify-center gap-1.5 rounded-sm border border-border bg-secondary px-2.5 py-[7px] font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-card-hover disabled:opacity-50 sm:px-3"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{isRefreshing ? 'Actualizando…' : 'Actualizar'}</span>
    </button>
  );

  const NewPagoButton = () => (
    <button
      type="button"
      onClick={() => onNewPago && onNewPago()}
      title="Nuevo vencimiento"
      aria-label="Nuevo vencimiento"
      className="flex items-center justify-center gap-1.5 rounded-sm bg-primary px-2.5 py-[7px] font-sans text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover active:bg-primary-active sm:px-3.5"
    >
      <Plus className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Nuevo</span>
    </button>
  );

  // ── Toggle de sección (Vencimientos / Préstamos) ─────────────────────────
  const SectionToggle = () => (
    <PillToggle
      options={[{ value: 'vencimientos', label: 'Vencimientos' }, { value: 'prestamos', label: 'Préstamos' }]}
      value={section}
      onChange={setSection}
      activeClassName="bg-primary text-primary-foreground"
      idPrefix={controlIds.section}
      ariaLabel="Sección de vencimientos"
    />
  );

  if (section === 'prestamos') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1100px] px-4 py-4 sm:px-[34px] sm:py-[28px]">
          <div className={`flex items-end justify-between gap-5 border-b-[3px] border-double border-[#b8ad78] dark:border-border ${isMobile ? 'mb-3 pb-3' : 'mb-[22px] pb-[18px]'}`}>
            <h1 className={`font-serif font-bold leading-none text-foreground ${isMobile ? 'text-[26px]' : 'text-[42px]'}`}>Vencimientos</h1>
          </div>
          <div className="mb-4">
            <SectionToggle />
          </div>
          <ModernPrestamosSection
            onNewPrestamo={onNewPrestamo}
            onEditPrestamo={onEditPrestamo}
            onDeletePrestamo={onDeletePrestamo}
            onMarcarPagado={onMarcarPagadoPrestamo}
          />
        </div>
      </div>
    );
  }

  // ── Loading / error ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1100px] px-[34px] py-[28px]">
          <div className="h-8 w-56 animate-pulse rounded-sm bg-[#d5cea3] dark:bg-muted" />
          <div className="mt-4 h-24 w-full max-w-xs animate-pulse rounded-md bg-[#d5cea3] dark:bg-muted" />
          <div className="mt-5 h-64 w-full animate-pulse rounded-md bg-[#d5cea3] dark:bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[13.5px] text-[#b83245]">Error al cargar vencimientos: {error.message}</p>
      </div>
    );
  }

  const openDocumentPreview = (p) => {
    if (p.document?.isValid) setPreviewDocument(p);
  };

  const handleDeleteConfirm = () => {
    if (pagoToDelete) onDeletePago && onDeletePago(pagoToDelete.id);
  };

  // ── Render mobile ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen pb-8">
        <div className="px-4 pt-4 pb-3">
          <div className="mb-3 flex items-end justify-between gap-2 border-b-[3px] border-double border-[#b8ad78] pb-3 dark:border-border">
            <h1 className="min-w-0 flex-1 truncate font-serif text-[26px] font-bold leading-none text-foreground">Vencimientos</h1>
            <div className="flex shrink-0 items-center gap-2">
              <RefreshButton />
              <NewPagoButton />
            </div>
          </div>

          <div className="mb-3">
            <SectionToggle />
          </div>

          <div className="mb-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <KpiCard
                label="Total pendiente"
                value={formatAmount(totalPendiente, { decimals: 0 })}
                subtext={`${pendientes.length} sin pagar · ${enMora.length} en mora`}
                borderColor="#f9d791"
                valueColor="var(--warning)"
              />
              <KpiCard
                label="Vencidos"
                value={formatAmount(totalVencido, { decimals: 0 })}
                subtext={`${vencidos.length} vencido${vencidos.length !== 1 ? 's' : ''}`}
                borderColor="var(--destructive)"
                valueColor="var(--destructive)"
              />
            </div>
          </div>

          <div className="mb-2.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <PillToggle
              options={[{ value: 'monthly', label: 'Mensual' }, { value: 'accumulated', label: 'Acumulado' }]}
              value={viewMode}
              onChange={setViewMode}
              activeClassName="bg-primary text-primary-foreground"
              idPrefix={controlIds.mobileViewMode}
              ariaLabel="Modo de período"
            />
            {viewMode === 'monthly' && (
              <div className="min-w-0">
                <label htmlFor={controlIds.mobileMonth} className="sr-only">Mes de vencimientos</label>
                <input
                  id={controlIds.mobileMonth}
                  type="month"
                  value={selectedMonthFilter}
                  onChange={(e) => setSelectedMonthFilter(e.target.value)}
                  className="min-w-0 rounded-sm border border-border bg-secondary px-2 py-1.5 font-mono text-[11.5px] text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>

          <div className="relative mb-2.5">
            <label htmlFor={controlIds.mobileSearch} className="sr-only">Buscar vencimientos</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id={controlIds.mobileSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded-sm border border-border bg-secondary py-2 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
            />
          </div>

          <label htmlFor={controlIds.mobileStatus} className="sr-only">Filtrar vencimientos por estado</label>
          <FilterSelect
            id={controlIds.mobileStatus}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2"
          >
            <option value="all">Todos los estados</option>
            <option value={PENDING_PAYMENT_STATUS.PENDING}>Pendientes</option>
            <option value={PENDING_PAYMENT_STATUS.IN_ARREARS}>En mora</option>
            <option value={PENDING_PAYMENT_STATUS.OVERDUE}>Vencidos</option>
            <option value={PENDING_PAYMENT_STATUS.PAID}>Pagados</option>
          </FilterSelect>
        </div>

        <div className="flex flex-col gap-2 px-4">
          {paginatedData.length === 0 ? (
            <div className="flex items-center justify-center rounded-md border border-border bg-card py-10">
              <EmptyState>
                {searchQuery ? `Sin resultados para "${searchQuery}".` : 'Sin vencimientos en esta vista.'}
              </EmptyState>
            </div>
          ) : (
            paginatedData.map((p) => {
              return (
                <div key={p.id} className={`rounded-md border px-3.5 py-3 ${rowToneClassName(p.temporalStatus)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] text-foreground truncate">{p.nombre}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {renderFecha(p.fechaVencimiento, p.segundaFechaVencimiento)}
                        <Badge variant="outline">{p.categoria}</Badge>
                        {p.document?.isValid && (
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(p)}
                            className="inline-flex items-center gap-1 rounded-sm border border-border bg-secondary px-2 py-1 text-[11.5px] font-medium text-foreground transition-colors hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-ring"
                            aria-label={`Ver documento de ${p.nombre}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Documento
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[13.5px] font-semibold text-foreground">
                        {formatAmount(p.monto, { decimals: 0 })}
                      </p>
                      <div className="mt-1">
                        <EstadoPill status={p.temporalStatus} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-[#d5cea3] pt-2 dark:border-muted">
                    <div className="flex gap-3">
                      <button
                        onClick={() => onEditPago && onEditPago(p)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        aria-label={`Editar vencimiento ${p.nombre}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setPagoToDelete(p); setShowDeleteConfirm(true); }}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        aria-label={`Eliminar vencimiento ${p.nombre}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {!isPagoPaid(p) && (
                      <button
                        onClick={() => onMarcarPagado && onMarcarPagado(p)}
                        className="flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 font-sans text-[12.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover active:bg-primary-active"
                        aria-label={`Marcar vencimiento ${p.nombre} como pagado`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Marcar pagado
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
              <button
                onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="rounded-sm p-2 hover:bg-black/5 disabled:opacity-30 dark:hover:bg-card-hover"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <span className="font-mono text-[12px] text-foreground">
                {currentPage} / {totalPages} <span className="text-muted-foreground">({sortedData.length})</span>
              </span>
              <button
                onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-sm p-2 hover:bg-black/5 disabled:opacity-30 dark:hover:bg-card-hover"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => { setShowDeleteConfirm(false); setPagoToDelete(null); }}
          onConfirm={handleDeleteConfirm}
          title="¿Eliminar pago?"
          message={`¿Estás seguro de eliminar "${pagoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
        <DocumentPreviewModal
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          documentUrl={previewDocument?.document?.href || ''}
          title={previewDocument ? `Documento de ${previewDocument.nombre}` : 'Vista previa del documento'}
        />
      </div>
    );
  }

  // ── Render desktop ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1100px] px-[34px] py-[28px]">
        <div className="mb-[22px] flex items-end justify-between gap-5 border-b-[3px] border-double border-[#b8ad78] pb-[18px] dark:border-border">
          <h1 className="font-serif text-[42px] font-bold leading-none text-foreground">Vencimientos</h1>
          <div className="flex items-center gap-2">
            <RefreshButton />
            <NewPagoButton />
          </div>
        </div>

        <div className="mb-4">
          <SectionToggle />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <PillToggle
            options={[{ value: 'monthly', label: 'Mensual' }, { value: 'accumulated', label: 'Acumulado' }]}
            value={viewMode}
            onChange={setViewMode}
            activeClassName="bg-primary text-primary-foreground"
            idPrefix={controlIds.desktopViewMode}
            ariaLabel="Modo de período"
          />
          {viewMode === 'monthly' && (
            <div>
              <label htmlFor={controlIds.desktopMonth} className="sr-only">Mes de vencimientos</label>
              <input
                id={controlIds.desktopMonth}
                type="month"
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="rounded-sm border border-border bg-secondary px-3 py-[7px] font-mono text-[12px] text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>

        <div className="mb-4 flex gap-2.5">
          <div className="relative flex-1">
            <label htmlFor={controlIds.desktopSearch} className="sr-only">Buscar vencimientos</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id={controlIds.desktopSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded-sm border border-border bg-secondary py-[7px] pl-9 pr-3 font-mono text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <label htmlFor={controlIds.desktopStatus} className="sr-only">Filtrar vencimientos por estado</label>
          <FilterSelect id={controlIds.desktopStatus} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value={PENDING_PAYMENT_STATUS.PENDING}>Pendientes</option>
            <option value={PENDING_PAYMENT_STATUS.IN_ARREARS}>En mora</option>
            <option value={PENDING_PAYMENT_STATUS.OVERDUE}>Vencidos</option>
            <option value={PENDING_PAYMENT_STATUS.PAID}>Pagados</option>
          </FilterSelect>
        </div>

        <div className="mb-5 grid max-w-2xl grid-cols-2 gap-3">
          <KpiCard
            label="Total pendiente"
            value={formatAmount(totalPendiente, { decimals: 0 })}
            subtext={`${pendientes.length} sin pagar · ${enMora.length} en mora`}
            borderColor="#f9d791"
            valueColor="var(--warning)"
          />
          <KpiCard
            label="Vencidos"
            value={formatAmount(totalVencido, { decimals: 0 })}
            subtext={`${vencidos.length} vencido${vencidos.length !== 1 ? 's' : ''}`}
            borderColor="var(--destructive)"
            valueColor="var(--destructive)"
          />
        </div>

        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-muted-foreground" style={{ letterSpacing: '.08em' }}>Vence</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-muted-foreground" style={{ letterSpacing: '.08em' }}>Descripción</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-muted-foreground" style={{ letterSpacing: '.08em' }}>Categoría</th>
                <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-muted-foreground" style={{ letterSpacing: '.08em' }}>Monto</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-muted-foreground" style={{ letterSpacing: '.08em' }}>Estado</th>
                <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-muted-foreground" style={{ letterSpacing: '.08em' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <EmptyState>
                      {searchQuery ? `Sin resultados para "${searchQuery}".` : 'Sin vencimientos en esta vista.'}
                    </EmptyState>
                  </td>
                </tr>
              ) : (
                paginatedData.map((p) => {
                  return (
                    <tr key={p.id} className={`group border-b transition-colors ${tableRowToneClassName(p.temporalStatus)}`}>
                      <td className="px-3.5 py-2.5">{renderFecha(p.fechaVencimiento, p.segundaFechaVencimiento)}</td>
                      <td className="px-3.5 py-2.5 text-[13.5px] text-foreground">{p.nombre}</td>
                      <td className="px-3.5 py-2.5">
                        <Badge variant="outline">{p.categoria}</Badge>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-foreground">
                        {formatAmount(p.monto, { decimals: 0 })}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <EstadoPill status={p.temporalStatus} />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPagoPaid(p) && (
                            <button
                              onClick={() => onMarcarPagado && onMarcarPagado(p)}
                              className="flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover active:bg-primary-active"
                              aria-label={`Marcar vencimiento ${p.nombre} como pagado`}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Marcar pagado
                            </button>
                          )}
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            {p.document?.isValid && (
                              <button
                                onClick={() => openDocumentPreview(p)}
                                className="rounded-sm p-1.5 transition-colors hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-ring"
                                title="Ver documento"
                                aria-label={`Ver documento de ${p.nombre}`}
                              >
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditPago && onEditPago(p)}
                              className="rounded-sm p-1.5 transition-colors hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-ring"
                              title="Editar"
                              aria-label={`Editar vencimiento ${p.nombre}`}
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => { setPagoToDelete(p); setShowDeleteConfirm(true); }}
                              className="rounded-sm p-1.5 transition-colors hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-ring"
                              title="Eliminar"
                              aria-label={`Eliminar vencimiento ${p.nombre}`}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-muted px-5 py-3.5">
              <p className="font-mono text-[12px] text-muted-foreground">
                Página {currentPage} de {totalPages} ({sortedData.length} resultados)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-card-hover"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="font-mono text-[12px] text-foreground px-2">{currentPage}</span>
                <button
                  onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-card-hover"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setPagoToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar pago?"
        message={`¿Estás seguro de eliminar "${pagoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
      <DocumentPreviewModal
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        documentUrl={previewDocument?.document?.href || ''}
        title={previewDocument ? `Documento de ${previewDocument.nombre}` : 'Vista previa del documento'}
      />
    </div>
  );
};

ModernPendingPaymentsView.propTypes = {
  onMarcarPagado: PropTypes.func,
  onNewPago: PropTypes.func,
  onEditPago: PropTypes.func,
  onDeletePago: PropTypes.func,
  onNewPrestamo: PropTypes.func,
  onEditPrestamo: PropTypes.func,
  onDeletePrestamo: PropTypes.func,
  onMarcarPagadoPrestamo: PropTypes.func,
};

export default ModernPendingPaymentsView;
