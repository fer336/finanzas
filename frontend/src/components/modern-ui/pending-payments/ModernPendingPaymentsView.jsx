import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Search, Edit, Trash2, Check, ChevronLeft, ChevronRight, RefreshCw, Plus } from 'lucide-react';
import { Badge } from '../../ui/badge';
import KpiCard from '../common/KpiCard';
import ConfirmModal from '../common/ConfirmModal';
import ModernPrestamosSection from './ModernPrestamosSection';
import { usePendingPayments, QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { useRefresh } from '../../../hooks/useRefresh';
import { useIsMobile } from '../../../hooks/use-mobile';

const SECTION_KEY = 'vencimientos_section'; // 'vencimientos' | 'prestamos'
const loadSection = () => {
  try {
    return localStorage.getItem(SECTION_KEY) || 'vencimientos';
  } catch {
    return 'vencimientos';
  }
};

// ─── Helpers de fecha ────────────────────────────────────────────────────────
const parseDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const calcularDiasRestantes = (fechaVencimiento) => {
  const fecha = parseDateSafe(fechaVencimiento);
  if (!fecha) return 999;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
};

// ─── Piezas de UI compartidas con el patrón Papel (ver ModernTransactionsView) ──
const FilterSelect = ({ className = '', ...props }) => (
  <select
    {...props}
    className={`rounded-sm border border-[#ddd5c2] bg-white px-3 py-[7px] font-mono text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:border-border dark:bg-secondary ${className}`}
  />
);
FilterSelect.propTypes = { className: PropTypes.string };

const EmptyState = ({ children }) => (
  <p className="text-[13.5px] italic text-muted-foreground">{children}</p>
);
EmptyState.propTypes = { children: PropTypes.node };

// Toggle de pills Mensual/Acumulado (mismo patrón visual que Movimientos).
const PillToggle = ({ options, value, onChange, activeClassName }) => (
  <div className="inline-flex items-center gap-[3px] rounded-full border border-[#ddd5c2] bg-card p-[3px] dark:border-border">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`rounded-full px-3 py-1 font-mono text-[12px] transition-colors duration-150 ${
          value === opt.value ? `${activeClassName} font-semibold` : 'text-[#5d6470] hover:text-foreground dark:text-muted-foreground'
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
  const [selectedStatus, setSelectedStatus] = useState('pending'); // all | pending | overdue | paid
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'accumulated'
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(getCurrentMonthValue());
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState(null);
  const itemsPerPage = 20;

  // Normalizar datos del backend (misma lógica que la versión anterior de esta vista).
  const pagos = (pagosData?.list || pagosData || []).map((p) => {
    const categoriaObj = p.Categorias || p.categorias1 || p.categoria || null;
    const categoriaNombre = categoriaObj?.nombre || categoriaObj?.Nombre || 'Sin categoría';
    const fechaVencimiento = p.fecha_vencimiento || p.FechaVencimiento || p.fechavencimiento || p.Fechavencimiento;

    return {
      ...p,
      id: p.id || p.Id,
      nombre: p.nombre || p.Nombre || 'Sin nombre',
      descripcion: p.descripcion || p.Descripcion || '',
      monto: parseFloat(p.monto || p.Monto || 0),
      moneda: p.moneda || p.Moneda || 'ARS',
      fechaVencimiento,
      estado: (p.estado || p.Estado || 'pendiente').toString().toLowerCase(),
      categoria: categoriaNombre,
    };
  });

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedStatus, viewMode, selectedMonthFilter]);

  const isPagoPaid = (p) => p.estado === 'pagado' || p.estado === 'true' || p.pagada === true;

  // ── Filtros ──────────────────────────────────────────────────────────────
  let filteredData = pagos;

  if (viewMode === 'monthly') {
    const [selYear, selMonth] = selectedMonthFilter.split('-').map(Number);
    filteredData = filteredData.filter((p) => {
      const fecha = parseDateSafe(p.fechaVencimiento);
      if (!fecha) return false;
      return fecha.getMonth() === selMonth - 1 && fecha.getFullYear() === selYear;
    });
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = filteredData.filter((p) =>
      p.nombre.toLowerCase().includes(query)
      || p.descripcion.toLowerCase().includes(query)
      || p.categoria.toLowerCase().includes(query)
    );
  }

  if (selectedStatus !== 'all') {
    filteredData = filteredData.filter((p) => {
      const isPaid = isPagoPaid(p);
      const dias = calcularDiasRestantes(p.fechaVencimiento);
      const isOverdue = !isPaid && dias < 0;
      if (selectedStatus === 'paid') return isPaid;
      if (selectedStatus === 'overdue') return isOverdue;
      if (selectedStatus === 'pending') return !isPaid && !isOverdue;
      return true;
    });
  }

  const sortedData = [...filteredData].sort(
    (a, b) => calcularDiasRestantes(a.fechaVencimiento) - calcularDiasRestantes(b.fechaVencimiento)
  );

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── KPI: total pendiente ─────────────────────────────────────────────────
  const pendientes = filteredData.filter((p) => !isPagoPaid(p));
  const vencidos = pendientes.filter((p) => calcularDiasRestantes(p.fechaVencimiento) < 0);
  const totalPendiente = pendientes.reduce((sum, p) => sum + p.monto, 0);

  // ── Render de celda de fecha ("a confirmar" en itálica si no hay fecha) ──
  const renderFecha = (fechaVencimiento) => {
    const fecha = parseDateSafe(fechaVencimiento);
    if (!fecha) {
      return <span className="font-mono text-[12px] italic text-[#8a8677] dark:text-muted-foreground">a confirmar</span>;
    }
    return <span className="font-mono text-[12px] text-[#5d6470] dark:text-muted-foreground">{fecha.toLocaleDateString('es-AR')}</span>;
  };

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

  const RefreshButton = () => (
    <button
      type="button"
      onClick={refresh}
      disabled={isRefreshing}
      className="flex items-center gap-1.5 rounded-sm border border-[#ddd5c2] bg-white px-3 py-[7px] font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9] disabled:opacity-50 dark:border-border dark:bg-secondary dark:hover:bg-card-hover"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Actualizando…' : 'Actualizar'}
    </button>
  );

  const NewPagoButton = () => (
    <button
      type="button"
      onClick={() => onNewPago && onNewPago()}
      className="flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-[7px] font-sans text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047]"
    >
      <Plus className="h-3.5 w-3.5" />
      Nuevo
    </button>
  );

  // ── Toggle de sección (Vencimientos / Préstamos) ─────────────────────────
  const SectionToggle = () => (
    <PillToggle
      options={[{ value: 'vencimientos', label: 'Vencimientos' }, { value: 'prestamos', label: 'Préstamos' }]}
      value={section}
      onChange={setSection}
      activeClassName="bg-[#20242c] text-[#f4f0e6]"
    />
  );

  if (section === 'prestamos') {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1100px] px-4 py-4 sm:px-[34px] sm:py-[28px]">
          <div className={`flex items-end justify-between gap-5 border-b-[3px] border-double border-[#cfc6ae] dark:border-border ${isMobile ? 'mb-3 pb-3' : 'mb-[22px] pb-[18px]'}`}>
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
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1100px] px-[34px] py-[28px]">
          <div className="h-8 w-56 animate-pulse rounded-sm bg-[#e7e0cf] dark:bg-muted" />
          <div className="mt-4 h-24 w-full max-w-xs animate-pulse rounded-md bg-[#e7e0cf] dark:bg-muted" />
          <div className="mt-5 h-64 w-full animate-pulse rounded-md bg-[#e7e0cf] dark:bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-[13.5px] text-[#a04a34]">Error al cargar vencimientos: {error.message}</p>
      </div>
    );
  }

  const handleDeleteConfirm = () => {
    if (pagoToDelete) onDeletePago && onDeletePago(pagoToDelete.id);
  };

  // ── Render mobile ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="px-4 pt-4 pb-3">
          <div className="mb-3 flex items-end justify-between gap-3 border-b-[3px] border-double border-[#cfc6ae] pb-3 dark:border-border">
            <h1 className="font-serif text-[26px] font-bold leading-none text-foreground">Vencimientos</h1>
            <div className="flex items-center gap-2">
              <RefreshButton />
              <NewPagoButton />
            </div>
          </div>

          <div className="mb-3">
            <SectionToggle />
          </div>

          <div className="mb-3">
            <KpiCard
              label="Total pendiente"
              value={formatAmount(totalPendiente, { decimals: 0 })}
              subtext={`${pendientes.length} pendiente${pendientes.length !== 1 ? 's' : ''}${vencidos.length ? ` · ${vencidos.length} vencido${vencidos.length !== 1 ? 's' : ''}` : ''}`}
              borderColor="#e9c46a"
              valueColor="#8a6a1f"
            />
          </div>

          <div className="mb-2.5 flex items-center gap-2">
            <PillToggle
              options={[{ value: 'monthly', label: 'Mensual' }, { value: 'accumulated', label: 'Acumulado' }]}
              value={viewMode}
              onChange={setViewMode}
              activeClassName="bg-[#20242c] text-[#f4f0e6]"
            />
            {viewMode === 'monthly' && (
              <input
                type="month"
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="flex-1 rounded-sm border border-[#ddd5c2] bg-white px-3 py-1.5 font-mono text-[12px] text-foreground focus:outline-none dark:border-border dark:bg-secondary"
              />
            )}
          </div>

          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8677] dark:text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded-sm border border-[#ddd5c2] bg-white py-2 pl-9 pr-3 text-[13px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring dark:border-border dark:bg-secondary dark:placeholder:text-muted-foreground"
            />
          </div>

          <FilterSelect
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Vencidos</option>
            <option value="paid">Pagados</option>
          </FilterSelect>
        </div>

        <div className="flex flex-col gap-2 px-4">
          {paginatedData.length === 0 ? (
            <div className="flex items-center justify-center rounded-md border border-[#ddd5c2] bg-card py-10 dark:border-border">
              <EmptyState>
                {searchQuery ? `Sin resultados para "${searchQuery}".` : 'Sin vencimientos en esta vista.'}
              </EmptyState>
            </div>
          ) : (
            paginatedData.map((p) => {
              const isPaid = isPagoPaid(p);
              return (
                <div key={p.id} className="rounded-md border border-[#ddd5c2] bg-card px-3.5 py-3 dark:border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] text-foreground truncate">{p.nombre}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {renderFecha(p.fechaVencimiento)}
                        <Badge variant="outline">{p.categoria}</Badge>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[13.5px] font-semibold text-foreground">
                        {formatAmount(p.monto, { decimals: 0 })}
                      </p>
                      <div className="mt-1">
                        <EstadoPill isPaid={isPaid} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-[#e7e0cf] pt-2 dark:border-muted">
                    <div className="flex gap-3">
                      <button onClick={() => onEditPago && onEditPago(p)} className="p-1 text-[#8a8677] hover:text-foreground dark:text-muted-foreground">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setPagoToDelete(p); setShowDeleteConfirm(true); }}
                        className="p-1 text-[#8a8677] hover:text-[#a04a34] dark:text-muted-foreground dark:hover:text-[#c26a52]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {!isPaid && (
                      <button
                        onClick={() => onMarcarPagado && onMarcarPagado(p)}
                        className="flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 font-sans text-[12.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047]"
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
            <div className="mt-2 flex items-center justify-between rounded-md border border-[#ddd5c2] bg-card px-4 py-3 dark:border-border">
              <button
                onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="rounded-sm p-2 hover:bg-black/5 disabled:opacity-30 dark:hover:bg-card-hover"
              >
                <ChevronLeft className="h-4 w-4 text-[#8a8677] dark:text-muted-foreground" />
              </button>
              <span className="font-mono text-[12px] text-[#5d6470] dark:text-muted-foreground">
                {currentPage} / {totalPages} <span className="text-[#8a8677] dark:text-muted-foreground">({sortedData.length})</span>
              </span>
              <button
                onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-sm p-2 hover:bg-black/5 disabled:opacity-30 dark:hover:bg-card-hover"
              >
                <ChevronRight className="h-4 w-4 text-[#8a8677] dark:text-muted-foreground" />
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
      </div>
    );
  }

  // ── Render desktop ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1100px] px-[34px] py-[28px]">
        <div className="mb-[22px] flex items-end justify-between gap-5 border-b-[3px] border-double border-[#cfc6ae] pb-[18px] dark:border-border">
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
            activeClassName="bg-[#20242c] text-[#f4f0e6]"
          />
          {viewMode === 'monthly' && (
            <input
              type="month"
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="rounded-sm border border-[#ddd5c2] bg-white px-3 py-[7px] font-mono text-[12px] text-foreground focus:outline-none dark:border-border dark:bg-secondary"
            />
          )}
        </div>

        <div className="mb-4 flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8677] dark:text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded-sm border border-[#ddd5c2] bg-white py-[7px] pl-9 pr-3 font-mono text-[12px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring transition-colors dark:border-border dark:bg-secondary dark:placeholder:text-muted-foreground"
            />
          </div>
          <FilterSelect value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="overdue">Vencidos</option>
            <option value="paid">Pagados</option>
          </FilterSelect>
        </div>

        <div className="mb-5 max-w-xs">
          <KpiCard
            label="Total pendiente"
            value={formatAmount(totalPendiente, { decimals: 0 })}
            subtext={`${pendientes.length} pendiente${pendientes.length !== 1 ? 's' : ''}${vencidos.length ? ` · ${vencidos.length} vencido${vencidos.length !== 1 ? 's' : ''}` : ''}`}
            borderColor="#e9c46a"
            valueColor="#8a6a1f"
          />
        </div>

        <div className="rounded-md border border-[#ddd5c2] bg-card overflow-hidden dark:border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#ddd5c2] dark:border-border">
                <th className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-muted-foreground" style={{ letterSpacing: '.08em' }}>Vence</th>
                <th className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-muted-foreground" style={{ letterSpacing: '.08em' }}>Descripción</th>
                <th className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-muted-foreground" style={{ letterSpacing: '.08em' }}>Categoría</th>
                <th className="text-right px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-muted-foreground" style={{ letterSpacing: '.08em' }}>Monto</th>
                <th className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-muted-foreground" style={{ letterSpacing: '.08em' }}>Estado</th>
                <th className="text-right px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-muted-foreground" style={{ letterSpacing: '.08em' }}>Acciones</th>
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
                  const isPaid = isPagoPaid(p);
                  return (
                    <tr key={p.id} className="group border-b border-[#e7e0cf] hover:bg-[#f0ead9] transition-colors dark:border-muted dark:hover:bg-card-hover">
                      <td className="px-3.5 py-2.5">{renderFecha(p.fechaVencimiento)}</td>
                      <td className="px-3.5 py-2.5 text-[13.5px] text-foreground">{p.nombre}</td>
                      <td className="px-3.5 py-2.5">
                        <Badge variant="outline">{p.categoria}</Badge>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-foreground">
                        {formatAmount(p.monto, { decimals: 0 })}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <EstadoPill isPaid={isPaid} />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => onMarcarPagado && onMarcarPagado(p)}
                              className="flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1.5 font-sans text-[12px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047]"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Marcar pagado
                            </button>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditPago && onEditPago(p)}
                              className="p-1.5 rounded-sm hover:bg-black/5 transition-colors dark:hover:bg-card-hover"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4 text-[#8a8677] dark:text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => { setPagoToDelete(p); setShowDeleteConfirm(true); }}
                              className="p-1.5 rounded-sm hover:bg-black/5 transition-colors dark:hover:bg-card-hover"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-[#8a8677] hover:text-[#a04a34] dark:text-muted-foreground dark:hover:text-[#c26a52]" />
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
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#e7e0cf] dark:border-muted">
              <p className="font-mono text-[12px] text-[#8a8677] dark:text-muted-foreground">
                Página {currentPage} de {totalPages} ({sortedData.length} resultados)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-card-hover"
                >
                  <ChevronLeft className="h-4 w-4 text-[#8a8677] dark:text-muted-foreground" />
                </button>
                <span className="font-mono text-[12px] text-foreground px-2">{currentPage}</span>
                <button
                  onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-card-hover"
                >
                  <ChevronRight className="h-4 w-4 text-[#8a8677] dark:text-muted-foreground" />
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
