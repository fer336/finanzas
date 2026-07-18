import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Plus, Search, Download, Upload, Edit, Trash2, Eye, EyeOff,
  ChevronLeft, ChevronRight, CalendarDays,
  ChevronDown, Check, RefreshCw,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import KpiCard from '../common/KpiCard';
import PillToggle from '../common/PillToggle';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useIsMobile } from '../../../hooks/use-mobile';
import { normalizeDocumentPreviewUrl } from '../../../utils/documentPreviewUrl';
import DocumentPreviewModal from '../pending-payments/DocumentPreviewModal';

// ─── Constantes de meses ─────────────────────────────────────────────────────
const MESES = [
  { key: 1,  label: 'Ene', fullLabel: 'Enero' },
  { key: 2,  label: 'Feb', fullLabel: 'Febrero' },
  { key: 3,  label: 'Mar', fullLabel: 'Marzo' },
  { key: 4,  label: 'Abr', fullLabel: 'Abril' },
  { key: 5,  label: 'May', fullLabel: 'Mayo' },
  { key: 6,  label: 'Jun', fullLabel: 'Junio' },
  { key: 7,  label: 'Jul', fullLabel: 'Julio' },
  { key: 8,  label: 'Ago', fullLabel: 'Agosto' },
  { key: 9,  label: 'Sep', fullLabel: 'Septiembre' },
  { key: 10, label: 'Oct', fullLabel: 'Octubre' },
  { key: 11, label: 'Nov', fullLabel: 'Noviembre' },
  { key: 12, label: 'Dic', fullLabel: 'Diciembre' },
];

const RANGE_OPTIONS = [
  { value: 'day',   label: 'Día' },
  { value: 'week',  label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

const TX_MONTHS_KEY    = 'tx_selected_months';   // acumulado: meses checkeados
const TX_VIEW_MODE_KEY = 'tx_view_mode';         // 'monthly' | 'accumulated'
const TX_RANGE_KEY     = 'tx_range';             // 'day' | 'week' | 'month' — further-filtra dentro del período

const loadSelectedMonths = () => {
  try {
    const saved = localStorage.getItem(TX_MONTHS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [new Date().getMonth() + 1];
};

const loadViewMode = () => {
  try {
    return localStorage.getItem(TX_VIEW_MODE_KEY) || 'monthly';
  } catch { return 'monthly'; }
};

const loadRange = () => {
  try {
    const saved = localStorage.getItem(TX_RANGE_KEY);
    if (saved === 'day' || saved === 'week' || saved === 'month') return saved;
  } catch { /* ignore */ }
  return 'month';
};

PillToggle.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  activeClassName: PropTypes.string.isRequired,
};

const FilterSelect = ({ className = '', ...props }) => (
  <select
    {...props}
    className={`min-w-0 rounded-sm border border-border bg-secondary px-3 py-[7px] font-mono text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
  />
);
FilterSelect.propTypes = { className: PropTypes.string };

const EmptyState = ({ children }) => (
  <p className="text-[13.5px] italic text-muted-foreground">{children}</p>
);
EmptyState.propTypes = { children: PropTypes.node };

// ─── Componente ───────────────────────────────────────────────────────────────
const ModernTransactionsView = ({
  transactions = [],
  onNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onBulkUpload,
  onExportCSV,
}) => {
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.transactions, QUERY_KEYS.dashboardStats]);
  const isMobile = useIsMobile();
  const { isAmountVisible, toggleAmountVisibility, formatAmount } = useAmountVisibility();

  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedType, setSelectedType]   = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage]     = useState(1);
  const [previewDocumentUrl, setPreviewDocumentUrl] = useState('');

  // Vista: mensual (un mes con flechas) vs acumulado (multi-mes con checkboxes)
  const [viewMode, setViewMode]           = useState(loadViewMode);

  // Rango dentro del período ya scopeado por mes: día / semana / mes.
  const [range, setRange] = useState(loadRange);

  // Mes único para modo mensual
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Multi-meses para modo acumulado
  const [selectedMonths, setSelectedMonths] = useState(loadSelectedMonths);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Al pasar a Acumulado, tildar automáticamente enero → mes actual (antes
  // arrancaba con un único mes tildado, dando la falsa impresión de que el
  // balance de meses previos "no sumaba"). El usuario puede destildar a mano.
  const handleViewModeChange = (mode) => {
    if (mode === 'accumulated' && viewMode !== 'accumulated') {
      const nowMonth = new Date().getMonth() + 1;
      setSelectedMonths(Array.from({ length: nowMonth }, (_, i) => i + 1));
    }
    setViewMode(mode);
  };
  const monthPickerRef = useRef(null);
  const itemsPerPage = 15;

  // Persistir preferencias
  useEffect(() => {
    localStorage.setItem(TX_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(TX_MONTHS_KEY, JSON.stringify(selectedMonths));
  }, [selectedMonths]);

  useEffect(() => {
    localStorage.setItem(TX_RANGE_KEY, range);
  }, [range]);

  // Sincronizar scope del header con la selección de meses activa en esta vista
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    let scope;
    if (viewMode === 'monthly') {
      scope = { mode: 'monthly', month: selectedMonth };
    } else {
      scope = { mode: 'accumulated', months: selectedMonths, year: currentYear };
    }
    window.dispatchEvent(new CustomEvent('headerScope:changed', { detail: scope }));
  }, [viewMode, selectedMonth, selectedMonths]);

  // Cerrar picker al click afuera
  useEffect(() => {
    if (!showMonthPicker) return;
    const handler = (e) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target)) {
        setShowMonthPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMonthPicker]);

  // Reset página en cualquier cambio de filtro
  useEffect(() => { setCurrentPage(1); },
    [searchQuery, selectedType, selectedCategory, viewMode, selectedMonth, selectedMonths, range]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getTransactionDate = (t) => {
    const raw = t.fecha || t.fecha_transaccion || t.Fecha || t.FechaTransaccion
              || t.fecha_creacion || t.created_at;
    if (!raw) return null;
    // Parsear como fecha local (no UTC) para evitar el offset de timezone
    // "2026-03-03" → [2026, 3, 3] → new Date(2026, 2, 3) — siempre día correcto
    const str = raw.toString().slice(0, 10);
    const [y, m, d] = str.split('-').map(Number);
    if (!y || !m || !d) return null;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const getCategoryName = (t) => {
    if (typeof t.categoria === 'string' && t.categoria.trim()) return t.categoria;
    if (typeof t.categoria_nombre === 'string' && t.categoria_nombre.trim()) return t.categoria_nombre;
    const obj = t.Categorias || t.categorias1 || t.categoria || null;
    if (obj && typeof obj === 'object') return obj.nombre || obj.Nombre || 'Sin categoría';
    return 'Sin categoría';
  };

  // ── Filtrado por fecha (mes/acumulado) ───────────────────────────────────
  const currentYear = new Date().getFullYear();

  const dateFiltered = (() => {
    if (viewMode === 'monthly') {
      const [yr, mo] = selectedMonth.split('-').map(Number);
      return transactions.filter(t => {
        const d = getTransactionDate(t);
        return d && d.getMonth() === mo - 1 && d.getFullYear() === yr;
      });
    }
    // acumulado: meses seleccionados del año actual
    return transactions.filter(t => {
      const d = getTransactionDate(t);
      if (!d) return false;
      return d.getFullYear() === currentYear && selectedMonths.includes(d.getMonth() + 1);
    });
  })();

  // ── Filtrado por rango día/semana/mes (further-filtra dateFiltered) ─────
  // día = fecha de hoy; semana = lunes de esta semana → hoy; mes = sin filtro
  // adicional. Lógica de referencia: design_handoff_rediseno_papel/datos-ejemplo.html
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = (() => {
    const dow = (todayLocal.getDay() + 6) % 7; // 0 = lunes
    const d = new Date(todayLocal);
    d.setDate(todayLocal.getDate() - dow);
    return d;
  })();

  const rangeFiltered = dateFiltered.filter(t => {
    if (range === 'month') return true;
    const d = getTransactionDate(t);
    if (!d) return false;
    if (range === 'day') return d.getTime() === todayLocal.getTime();
    return d >= weekStart && d <= todayLocal; // week
  });

  // ── Filtrado por búsqueda / tipo / categoría ─────────────────────────────
  const filtered = rangeFiltered.filter(t => {
    const desc = t.descripcion || t.Descripcion || '';
    const cat  = getCategoryName(t);
    const matchSearch   = desc.toLowerCase().includes(searchQuery.toLowerCase())
                       || cat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType     = selectedType === 'all' || t.tipo === selectedType;
    const matchCategory = selectedCategory === 'all' || cat === selectedCategory;
    return matchSearch && matchType && matchCategory;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Totales ──────────────────────────────────────────────────────────────
  const totales = filtered.reduce(
    (acc, t) => {
      const m = Math.abs(t.monto || t.monto_ars || 0);
      if (t.tipo === 'ingreso') acc.ingresos += m;
      else acc.gastos += m;
      return acc;
    },
    { ingresos: 0, gastos: 0 }
  );
  const balance = totales.ingresos - totales.gastos;

  // ── Categorías disponibles (derivadas de las transacciones del período) ──
  const availableCategories = [...new Set(dateFiltered.map(t => getCategoryName(t)))].sort();

  // ── Helpers selector multi-mes ───────────────────────────────────────────
  const toggleMonth = (key) => {
    setSelectedMonths(prev => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;      // no dejar vacío
        return prev.filter(m => m !== key);
      }
      return [...prev, key].sort((a, b) => a - b);
    });
  };
  const selectAll     = () => setSelectedMonths(MESES.map(m => m.key));
  const selectCurrent = () => setSelectedMonths([new Date().getMonth() + 1]);

  const monthsLabel = (() => {
    if (selectedMonths.length === 12) return 'Todo el año';
    if (selectedMonths.length === 1)
      return MESES.find(m => m.key === selectedMonths[0])?.fullLabel || '';
    return `${selectedMonths.length} meses`;
  })();

  // ── Navegación mes único ─────────────────────────────────────────────────
  const goToPrevMonth = () => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const d = new Date(yr, mo - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const goToNextMonth = () => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const d = new Date(yr, mo, 1);
    if (d <= now) setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const goToToday = () => {
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };
  const isCurrentMonth = selectedMonth >= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const getTransactionDocument = (transaction) => {
    const rawUrl = transaction.archivo_adjunto
      || transaction.ArchivoAdjunto
      || transaction.comprobante
      || transaction.Comprobante
      || '';
    return normalizeDocumentPreviewUrl(rawUrl);
  };

  const openDocumentPreview = (event, documentUrl) => {
    event.stopPropagation();
    setPreviewDocumentUrl(documentUrl);
  };

  const currentMonthLabel = (() => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const names = ['enero','febrero','marzo','abril','mayo','junio',
                   'julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${names[mo - 1]} de ${yr}`;
  })();

  const periodoTitle = viewMode === 'monthly' ? currentMonthLabel : monthsLabel;
  const periodoEyebrow = viewMode === 'monthly' ? `Período ${selectedMonth}` : `Acumulado ${currentYear}`;

  // ── Acciones de cabecera (Actualizar, Importar, Exportar, + Nueva) ──────
  const HeaderActions = ({ compact = false }) => (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        {!compact && (isRefreshing ? 'Actualizando…' : 'Actualizar')}
      </Button>
      {onBulkUpload && (
        <Button type="button" variant="outline" size="sm" onClick={onBulkUpload}>
          <Upload className="h-3.5 w-3.5" />
          {!compact && 'Importar'}
        </Button>
      )}
      {onExportCSV && (
        <Button type="button" variant="outline" size="sm" onClick={onExportCSV} title="Exportar CSV">
          <Download className="h-3.5 w-3.5" />
        </Button>
      )}
      {compact && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleAmountVisibility}
          title={isAmountVisible ? 'Ocultar montos' : 'Mostrar montos'}
          aria-label={isAmountVisible ? 'Ocultar montos' : 'Mostrar montos'}
        >
          {isAmountVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </Button>
      )}
      {onNewTransaction && (
        <Button type="button" size="sm" onClick={onNewTransaction}>
          <Plus className="h-3.5 w-3.5" />
          Nueva
        </Button>
      )}
    </div>
  );
  HeaderActions.propTypes = { compact: PropTypes.bool };

  // ── Render Mobile ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div className="min-h-screen pb-8">
        <div className="px-4 pt-4 pb-3">

          {/* Cabecera de período */}
          <div className="mb-3 border-b-[3px] border-double border-[#b8ad78] pb-3 dark:border-border">
            <div className="font-mono text-[10px] uppercase text-[#4d699b]" style={{ letterSpacing: '.14em' }}>
              {periodoEyebrow}
            </div>
            <h1 className="mt-1 font-serif text-[26px] font-bold leading-none text-foreground capitalize">
              {periodoTitle}
            </h1>
            <div className="mt-3">
              <HeaderActions compact />
            </div>
          </div>

          {/* Toggle Mensual/Acumulado */}
          <div className="mb-2.5">
            <PillToggle
              options={[{ value: 'monthly', label: 'Mensual' }, { value: 'accumulated', label: 'Acumulado' }]}
              value={viewMode}
              onChange={handleViewModeChange}
              activeClassName="bg-[#545464] text-[#f2ecbc]"
            />
          </div>

          {/* Toggle Día/Semana/Mes */}
          <div className="mb-3">
            <PillToggle
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
              activeClassName="bg-[#4d699b] text-[#e5ddb0]"
            />
          </div>

          {/* Navegación mes (solo mensual) */}
          {viewMode === 'monthly' && (
            <div className="mb-3 flex items-center justify-between rounded-sm border border-border bg-card px-3 py-2">
              <button onClick={goToPrevMonth} className="p-1.5 rounded-sm hover:bg-black/5 transition-colors">
                <ChevronLeft className="w-4 h-4 text-[#625f55]" />
              </button>
              <button onClick={goToToday} className="font-mono text-[12px] text-[#43436c] hover:text-foreground">
                hoy
              </button>
              <button
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                className="p-1.5 rounded-sm hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-[#625f55]" />
              </button>
            </div>
          )}

          {/* Selector multi-mes (solo acumulado) */}
          {viewMode === 'accumulated' && (
            <div className="relative mb-3" ref={monthPickerRef}>
              <button
                onClick={() => setShowMonthPicker(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2 bg-card border border-border rounded-sm text-[13px] text-foreground"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#4d699b]" />
                  <span>{monthsLabel}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#625f55] transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
              </button>
              {showMonthPicker && (
                <div className="absolute left-0 right-0 top-full mt-2 z-[9999] bg-card border border-border rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13.5px] font-semibold text-foreground">Seleccionar meses</span>
                    <div className="flex gap-3">
                      <button onClick={selectCurrent} className="text-[12px] text-[#43436c]">Solo actual</button>
                      <button onClick={selectAll} className="text-[12px] text-[#4d699b]">Todos</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {MESES.map(mes => {
                      const isSelected = selectedMonths.includes(mes.key);
                      const isCurrent  = mes.key === new Date().getMonth() + 1;
                      return (
                        <button
                          key={mes.key}
                          onClick={() => toggleMonth(mes.key)}
                          className={`relative flex items-center justify-center gap-1 px-2 py-2 rounded-sm font-mono text-[12px] font-medium transition-colors ${
                            isSelected
                              ? 'bg-[#526a3a]/10 text-[#526a3a] border border-[#526a3a]/40'
                              : 'bg-transparent text-[#43436c] border border-border dark:text-muted-foreground'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                          <span>{mes.label}</span>
                          {isCurrent && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#4d699b] rounded-full" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buscador */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#625f55]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full pl-9 pr-3 py-2 bg-secondary text-foreground text-[13px] border border-border rounded-sm placeholder:text-[#625f55] dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Filtros tipo / categoría */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <FilterSelect
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full py-2"
            >
              <option value="all">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </FilterSelect>
            <FilterSelect
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full py-2"
            >
              <option value="all">Todas las categorías</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </FilterSelect>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2 px-4 mb-4">
          <KpiCard
            kpiKey="ingresos"
            label="Ingresos"
            value={formatAmount(totales.ingresos, { decimals: 0 })}
            subtext={`${filtered.filter(t => t.tipo === 'ingreso').length} tx`}
            borderColor="var(--success)"
            valueColor="var(--success)"
          />
          <KpiCard
            kpiKey="gastos"
            label="Gastos"
            value={formatAmount(totales.gastos, { decimals: 0 })}
            subtext={`${filtered.filter(t => t.tipo === 'gasto').length} tx`}
            borderColor="var(--destructive)"
            valueColor="var(--destructive)"
          />
          <KpiCard
            label="Balance"
            value={balance < 0 ? `− ${formatAmount(Math.abs(balance), { decimals: 0 })}` : formatAmount(balance, { decimals: 0 })}
            subtext={`${filtered.length} tx`}
            borderColor="var(--info)"
            valueColor={balance >= 0 ? 'var(--success)' : 'var(--destructive)'}
          />
        </div>

        {/* Lista de transacciones como cards */}
        <div className="px-4 flex flex-col gap-2">
          {paginated.length === 0 ? (
            <div className="rounded-md border border-border bg-card py-10 flex items-center justify-center">
              <EmptyState>Sin movimientos en esta vista.</EmptyState>
            </div>
          ) : (
            paginated.map(t => {
              const categoryName = getCategoryName(t);
              const fecha       = getTransactionDate(t);
              const displayDate = fecha ? fecha.toLocaleDateString('es-AR') : '-';
              const descripcion = t.descripcion || t.Descripcion || 'Sin descripción';
              const tipo        = t.tipo || 'gasto';
              const esIngreso   = tipo === 'ingreso';
              const monto       = Math.abs(t.monto || t.monto_ars || 0);
              const rowId       = t.id || t.Id;
              const pillColor   = esIngreso ? 'var(--success)' : 'var(--destructive)';
              const attachedDocument = getTransactionDocument(t);

              return (
                <div key={rowId} className="rounded-md border border-border bg-card px-3.5 py-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] text-foreground">{descripcion}</p>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                        <span className="shrink-0 font-mono text-[11.5px] text-[#625f55]">{displayDate}</span>
                        <Badge
                          variant="outline"
                          className="max-w-full min-w-0 truncate"
                          style={{ borderColor: pillColor, color: pillColor }}
                        >
                          {categoryName}
                        </Badge>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="whitespace-nowrap font-mono text-[13.5px] font-semibold" style={{ color: pillColor }}>
                        {esIngreso ? '+' : '−'} {formatAmount(monto, { decimals: 0 })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex justify-end gap-3 border-t border-dashed border-muted pt-2">
                    {attachedDocument.isValid && (
                      <button
                        type="button"
                        onClick={(e) => openDocumentPreview(e, attachedDocument.rawUrl)}
                        aria-label={`Ver comprobante de ${descripcion}`}
                        className="p-1 text-[#625f55] hover:text-foreground"
                        title="Ver comprobante"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditTransaction && onEditTransaction(t)}
                      aria-label={`Editar movimiento ${descripcion}`}
                      className="p-1 text-[#625f55] hover:text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onDeleteTransaction && onDeleteTransaction(t); }}
                      aria-label={`Eliminar movimiento ${descripcion}`}
                      className="p-1 text-[#625f55] hover:text-[#b83245]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Paginación mobile */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 mt-2">
              <button
                onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-sm disabled:opacity-30 hover:bg-black/5"
              >
                <ChevronLeft className="w-4 h-4 text-[#625f55]" />
              </button>
              <span className="font-mono text-[12px] text-[#43436c]">
                {currentPage} / {totalPages} <span className="text-[#625f55]">({filtered.length})</span>
              </span>
              <button
                onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-sm disabled:opacity-30 hover:bg-black/5"
              >
                <ChevronRight className="w-4 h-4 text-[#625f55]" />
              </button>
            </div>
          )}
        </div>
        </div>
        <DocumentPreviewModal
          isOpen={!!previewDocumentUrl}
          onClose={() => setPreviewDocumentUrl('')}
          documentUrl={previewDocumentUrl}
          title="Vista previa del comprobante"
        />
      </>
    );
  }

  // ── Render Desktop ────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen">
      <div className="mx-auto max-w-[1100px] px-[34px] py-[28px]">

        {/* ── Cabecera de período (mismo patrón que Inicio) ── */}
        <div className="mb-[22px] flex items-end justify-between gap-5 border-b-[3px] border-double border-[#b8ad78] pb-[18px] dark:border-border">
          <div>
            <div
              className="font-mono text-[11px] uppercase text-[#4d699b]"
              style={{ letterSpacing: '.16em' }}
            >
              {periodoEyebrow}
            </div>
            <h1 className="mt-1 font-serif text-[42px] font-bold leading-none text-foreground capitalize">
              {periodoTitle}
            </h1>
          </div>
          <HeaderActions />
        </div>

        {/* ── Controles de rango / navegación ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <PillToggle
              options={[{ value: 'monthly', label: 'Mensual' }, { value: 'accumulated', label: 'Acumulado' }]}
              value={viewMode}
              onChange={handleViewModeChange}
              activeClassName="bg-[#545464] text-[#f2ecbc]"
            />

            {viewMode === 'monthly' && (
              <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1.5 py-1">
                <button onClick={goToPrevMonth} className="p-1 rounded-full hover:bg-black/5 transition-colors" title="Mes anterior">
                  <ChevronLeft className="w-4 h-4 text-[#625f55]" />
                </button>
                <button onClick={goToToday} className="px-1.5 font-mono text-[12px] text-[#43436c] hover:text-foreground transition-colors">
                  hoy
                </button>
                <button
                  onClick={goToNextMonth}
                  disabled={isCurrentMonth}
                  className="p-1 rounded-full hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4 text-[#625f55]" />
                </button>
              </div>
            )}

            {viewMode === 'accumulated' && (
              <div className="relative" ref={monthPickerRef}>
                <button
                  onClick={() => setShowMonthPicker(p => !p)}
                  className="flex items-center gap-1.5 px-3 py-[7px] bg-card hover:bg-card-hover border border-border rounded-sm text-[13px] text-foreground transition-colors"
                >
                  <CalendarDays className="w-4 h-4 text-[#4d699b]" />
                  <span>{monthsLabel}</span>
                  <ChevronDown className={`w-3 h-3 text-[#625f55] transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
                </button>

                {showMonthPicker && (
                  <div className="absolute left-0 top-full mt-2 z-[9999] bg-card border border-border rounded-md p-4 w-80">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13.5px] font-semibold text-foreground">Seleccionar meses</span>
                      <div className="flex gap-3">
                        <button onClick={selectCurrent} className="text-[12px] text-[#43436c] hover:text-foreground transition-colors">
                          Solo actual
                        </button>
                        <span className="text-muted">·</span>
                        <button onClick={selectAll} className="text-[12px] text-[#4d699b] hover:underline transition-colors">
                          Todos
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {MESES.map(mes => {
                        const isSelected = selectedMonths.includes(mes.key);
                        const isCurrent  = mes.key === new Date().getMonth() + 1;
                        return (
                          <button
                            key={mes.key}
                            onClick={() => toggleMonth(mes.key)}
                            className={`relative flex items-center justify-center gap-1 px-2 py-2 rounded-sm font-mono text-[12px] font-medium transition-colors duration-150 ${
                              isSelected
                                ? 'bg-[#526a3a]/10 text-[#526a3a] border border-[#526a3a]/40'
                                : 'bg-transparent text-[#43436c] border border-border hover:bg-card-hover dark:text-muted-foreground'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                            <span>{mes.label}</span>
                            {isCurrent && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#4d699b] rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-muted text-[12px] text-[#625f55] dark:text-muted-foreground">
                      {selectedMonths.length === 1
                        ? `Mostrando solo ${MESES.find(m => m.key === selectedMonths[0])?.fullLabel}`
                        : `Acumulando: ${selectedMonths.map(k => MESES.find(m => m.key === k)?.label).join(', ')}`
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toggle Día/Semana/Mes */}
          <PillToggle
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            activeClassName="bg-[#4d699b] text-[#e5ddb0]"
          />
        </div>

        {/* ── Filtros ── */}
        <div className="flex gap-2.5 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#625f55]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full pl-9 pr-3 py-[7px] bg-secondary text-foreground font-mono text-[12px] border border-border rounded-sm placeholder:text-[#625f55] dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <FilterSelect
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
          >
            <option value="all">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </FilterSelect>
          <FilterSelect
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {availableCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </FilterSelect>
        </div>

        {/* ── KPIs del rango filtrado ── */}
        <div className="mb-5 grid grid-cols-3 gap-3.5">
          <KpiCard
            kpiKey="ingresos"
            label="Ingresos"
            value={formatAmount(totales.ingresos, { decimals: 0 })}
            subtext={`${filtered.filter(t => t.tipo === 'ingreso').length} transacciones`}
            borderColor="var(--success)"
            valueColor="var(--success)"
          />
          <KpiCard
            kpiKey="gastos"
            label="Gastos"
            value={formatAmount(totales.gastos, { decimals: 0 })}
            subtext={`${filtered.filter(t => t.tipo === 'gasto').length} transacciones`}
            borderColor="var(--destructive)"
            valueColor="var(--destructive)"
          />
          <KpiCard
            label="Balance"
            value={balance < 0 ? `− ${formatAmount(Math.abs(balance), { decimals: 0 })}` : formatAmount(balance, { decimals: 0 })}
            subtext={`${filtered.length} transacciones`}
            borderColor="var(--info)"
            valueColor={balance >= 0 ? 'var(--success)' : 'var(--destructive)'}
          />
        </div>

        {/* ── Tabla ── */}
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th
                  className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#625f55] dark:text-muted-foreground"
                  style={{ letterSpacing: '.08em' }}
                >
                  Fecha
                </th>
                <th
                  className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#625f55] dark:text-muted-foreground"
                  style={{ letterSpacing: '.08em' }}
                >
                  Descripción
                </th>
                <th
                  className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#625f55] dark:text-muted-foreground"
                  style={{ letterSpacing: '.08em' }}
                >
                  Tipo · Categoría
                </th>
                <th
                  className="text-right px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#625f55] dark:text-muted-foreground"
                  style={{ letterSpacing: '.08em' }}
                >
                  Monto
                </th>
                <th
                  className="text-right px-3.5 py-2.5 font-mono text-[10.5px] uppercase text-[#625f55] dark:text-muted-foreground"
                  style={{ letterSpacing: '.08em' }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <EmptyState>Sin movimientos en esta vista.</EmptyState>
                  </td>
                </tr>
              ) : (
                paginated.map(t => {
                  const categoryName = getCategoryName(t);
                  const fecha       = getTransactionDate(t);
                  const displayDate = fecha ? fecha.toLocaleDateString('es-AR') : '-';
                  const descripcion = t.descripcion || t.Descripcion || 'Sin descripción';
                  const tipo        = t.tipo || 'gasto';
                  const esIngreso   = tipo === 'ingreso';
                  const monto       = Math.abs(t.monto || t.monto_ars || 0);
                  const rowId       = t.id || t.Id;
                  const pillColor   = esIngreso ? 'var(--success)' : 'var(--destructive)';
                  const attachedDocument = getTransactionDocument(t);

                  return (
                    <tr key={rowId} className="group border-b border-muted hover:bg-card-hover transition-colors last:border-b-0">
                      <td className="px-3.5 py-2.5 font-mono text-[12px] text-[#43436c] dark:text-muted-foreground">{displayDate}</td>
                      <td className="px-3.5 py-2.5 text-[13.5px] text-foreground">{descripcion}</td>
                      <td className="px-3.5 py-2.5">
                        <Badge
                          variant="outline"
                          style={{ borderColor: pillColor, color: pillColor }}
                        >
                          {categoryName}
                        </Badge>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-semibold" style={{ color: pillColor }}>
                        {esIngreso ? '+' : '−'} {formatAmount(monto, { decimals: 0 })}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          {attachedDocument.isValid && (
                            <button
                              type="button"
                              onClick={(e) => openDocumentPreview(e, attachedDocument.rawUrl)}
                              aria-label={`Ver comprobante de ${descripcion}`}
                              className="p-1.5 rounded-sm hover:bg-black/5 transition-colors"
                              title="Ver comprobante"
                            >
                              <Eye className="w-4 h-4 text-[#625f55]" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditTransaction && onEditTransaction(t)}
                            aria-label={`Editar movimiento ${descripcion}`}
                            className="p-1.5 rounded-sm hover:bg-black/5 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-[#625f55]" />
                          </button>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onDeleteTransaction && onDeleteTransaction(t); }}
                            aria-label={`Eliminar movimiento ${descripcion}`}
                            className="p-1.5 rounded-sm hover:bg-black/5 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-[#625f55] hover:text-[#b83245]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-muted">
              <p className="font-mono text-[12px] text-[#625f55] dark:text-muted-foreground">
                Página {currentPage} de {totalPages} ({filtered.length} resultados)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
                >
                  <ChevronLeft className="w-4 h-4 text-[#625f55]" />
                </button>
                <span className="font-mono text-[12px] text-foreground px-2">{currentPage}</span>
                <button
                  onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
                >
                  <ChevronRight className="w-4 h-4 text-[#625f55]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      <DocumentPreviewModal
        isOpen={!!previewDocumentUrl}
        onClose={() => setPreviewDocumentUrl('')}
        documentUrl={previewDocumentUrl}
        title="Vista previa del comprobante"
      />
    </>
  );
};

ModernTransactionsView.propTypes = {
  transactions:        PropTypes.array,
  onNewTransaction:    PropTypes.func,
  onEditTransaction:   PropTypes.func,
  onDeleteTransaction: PropTypes.func,
  onBulkUpload:        PropTypes.func,
  onExportCSV:         PropTypes.func,
};

export default ModernTransactionsView;
