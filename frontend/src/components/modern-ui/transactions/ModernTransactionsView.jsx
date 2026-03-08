import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Plus, Search, Download, Upload, Edit, Trash2,
  ChevronLeft, ChevronRight, Calendar, CalendarDays,
  ChevronDown, Check, RefreshCw, Filter
} from 'lucide-react';
import FloatingActionButton from '../common/FloatingActionButton';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useIsMobile } from '../../../hooks/use-mobile';

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

const TX_MONTHS_KEY   = 'tx_selected_months';   // acumulado: meses checkeados
const TX_VIEW_MODE_KEY = 'tx_view_mode';         // 'monthly' | 'accumulated'

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

  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedType, setSelectedType]   = useState('all');
  const [selectedCurrency, setSelectedCurrency] = useState('all');
  const [currentPage, setCurrentPage]     = useState(1);

  // Vista: mensual (un mes con flechas) vs acumulado (multi-mes con checkboxes)
  const [viewMode, setViewMode]           = useState(loadViewMode);

  // Mes único para modo mensual
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Multi-meses para modo acumulado
  const [selectedMonths, setSelectedMonths] = useState(loadSelectedMonths);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const monthPickerRef = useRef(null);
  const itemsPerPage = 15;

  // Persistir preferencias
  useEffect(() => {
    localStorage.setItem(TX_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(TX_MONTHS_KEY, JSON.stringify(selectedMonths));
  }, [selectedMonths]);

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
    [searchQuery, selectedType, selectedCurrency, viewMode, selectedMonth, selectedMonths]);

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

  const formatMonto = (n) =>
    new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  // ── Filtrado por fecha ────────────────────────────────────────────────────
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

  // ── Filtrado por búsqueda / tipo / moneda ────────────────────────────────
  const filtered = dateFiltered.filter(t => {
    const desc = t.descripcion || t.Descripcion || '';
    const cat  = getCategoryName(t);
    const matchSearch   = desc.toLowerCase().includes(searchQuery.toLowerCase())
                       || cat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType     = selectedType === 'all' || t.tipo === selectedType;
    const matchCurrency = selectedCurrency === 'all' || (t.moneda || t.Moneda || 'ARS') === selectedCurrency;
    return matchSearch && matchType && matchCurrency;
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

  // ── Monedas disponibles ──────────────────────────────────────────────────
  const availableCurrencies = [...new Set(transactions.map(t => t.moneda || t.Moneda || 'ARS'))].sort();

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
    const now = new Date();
    if (d <= now) setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const goToToday = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };
  const isCurrentMonth = selectedMonth >= `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const currentMonthLabel = (() => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const names = ['enero','febrero','marzo','abril','mayo','junio',
                   'julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${names[mo - 1]} de ${yr}`;
  })();

  const fabActions = [
    { icon: Download, label: 'Exportar CSV',       onClick: onExportCSV },
    { icon: Upload,   label: 'Importar CSV',        onClick: onBulkUpload },
    { icon: Plus,     label: 'Nueva Transacción',   onClick: onNewTransaction },
  ];

  // ── Render Mobile ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-24">

        {/* Header mobile */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#10b981]" />
              <h2 className="text-lg font-bold text-white capitalize">
                {viewMode === 'monthly' ? currentMonthLabel : `Acumulado — ${monthsLabel}`}
              </h2>
              {viewMode === 'accumulated' && (
                <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded-full border border-[#10b981]/30">
                  {selectedMonths.length}m
                </span>
              )}
            </div>
            {/* Refresh */}
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-[#18181b] border border-white/5 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Toggle modo */}
          <div className="bg-[#18181b] rounded-xl border border-white/5 p-1 flex gap-1 mb-3">
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg transition-all ${
                viewMode === 'monthly' ? 'bg-[#10b981] text-white font-medium' : 'text-gray-400'
              }`}
            >
              📅 Mensual
            </button>
            <button
              onClick={() => setViewMode('accumulated')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg transition-all ${
                viewMode === 'accumulated' ? 'bg-[#10b981] text-white font-medium' : 'text-gray-400'
              }`}
            >
              📊 Acumulado
            </button>
          </div>

          {/* Navegación mes (solo mensual) */}
          {viewMode === 'monthly' && (
            <div className="flex items-center justify-between bg-[#18181b] rounded-xl border border-white/5 px-3 py-2 mb-3">
              <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <span className="text-sm font-medium text-white capitalize">{currentMonthLabel}</span>
              <button
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}

          {/* Selector multi-mes (solo acumulado) */}
          {viewMode === 'accumulated' && (
            <div className="relative mb-3" ref={monthPickerRef}>
              <button
                onClick={() => setShowMonthPicker(p => !p)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[#18181b] border border-white/10 rounded-xl text-sm text-gray-300"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#10b981]" />
                  <span>{monthsLabel}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
              </button>
              {showMonthPicker && (
                <div className="absolute left-0 right-0 top-full mt-2 z-[9999] bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white">Seleccionar meses</span>
                    <div className="flex gap-3">
                      <button onClick={selectCurrent} className="text-xs text-gray-400">Solo actual</button>
                      <button onClick={selectAll} className="text-xs text-[#10b981]">Todos</button>
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
                          className={`relative flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                              : 'bg-white/5 text-gray-400 border border-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                          <span>{mes.label}</span>
                          {isCurrent && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#10b981] rounded-full" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buscador */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#18181b] text-white text-sm border border-white/5 rounded-2xl placeholder:text-gray-500 focus:outline-none focus:border-[#10b981]/30"
            />
          </div>

          {/* Filtros tipo / moneda */}
          <div className="flex gap-2 mb-3">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#18181b] text-white text-sm border border-white/5 rounded-xl focus:outline-none"
            >
              <option value="all">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
            <select
              value={selectedCurrency}
              onChange={e => setSelectedCurrency(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#18181b] text-white text-sm border border-white/5 rounded-xl focus:outline-none"
            >
              <option value="all">Todas</option>
              {availableCurrencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tarjetas totales */}
        <div className="grid grid-cols-3 gap-2 px-4 mb-4">
          <div className="bg-[#18181b] rounded-xl border border-white/5 p-3">
            <p className="text-[10px] text-gray-500 mb-1">{viewMode === 'monthly' ? 'INGRESOS' : 'ING. ACUM.'}</p>
            <p className="text-base font-bold text-[#10b981]">+${formatMonto(totales.ingresos)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{filtered.filter(t => t.tipo === 'ingreso').length} tx</p>
          </div>
          <div className="bg-[#18181b] rounded-xl border border-white/5 p-3">
            <p className="text-[10px] text-gray-500 mb-1">{viewMode === 'monthly' ? 'GASTOS' : 'GTO. ACUM.'}</p>
            <p className="text-base font-bold text-[#ec4899]">-${formatMonto(totales.gastos)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{filtered.filter(t => t.tipo === 'gasto').length} tx</p>
          </div>
          <div className="bg-[#18181b] rounded-xl border border-white/5 p-3">
            <p className="text-[10px] text-gray-500 mb-1">BALANCE</p>
            <p className={`text-base font-bold ${totales.ingresos - totales.gastos >= 0 ? 'text-[#10b981]' : 'text-[#ec4899]'}`}>
              {totales.ingresos - totales.gastos >= 0 ? '+' : '-'}${formatMonto(Math.abs(totales.ingresos - totales.gastos))}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{filtered.length} tx</p>
          </div>
        </div>

        {/* Lista de transacciones como cards */}
        <div className="px-4 flex flex-col gap-2">
          {paginated.length === 0 ? (
            <div className="bg-[#18181b] rounded-2xl border border-white/5 py-12 flex flex-col items-center justify-center gap-2">
              <span className="text-3xl">📋</span>
              <p className="text-sm text-gray-500 text-center">
                No hay transacciones para {viewMode === 'monthly' ? currentMonthLabel : `los meses seleccionados (${monthsLabel})`}
              </p>
            </div>
          ) : (
            paginated.map(t => {
              const moneda      = t.moneda || t.Moneda || 'ARS';
              const monto       = t.monto || t.monto_ars || 0;
              const categoryName = getCategoryName(t);
              const fecha       = getTransactionDate(t);
              const displayDate = fecha ? fecha.toLocaleDateString('es-AR') : '-';
              const descripcion = t.descripcion || t.Descripcion || 'Sin descripción';
              const icono       = t.icono || '💰';
              const tipo        = t.tipo || 'gasto';
              const rowId       = t.id || t.Id;

              return (
                <div key={rowId} className="bg-[#18181b] rounded-2xl border border-white/5 px-4 py-3 flex items-center gap-3">
                  {/* Ícono */}
                  <div className={`w-10 h-10 rounded-xl ${t.color || 'bg-zinc-700'} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    {icono}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{descripcion}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-500 truncate">{categoryName}</span>
                      <span className="text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{displayDate}</span>
                      {moneda !== 'ARS' && (
                        <>
                          <span className="text-gray-600">·</span>
                          <span className="text-[10px] bg-[#0a0a0a] text-gray-300 px-1.5 py-0.5 rounded border border-white/5">{moneda}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Monto + acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tipo === 'ingreso' ? 'text-[#10b981]' : 'text-white'}`}>
                        {tipo === 'ingreso' ? '+' : '-'}${Math.abs(monto).toLocaleString('es-AR')}
                      </p>
                      {moneda !== 'ARS' && t.monto_ars && (
                        <p className="text-[10px] text-gray-500">≈${Math.abs(t.monto_ars).toLocaleString('es-AR')}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onEditTransaction && onEditTransaction(t)}
                        className="p-1.5 rounded-lg bg-white/5 active:bg-white/10"
                      >
                        <Edit className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteTransaction && onDeleteTransaction(t); }}
                        className="p-1.5 rounded-lg bg-red-500/10 active:bg-red-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Paginación mobile */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#18181b] rounded-2xl border border-white/5 px-4 py-3 mt-2">
              <button
                onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg disabled:opacity-30 active:bg-white/5"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <span className="text-sm text-gray-400">
                {currentPage} / {totalPages} <span className="text-gray-600">({filtered.length} resultados)</span>
              </span>
              <button
                onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg disabled:opacity-30 active:bg-white/5"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        <FloatingActionButton actions={fabActions} />
      </div>
    );
  }

  // ── Render Desktop ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">

      {/* ── Barra superior: título + controles de fecha ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">

        {/* Título / mes activo */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#10b981]" />
          <h2 className="text-xl font-bold text-white capitalize">
            {viewMode === 'monthly' ? currentMonthLabel : `Acumulado — ${monthsLabel}`}
          </h2>
          {viewMode === 'accumulated' && (
            <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded-full border border-[#10b981]/30">
              {selectedMonths.length} {selectedMonths.length === 1 ? 'mes' : 'meses'}
            </span>
          )}
        </div>

        {/* Controles de fecha según modo + acciones */}
        <div className="flex items-center gap-2">

          {/* Toggle modo */}
          <div className="bg-[#18181b] rounded-xl border border-white/5 p-1 flex gap-1">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                viewMode === 'monthly' ? 'bg-[#10b981] text-white font-medium' : 'text-gray-400 hover:text-white'
              }`}
            >
              📅 Mensual
            </button>
            <button
              onClick={() => setViewMode('accumulated')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                viewMode === 'accumulated' ? 'bg-[#10b981] text-white font-medium' : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 Acumulado
            </button>
          </div>

          {/* Navegación mensual */}
          {viewMode === 'monthly' && (
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 bg-[#18181b] hover:bg-white/5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors border border-white/5"
              >
                Hoy
              </button>
              <button
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}

          {/* Selector multi-mes (modo acumulado) */}
          {viewMode === 'accumulated' && (
            <div className="relative" ref={monthPickerRef}>
              <button
                onClick={() => setShowMonthPicker(p => !p)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#18181b] hover:bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 transition-colors"
              >
                <CalendarDays className="w-4 h-4 text-[#10b981]" />
                <span>{monthsLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
              </button>

              {showMonthPicker && (
                <div className="absolute right-0 top-full mt-2 z-[9999] bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-4 w-80 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white">Seleccionar meses</span>
                    <div className="flex gap-3">
                      <button
                        onClick={selectCurrent}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Solo actual
                      </button>
                      <span className="text-gray-600">·</span>
                      <button
                        onClick={selectAll}
                        className="text-xs text-[#10b981] hover:text-[#34d399] transition-colors"
                      >
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
                          className={`
                            relative flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                            ${isSelected
                              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                            }
                          `}
                        >
                          {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                          <span>{mes.label}</span>
                          {isCurrent && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#10b981] rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
                    {selectedMonths.length === 1
                      ? `Mostrando solo ${MESES.find(m => m.key === selectedMonths[0])?.fullLabel}`
                      : `Acumulando: ${selectedMonths.map(k => MESES.find(m => m.key === k)?.label).join(', ')}`
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Separador */}
          <div className="w-px h-6 bg-white/10" />

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-[#18181b] hover:bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          {/* Importar CSV */}
          {onBulkUpload && (
            <button
              onClick={onBulkUpload}
              className="flex items-center gap-2 px-3 py-2 bg-[#18181b] hover:bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
              title="Importar CSV masivo"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importar</span>
            </button>
          )}

          {/* Nueva Transacción */}
          {onNewTransaction && (
            <button
              onClick={onNewTransaction}
              className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#0ea572] rounded-xl text-sm text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#10b981]/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-11 pr-4 py-2.5 bg-[#18181b] text-white text-sm border border-white/5 rounded-2xl placeholder:text-gray-500 focus:outline-none focus:border-[#10b981]/30 transition-colors"
          />
        </div>
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-4 py-2.5 bg-[#18181b] text-white text-sm border border-white/5 rounded-xl focus:outline-none"
        >
          <option value="all">Todos los tipos</option>
          <option value="ingreso">Ingresos</option>
          <option value="gasto">Gastos</option>
        </select>
        <select
          value={selectedCurrency}
          onChange={e => setSelectedCurrency(e.target.value)}
          className="px-4 py-2.5 bg-[#18181b] text-white text-sm border border-white/5 rounded-xl focus:outline-none"
        >
          <option value="all">Todas las monedas</option>
          {availableCurrencies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* ── Tarjetas de totales ── */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-[#18181b] rounded-xl border border-white/5 p-4">
          <p className="text-xs text-gray-500 mb-1">
            {viewMode === 'monthly' ? 'INGRESOS DEL MES' : 'INGRESOS ACUMULADOS'}
          </p>
          <p className="text-xl font-bold text-[#10b981]">+${formatMonto(totales.ingresos)}</p>
          <p className="text-xs text-gray-400 mt-1">{filtered.filter(t => t.tipo === 'ingreso').length} transacciones</p>
        </div>
        <div className="flex-1 bg-[#18181b] rounded-xl border border-white/5 p-4">
          <p className="text-xs text-gray-500 mb-1">
            {viewMode === 'monthly' ? 'GASTOS DEL MES' : 'GASTOS ACUMULADOS'}
          </p>
          <p className="text-xl font-bold text-[#ec4899]">-${formatMonto(totales.gastos)}</p>
          <p className="text-xs text-gray-400 mt-1">{filtered.filter(t => t.tipo === 'gasto').length} transacciones</p>
        </div>
        <div className="flex-1 bg-[#18181b] rounded-xl border border-white/5 p-4">
          <p className="text-xs text-gray-500 mb-1">
            {viewMode === 'monthly' ? 'BALANCE DEL MES' : 'BALANCE ACUMULADO'}
          </p>
          <p className={`text-xl font-bold ${totales.ingresos - totales.gastos >= 0 ? 'text-[#10b981]' : 'text-[#ec4899]'}`}>
            {totales.ingresos - totales.gastos >= 0 ? '+' : '-'}${formatMonto(Math.abs(totales.ingresos - totales.gastos))}
          </p>
          <p className="text-xs text-gray-400 mt-1">{filtered.length} transacciones</p>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-[#18181b] rounded-3xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-xs text-gray-500 uppercase">Concepto</th>
              <th className="text-left p-4 text-xs text-gray-500 uppercase">Categoría</th>
              <th className="text-center p-4 text-xs text-gray-500 uppercase">Moneda</th>
              <th className="text-right p-4 text-xs text-gray-500 uppercase">Fecha</th>
              <th className="text-right p-4 text-xs text-gray-500 uppercase">Monto</th>
              <th className="text-center p-4 text-xs text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-500 text-sm">
                  No hay transacciones para{' '}
                  {viewMode === 'monthly' ? currentMonthLabel : `los meses seleccionados (${monthsLabel})`}
                </td>
              </tr>
            ) : (
              paginated.map(t => {
                const moneda      = t.moneda || t.Moneda || 'ARS';
                const monto       = t.monto || t.monto_ars || 0;
                const categoryName = getCategoryName(t);
                const fecha       = getTransactionDate(t);
                const displayDate = fecha ? fecha.toLocaleDateString('es-AR') : '-';
                const descripcion = t.descripcion || t.Descripcion || 'Sin descripción';
                const icono       = t.icono || '💰';
                const tipo        = t.tipo || 'gasto';
                const rowId       = t.id || t.Id;

                return (
                  <tr key={rowId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${t.color || 'bg-zinc-700'} flex items-center justify-center shadow-md flex-shrink-0`}>
                          {icono}
                        </div>
                        <span className="text-sm text-white">{descripcion}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{categoryName}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-[#0a0a0a] text-xs font-medium text-gray-300 rounded-lg border border-white/5">
                        {moneda}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm text-gray-400">{displayDate}</td>
                    <td className={`p-4 text-right text-sm font-bold ${tipo === 'ingreso' ? 'text-[#10b981]' : 'text-white'}`}>
                      <div className="flex flex-col items-end">
                        <span>{tipo === 'ingreso' ? '+' : '-'}${Math.abs(monto).toLocaleString('es-AR')}</span>
                        {moneda !== 'ARS' && t.monto_ars && (
                          <span className="text-xs text-gray-500 mt-0.5">
                            ≈ ${Math.abs(t.monto_ars).toLocaleString('es-AR')} ARS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onEditTransaction && onEditTransaction(t)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); onDeleteTransaction && onDeleteTransaction(t); }}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <p className="text-sm text-gray-500">
              Página {currentPage} de {totalPages} ({filtered.length} resultados)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <span className="text-sm text-white px-3 font-medium">{currentPage}</span>
              <button
                onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      <FloatingActionButton actions={fabActions} />
    </div>
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
