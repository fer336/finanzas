import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, CalendarDays, ChevronDown, CheckSquare, Square, Check } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const MESES = [
  { key: 1, label: 'Ene', fullLabel: 'Enero' },
  { key: 2, label: 'Feb', fullLabel: 'Febrero' },
  { key: 3, label: 'Mar', fullLabel: 'Marzo' },
  { key: 4, label: 'Abr', fullLabel: 'Abril' },
  { key: 5, label: 'May', fullLabel: 'Mayo' },
  { key: 6, label: 'Jun', fullLabel: 'Junio' },
  { key: 7, label: 'Jul', fullLabel: 'Julio' },
  { key: 8, label: 'Ago', fullLabel: 'Agosto' },
  { key: 9, label: 'Sep', fullLabel: 'Septiembre' },
  { key: 10, label: 'Oct', fullLabel: 'Octubre' },
  { key: 11, label: 'Nov', fullLabel: 'Noviembre' },
  { key: 12, label: 'Dic', fullLabel: 'Diciembre' },
];

const STORAGE_KEY = 'evolucion_accumulated_months';

/**
 * Lee los meses seleccionados del localStorage.
 * Por defecto: mes actual.
 */
const loadSelectedMonths = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [new Date().getMonth() + 1]; // mes actual por defecto
};

/**
 * EvolucionMensualWidget - Gráfico de evolución con selector de meses acumulativos
 */
const EvolucionMensualWidget = ({ data = [], periodo = 'monthly', balanceReal = null, onChangePeriodo, allTransactions = [] }) => {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(loadSelectedMonths);

  // Guardar selección en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedMonths));
  }, [selectedMonths]);

  // Sincronizar scope del header con la selección de meses del gráfico
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    window.dispatchEvent(new CustomEvent('headerScope:changed', {
      detail: { mode: 'accumulated', months: selectedMonths, year: currentYear }
    }));
  }, [selectedMonths]);

  // Cerrar el picker si se hace click afuera
  useEffect(() => {
    if (!showMonthPicker) return;
    const handler = (e) => {
      if (!e.target.closest('[data-month-picker]')) {
        setShowMonthPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMonthPicker]);

  const toggleMonth = (monthKey) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthKey)) {
        // No dejar vacío: si es el último, no lo quitar
        if (prev.length === 1) return prev;
        return prev.filter(m => m !== monthKey);
      }
      return [...prev, monthKey].sort((a, b) => a - b);
    });
  };

  const selectAll = () => setSelectedMonths(MESES.map(m => m.key));
  const selectCurrent = () => setSelectedMonths([new Date().getMonth() + 1]);

  // Calcular los datos acumulativos para el modo "monthly"
  // Si el modo no es monthly, usar data directamente
  const accumulatedData = (() => {
    if (periodo !== 'monthly' || allTransactions.length === 0) return data;

    const currentYear = new Date().getFullYear();

    // Agregar por mes, filtrando solo los meses seleccionados
    const byMonth = {};
    allTransactions.forEach(tx => {
      if (tx.es_credito) return;
      const rawDate = tx.fecha_transaccion || tx.fecha || tx.created_at;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;
      if (d.getFullYear() !== currentYear) return;
      const m = d.getMonth() + 1;
      if (!selectedMonths.includes(m)) return;

      if (!byMonth[m]) byMonth[m] = { ingresos: 0, gastos: 0 };
      const monto = Math.abs(parseFloat(tx.monto_ars || tx.monto || 0));
      if (tx.tipo === 'ingreso') byMonth[m].ingresos += monto;
      else byMonth[m].gastos += monto;
    });

    // Generar puntos ordenados por mes seleccionado
    return selectedMonths.map(m => {
      const mesNombre = MESES.find(x => x.key === m)?.label || `M${m}`;
      const { ingresos = 0, gastos = 0 } = byMonth[m] || {};
      return {
        fecha: mesNombre,
        ingresos,
        gastos,
        balance: ingresos - gastos,
      };
    });
  })();

  // Totales acumulados para mostrar en header
  const totalesAcumulados = (() => {
    if (periodo !== 'monthly') {
      const last = data[data.length - 1];
      return {
        balance: last?.balance ?? balanceReal?.balance ?? balanceReal?.totalARS ?? 0,
        ingresos: last?.ingresos ?? balanceReal?.ingresosMes ?? 0,
      };
    }
    const totalIngresos = accumulatedData.reduce((sum, p) => sum + p.ingresos, 0);
    const totalGastos = accumulatedData.reduce((sum, p) => sum + p.gastos, 0);
    return {
      balance: totalIngresos - totalGastos,
      ingresos: totalIngresos,
    };
  })();

  const { balance: balanceMostrado, ingresos: ingresosMostrados } = totalesAcumulados;
  const variacion = ingresosMostrados !== 0
    ? (((balanceMostrado) / ingresosMostrados) * 100).toFixed(1)
    : 0;
  const isPositive = balanceMostrado >= 0;

  // Etiqueta de meses seleccionados
  const monthsLabel = (() => {
    if (selectedMonths.length === 12) return 'Todo el año';
    if (selectedMonths.length === 1) {
      return MESES.find(m => m.key === selectedMonths[0])?.fullLabel || '';
    }
    return `${selectedMonths.length} meses`;
  })();

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-[#18181b] border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2">{payload[0].payload.fecha}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-[#10b981]">Ingresos</span>
            <span className="text-sm font-bold text-white">
              ${payload[0].payload.ingresos?.toLocaleString('es-AR') || 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-[#ec4899]">Gastos</span>
            <span className="text-sm font-bold text-white">
              ${payload[0].payload.gastos?.toLocaleString('es-AR') || 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
            <span className="text-xs text-gray-400">Balance</span>
            <span className={`text-sm font-bold ${payload[0].payload.balance >= 0 ? 'text-[#10b981]' : 'text-[#ec4899]'}`}>
              ${payload[0].payload.balance?.toLocaleString('es-AR') || 0}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const chartData = periodo === 'monthly' ? accumulatedData : data;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-1">
            {periodo === 'weekly' ? 'Evolución Semanal' : periodo === 'yearly' ? 'Evolución Anual' : 'Evolución Mensual'}
          </h2>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">
              ${Math.abs(balanceMostrado).toLocaleString('es-AR')}
              <span className="text-xs text-gray-500 ml-2">ARS</span>
            </p>
          </div>
          <div className={`flex items-center gap-1 mt-1 ${isPositive ? 'text-[#10b981]' : 'text-[#ec4899]'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-bold">
              {isPositive ? '+' : ''}{variacion}%
            </span>
          </div>
        </div>

        {/* Controles derecha */}
        <div className="flex flex-col gap-2 items-end">
          {/* Toggles de período */}
          <div className="flex gap-1 bg-[#0a0a0a] rounded-lg p-1">
            <button
              onClick={() => onChangePeriodo && onChangePeriodo('weekly')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${periodo === 'weekly' ? 'bg-[#10b981] text-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              1S
            </button>
            <button
              onClick={() => onChangePeriodo && onChangePeriodo('monthly')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${periodo === 'monthly' ? 'bg-[#10b981] text-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              1M
            </button>
            <button
              onClick={() => onChangePeriodo && onChangePeriodo('yearly')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${periodo === 'yearly' ? 'bg-[#10b981] text-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              1A
            </button>
          </div>

          {/* Selector de meses (solo visible en modo monthly) */}
          {periodo === 'monthly' && (
            <div className="relative" data-month-picker>
              <button
                onClick={() => setShowMonthPicker(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0a0a] hover:bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 transition-colors"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#10b981]" />
                <span>{monthsLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown de meses */}
              {showMonthPicker && (
                <div className="absolute right-0 top-full mt-2 z-[9999] bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-4 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white">Seleccionar meses</span>
                    <div className="flex gap-2">
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

                  <div className="grid grid-cols-3 gap-2">
                    {MESES.map(mes => {
                      const isSelected = selectedMonths.includes(mes.key);
                      const isCurrent = mes.key === new Date().getMonth() + 1;
                      return (
                        <button
                          key={mes.key}
                          onClick={() => toggleMonth(mes.key)}
                          className={`
                            relative flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                            ${isSelected
                              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                            }
                          `}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span>{mes.label}</span>
                          {isCurrent && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#10b981] rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Resumen */}
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
                    {selectedMonths.length === 1
                      ? `Mostrando solo ${MESES.find(m => m.key === selectedMonths[0])?.fullLabel}`
                      : `Acumulando ${selectedMonths.length} meses: ${selectedMonths.map(k => MESES.find(m => m.key === k)?.label).join(', ')}`
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className="flex-1 px-6 pb-4">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-500">No hay datos suficientes para mostrar el gráfico</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gastosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />

              {/* Línea de Ingresos (Verde) */}
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#0a0a0a' }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />

              {/* Línea de Gastos (Magenta) */}
              <Line
                type="monotone"
                dataKey="gastos"
                stroke="#ec4899"
                strokeWidth={3}
                dot={{ fill: '#ec4899', r: 4, strokeWidth: 2, stroke: '#0a0a0a' }}
                activeDot={{ r: 6, fill: '#ec4899' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

EvolucionMensualWidget.propTypes = {
  data: PropTypes.array,
  periodo: PropTypes.string,
  balanceReal: PropTypes.object,
  onChangePeriodo: PropTypes.func,
  allTransactions: PropTypes.array,
};

export default EvolucionMensualWidget;
