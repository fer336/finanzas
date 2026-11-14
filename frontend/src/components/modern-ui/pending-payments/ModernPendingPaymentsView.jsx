import { Fragment, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Search, Check, ChevronLeft, ChevronRight, RefreshCw, Plus } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import KpiCard from '../common/KpiCard';
import ConfirmModal from '../common/ConfirmModal';
import ModernPrestamosSection from './ModernPrestamosSection';
import DocumentPreviewModal from './DocumentPreviewModal';
import PaymentRowActions from './PaymentRowActions';
import { usePendingPayments, QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { useRefresh } from '../../../hooks/useRefresh';
import { useIsMobile } from '../../../hooks/use-mobile';
import { normalizePaymentDocument } from '../../../utils/documentPreviewUrl';
import { buildCategoryChips, getPaymentCategory } from '../../../utils/pendingPaymentCategories';
import {
  PENDING_PAYMENT_STATUS,
  compareLocalDateOnly,
  daysUntilLocalDate,
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

// The only period choice: every unpaid due date, or just this calendar month.
const VIEW_MODES = [
  { value: 'all', label: 'Todos los vencimientos' },
  { value: 'month', label: 'Vencimientos del mes' },
];

const isInCurrentMonth = (dateValue) => {
  const fecha = parseLocalDateOnly(dateValue);
  if (!fecha) return false;
  const now = new Date();
  return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
};

// ─── Piezas de UI compartidas con el patrón Kanagawa (ver ModernTransactionsView) ──
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
        aria-pressed={value === opt.value}
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'month'
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [detailPayment, setDetailPayment] = useState(null);
  const detailTrigger = useRef(null);
  const itemsPerPage = 20;
  const controlIds = {
    mobileViewMode: 'pending-payments-mobile-view-mode',
    mobileSearch: 'pending-payments-mobile-search',
    desktopViewMode: 'pending-payments-desktop-view-mode',
    desktopSearch: 'pending-payments-desktop-search',
    section: 'pending-payments-section',
  };

  // Normalizar datos del backend (misma lógica que la versión anterior de esta vista).
  const pagos = (pagosData?.list || pagosData || []).map((p) => {
    const categoriaNombre = getPaymentCategory(p);
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

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, viewMode]);

  // ── Filtros ──────────────────────────────────────────────────────────────
  // Only unpaid due dates are listed: pending, en mora and vencidos.
  let baseFilteredData = pagos.filter((p) => !isPagoPaid(p));

  if (viewMode === 'month') {
    baseFilteredData = baseFilteredData.filter((p) => isInCurrentMonth(p.fechaVencimiento));
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    baseFilteredData = baseFilteredData.filter((p) =>
      p.nombre.toLowerCase().includes(query)
      || p.descripcion.toLowerCase().includes(query)
      || p.categoria.toLowerCase().includes(query)
    );
  }

  const pendientes = baseFilteredData;
  const vencidos = pendientes.filter((p) => p.temporalStatus === PENDING_PAYMENT_STATUS.OVERDUE);
  const enMora = pendientes.filter((p) => p.temporalStatus === PENDING_PAYMENT_STATUS.IN_ARREARS);
  const formatPaymentAmount = (payment) => payment.moneda === 'ARS'
    ? formatAmount(payment.monto, { decimals: 0 })
    : `${payment.moneda} ${formatAmount(payment.monto, { decimals: 0, currency: false })}`;
  const formatSummary = (items) => {
    const totals = items.reduce((result, p) => {
      result[p.moneda] = (result[p.moneda] || 0) + p.monto;
      return result;
    }, {});
    return Object.entries(totals).map(([moneda, monto]) => formatPaymentAmount({ moneda, monto })).join(' · ') || formatAmount(0, { decimals: 0 });
  };
  // Hoy y los seis días siguientes; la segunda fecha no cambia de significado.
  const urgencyGroup = (p) => {
    if (p.temporalStatus === PENDING_PAYMENT_STATUS.OVERDUE) return 'Vencidos';
    if (p.temporalStatus === PENDING_PAYMENT_STATUS.IN_ARREARS) return 'En mora';
    if (!parseLocalDateOnly(p.fechaVencimiento)) return 'Fecha a confirmar';
    return daysUntilLocalDate(p.fechaVencimiento) <= 6 ? 'Próximos 7 días' : 'Más adelante';
  };
  const proximos = pendientes.filter((p) => urgencyGroup(p) === 'Próximos 7 días');

  // One chip per category present in the period and search, so each due date
  // sits in the chip of the category shown on its own row.
  const categoryChips = buildCategoryChips(baseFilteredData);
  const activeCategory = selectedCategory === 'all' || categoryChips.some((c) => c.key === selectedCategory)
    ? selectedCategory
    : 'all';
  useEffect(() => {
    if (activeCategory !== selectedCategory) setSelectedCategory('all');
  }, [activeCategory, selectedCategory]);

  const filteredData = activeCategory === 'all'
    ? baseFilteredData
    : baseFilteredData.filter((p) => p.categoria === activeCategory);
  const emptyMessage = searchQuery
    ? `Sin resultados para "${searchQuery}".`
    : viewMode === 'month'
      ? 'No hay vencimientos pendientes este mes.'
      : 'No hay vencimientos pendientes.';

  const sortedData = [...filteredData].sort(
    (a, b) => compareLocalDateOnly(a.fechaVencimiento, b.fechaVencimiento)
  );

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderCategoryChips = (className) => (
    <div role="group" aria-label="Filtrar por categoría" className={className}>
      {[{ key: 'all', label: 'Todos', count: baseFilteredData.length }, ...categoryChips].map((t) => {
        const active = activeCategory === t.key;
        return (
          <button
            key={t.key}
            type="button"
            aria-pressed={active}
            onClick={() => setSelectedCategory(t.key)}
            className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-secondary'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-2 py-px font-mono text-[11.5px] ${active ? 'bg-black/15' : 'bg-secondary'}`}>{t.count}</span>
          </button>
        );
      })}
    </div>
  );

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
        {secondDisplay && <span className="text-[11px] text-[var(--warning)]">2° {secondDisplay}</span>}
      </span>
    );
  };

  const EstadoPill = ({ status }) => {
    const config = {
      [PENDING_PAYMENT_STATUS.PAID]: {
        label: 'Pagado',
        className: 'border-[var(--paid-text)] text-[var(--paid-text)]',
      },
      [PENDING_PAYMENT_STATUS.IN_ARREARS]: {
        label: 'En mora',
        className: 'border-[var(--arrears-border)] bg-[var(--arrears-pill)] text-[var(--arrears-text)]',
      },
      [PENDING_PAYMENT_STATUS.OVERDUE]: {
        label: 'Vencido',
        className: 'border-[var(--overdue-text)] bg-[var(--overdue-pill)] text-[var(--overdue-text)]',
      },
      [PENDING_PAYMENT_STATUS.PENDING]: {
        label: 'Pendiente',
        className: 'border-[var(--pending-border)] text-[var(--pending-text)]',
      },
    }[status] || {
      label: 'Pendiente',
      className: 'border-[var(--pending-border)] text-[var(--pending-text)]',
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
      return 'border-[var(--overdue-border)] bg-[var(--overdue-surface)] text-foreground';
    }
    if (status === PENDING_PAYMENT_STATUS.IN_ARREARS) {
      return 'border-[var(--arrears-border)] bg-[var(--arrears-surface)] text-foreground';
    }
    return 'border-border bg-card';
  };

  const tableRowToneClassName = (status) => {
    if (status === PENDING_PAYMENT_STATUS.OVERDUE) {
      return 'border-[var(--overdue-border)] bg-[var(--overdue-surface)] hover:bg-[var(--overdue-surface-hover)]';
    }
    if (status === PENDING_PAYMENT_STATUS.IN_ARREARS) {
      return 'border-[var(--arrears-border)] bg-[var(--arrears-surface)] hover:bg-[var(--arrears-surface-hover)]';
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
          <div className={`flex items-end justify-between gap-5 border-b-[3px] border-double border-[var(--title-rule)] ${isMobile ? 'mb-3 pb-3' : 'mb-[22px] pb-[18px]'}`}>
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
          <div className="h-8 w-56 animate-pulse rounded-sm bg-[var(--skeleton)]" />
          <div className="mt-4 h-24 w-full max-w-xs animate-pulse rounded-md bg-[var(--skeleton)]" />
          <div className="mt-5 h-64 w-full animate-pulse rounded-md bg-[var(--skeleton)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[13.5px] text-[var(--overdue-border)]">Error al cargar vencimientos: {error.message}</p>
      </div>
    );
  }

  const openDocumentPreview = (p) => {
    if (p.document?.isValid) setPreviewDocument(p);
  };

  const handleDeleteConfirm = () => {
    if (pagoToDelete) onDeletePago && onDeletePago(pagoToDelete.id);
  };

  const renderDetailDialog = () => (
    <Dialog open={!!detailPayment} onOpenChange={(open) => !open && setDetailPayment(null)}>
      <DialogContent className="bg-popover text-foreground rounded-lg max-w-[calc(100%-2rem)] sm:max-w-lg motion-reduce:animate-none"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          detailTrigger.current?.focus();
        }}>
        <DialogTitle>Detalle del vencimiento</DialogTitle>
        <DialogDescription>Consultar no registra un pago ni modifica el vencimiento.</DialogDescription>
        {detailPayment && <>
          <h3 className="font-semibold break-words">{detailPayment.nombre}</h3>
          <p className="text-sm text-muted-foreground break-words">{detailPayment.descripcion || 'Sin descripción adicional.'}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt>Importe · {detailPayment.moneda}</dt><dd className="font-mono">{formatPaymentAmount(detailPayment)}</dd>
            <dt>Vencimientos</dt><dd>{renderFecha(detailPayment.fechaVencimiento, detailPayment.segundaFechaVencimiento)}</dd>
            <dt>Estado</dt><dd><EstadoPill status={detailPayment.temporalStatus} /></dd>
            <dt>Categoría</dt><dd>{detailPayment.categoria}</dd>
          </dl>
          {!isPagoPaid(detailPayment) && <button type="button" className="min-h-11 rounded-sm bg-primary px-4 text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring hover:bg-primary-hover" onClick={() => {
            const payment = detailPayment;
            setDetailPayment(null);
            onMarcarPagado?.(payment);
          }}>Registrar pago</button>}
        </>}
      </DialogContent>
    </Dialog>
  );
  const renderDetailButton = (payment) => <button type="button"
    aria-label={`Ver detalle de ${payment.nombre}`}
    onClick={(event) => {
      detailTrigger.current = event.currentTarget;
      setDetailPayment(payment);
    }}
    className="min-h-11 rounded-sm border border-border bg-secondary px-3 text-xs text-foreground hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-ring">Ver detalle</button>;
  const PeriodNote = () => <p className="mb-4 text-sm text-muted-foreground">
    Consultar no registra un pago. Resumen de los vencimientos sin pagar del período y la búsqueda actuales.
    {' '}Próximos 7 días: {formatLocalDateDisplay(new Date())} al {formatLocalDateDisplay(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 6))}.
  </p>;

  // ── Render mobile ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen pb-8 [&_button]:min-h-11 [&_input]:min-h-11 [&_select]:min-h-11 [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-ring">
        <div className="px-4 pt-4 pb-3">
          <div className="mb-3 flex items-end justify-between gap-2 border-b-[3px] border-double border-[var(--title-rule)] pb-3">
            <h1 className="min-w-0 flex-1 truncate font-serif text-[26px] font-bold leading-none text-foreground">Vencimientos</h1>
            <div className="flex shrink-0 items-center gap-2">
              <RefreshButton />
              <NewPagoButton />
            </div>
          </div>

          <div className="mb-3">
            <SectionToggle />
          </div>

          <PeriodNote />
          <div className="mb-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <KpiCard label="Próximos 7 días" value={formatSummary(proximos)} subtext={`${proximos.length} pendientes · incluye hoy`} borderColor="var(--primary)" valueColor="var(--foreground)" />
              <KpiCard
                label="Total pendiente"
                value={formatSummary(pendientes)}
                subtext={`${pendientes.length} sin pagar · ${enMora.length} en mora`}
                borderColor="var(--warning-border)"
                valueColor="var(--warning)"
              />
              <KpiCard
                label="Vencidos"
                value={formatSummary(vencidos)}
                subtext={`${vencidos.length} vencido${vencidos.length !== 1 ? 's' : ''}`}
                borderColor="var(--destructive)"
                valueColor="var(--destructive)"
              />
            </div>
          </div>

          <div className="mb-2.5">
            <PillToggle
              options={VIEW_MODES}
              value={viewMode}
              onChange={setViewMode}
              activeClassName="bg-primary text-primary-foreground"
              idPrefix={controlIds.mobileViewMode}
              ariaLabel="Período de vencimientos"
            />
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

          {renderCategoryChips('flex gap-2 overflow-x-auto pb-1')}
        </div>

        <div className="flex flex-col gap-2 px-4">
          {paginatedData.length === 0 ? (
            <div className="flex items-center justify-center rounded-md border border-border bg-card py-10">
              <EmptyState>
                {emptyMessage}
              </EmptyState>
            </div>
          ) : (
            paginatedData.map((p, index) => {
              const group = urgencyGroup(p);
              return (
                <Fragment key={p.id}>
                {(index === 0 || urgencyGroup(paginatedData[index - 1]) !== group) && <h2 className="mt-4 text-base font-semibold text-foreground">{group}</h2>}
                <div data-urgency-group={group} className={`rounded-md border px-3.5 py-3 ${rowToneClassName(p.temporalStatus)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] text-foreground truncate">{p.nombre}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {renderFecha(p.fechaVencimiento, p.segundaFechaVencimiento)}
                        <Badge variant="outline">{p.categoria}</Badge>

                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[13.5px] font-semibold text-foreground">
                        {formatPaymentAmount(p)}
                      </p>
                      <div className="mt-1">
                        <EstadoPill status={p.temporalStatus} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                    {renderDetailButton(p)}
                    <PaymentRowActions
                      entityName={p.nombre}
                      entityType="vencimiento"
                      onDocument={p.document?.isValid ? () => openDocumentPreview(p) : undefined}
                      onEdit={() => onEditPago && onEditPago(p)}
                      onDelete={() => { setPagoToDelete(p); setShowDeleteConfirm(true); }}
                    />
                    {!isPagoPaid(p) && (
                      <button
                        onClick={() => onMarcarPagado && onMarcarPagado(p)}
                        className="flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 font-sans text-[12.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover active:bg-primary-active"
                        aria-label={`Registrar pago de ${p.nombre}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Registrar pago
                      </button>
                    )}
                  </div>
                </div>
                </Fragment>
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

        {renderDetailDialog()}
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
    <div className="min-h-screen [&_button]:min-h-11 [&_input]:min-h-11 [&_select]:min-h-11 [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-ring">
      <div className="mx-auto max-w-[1100px] px-[34px] py-[28px]">
        <div className="mb-[22px] flex items-end justify-between gap-5 border-b-[3px] border-double border-[var(--title-rule)] pb-[18px]">
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
            options={VIEW_MODES}
            value={viewMode}
            onChange={setViewMode}
            activeClassName="bg-primary text-primary-foreground"
            idPrefix={controlIds.desktopViewMode}
            ariaLabel="Período de vencimientos"
          />
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
        </div>

        <div className="mb-4">{renderCategoryChips('flex flex-wrap gap-2')}</div>

        <PeriodNote />
        <div className="mb-5 grid grid-cols-3 gap-3">
          <KpiCard label="Próximos 7 días" value={formatSummary(proximos)} subtext={`${proximos.length} pendientes · incluye hoy`} borderColor="var(--primary)" valueColor="var(--foreground)" />
          <KpiCard
            label="Total pendiente"
            value={formatSummary(pendientes)}
            subtext={`${pendientes.length} sin pagar · ${enMora.length} en mora`}
            borderColor="var(--warning-border)"
            valueColor="var(--warning)"
          />
          <KpiCard
            label="Vencidos"
            value={formatSummary(vencidos)}
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
                      {emptyMessage}
                    </EmptyState>
                  </td>
                </tr>
              ) : (
                paginatedData.map((p, index) => {
                  const group = urgencyGroup(p);
                  return (
                    <Fragment key={p.id}>
                    {(index === 0 || urgencyGroup(paginatedData[index - 1]) !== group) && <tr><th colSpan={6} scope="colgroup" className="bg-secondary px-3.5 py-3 text-left text-base font-semibold text-foreground">{group}</th></tr>}
                    <tr data-urgency-group={group} className={`group border-b transition-colors ${tableRowToneClassName(p.temporalStatus)}`}>
                      <td className="px-3.5 py-2.5">{renderFecha(p.fechaVencimiento, p.segundaFechaVencimiento)}</td>
                      <td className="px-3.5 py-2.5 text-[13.5px] text-foreground">{p.nombre}</td>
                      <td className="px-3.5 py-2.5">
                        <Badge variant="outline">{p.categoria}</Badge>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-foreground">
                        {formatPaymentAmount(p)}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <EstadoPill status={p.temporalStatus} />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {renderDetailButton(p)}
                          {!isPagoPaid(p) && (
                            <button
                              onClick={() => onMarcarPagado && onMarcarPagado(p)}
                              className="flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover active:bg-primary-active"
                              aria-label={`Registrar pago de ${p.nombre}`}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Registrar pago
                            </button>
                          )}
                          <PaymentRowActions
                            entityName={p.nombre}
                            entityType="vencimiento"
                            onDocument={p.document?.isValid ? () => openDocumentPreview(p) : undefined}
                            onEdit={() => onEditPago && onEditPago(p)}
                            onDelete={() => { setPagoToDelete(p); setShowDeleteConfirm(true); }}
                          />
                        </div>
                      </td>
                    </tr>
                    </Fragment>
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

      {renderDetailDialog()}
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
