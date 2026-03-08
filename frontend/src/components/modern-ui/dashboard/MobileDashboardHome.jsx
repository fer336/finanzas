import { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, List, ArrowRight, TrendingUp, TrendingDown, X } from 'lucide-react';
import PresupuestosWidget from './widgets/PresupuestosWidget';
import ObjetivosWidget from './widgets/ObjetivosWidget';
import EvolucionMensualWidget from './widgets/EvolucionMensualWidget';

/**
 * MobileDashboardHome - Layout mobile del dashboard (diseño original).
 * Muestra: saludo, cards de balance, pagos pendientes, gráfico de transacciones,
 * presupuestos y objetivos.
 */
const MobileDashboardHome = ({
  user,
  dashboardData,
  transactions = [],
  pendingPayments = [],
  presupuestos = [],
  objetivos = [],
  onNavigate,
  onNewTransaction,
}) => {
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [showMoneyDetails, setShowMoneyDetails] = useState(false);
  const [showDebtDetails, setShowDebtDetails] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const formatAmount = (value, opts = {}) => {
    if (value == null || isNaN(value)) return '$0';
    if (opts.short) {
      if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCurrencySymbol = (code) => {
    const symbols = { ARS: '$', USD: 'U$D', EUR: '€', BRL: 'R$', GBP: '£' };
    return symbols[code] || code;
  };

  // ─── Cálculos ────────────────────────────────────────────────────────────────

  // Balance por moneda del mes actual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyStatsByCurrency = transactions
    .filter((t) => {
      const d = new Date(t.fecha_transaccion || t.fecha || t.created_at || '');
      return !isNaN(d) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => {
      const moneda = t.moneda || 'ARS';
      if (!acc[moneda]) acc[moneda] = { income: 0, expenses: 0, balance: 0 };
      const monto = Math.abs(parseFloat(t.monto || 0));
      if (t.tipo === 'ingreso') {
        acc[moneda].income += monto;
        acc[moneda].balance += monto;
      } else {
        acc[moneda].expenses += monto;
        acc[moneda].balance -= monto;
      }
      return acc;
    }, {});

  // Deuda de tarjetas
  const totalDeudaTarjetas = transactions
    .filter((t) => t.es_credito && t.tipo === 'gasto')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || t.monto || 0)), 0);

  // Deuda total (pagos pendientes)
  const totalDeuda = {
    total: pendingPayments
      .filter((p) => (p.estado || '').toLowerCase() !== 'pagado')
      .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0),
  };

  // Resumen financiero del mes
  const ingresosMes = Object.values(monthlyStatsByCurrency).reduce((s, v) => s + v.income, 0);
  const gastosMes = Object.values(monthlyStatsByCurrency).reduce((s, v) => s + v.expenses, 0);
  const balanceMes = ingresosMes - gastosMes;

  // Evolución para el gráfico según período seleccionado
  const evolucionData = (() => {
    const tx = transactions.filter((t) => {
      const rawDate = t.fecha_transaccion || t.fecha || t.created_at;
      const d = new Date(rawDate || '');
      return !isNaN(d) && !t.es_credito;
    });

    if (chartPeriod === 'weekly') {
      const points = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        const y = day.getFullYear();
        const m = day.getMonth();
        const d = day.getDate();

        const dayTransactions = tx.filter((t) => {
          const date = new Date(t.fecha_transaccion || t.fecha || t.created_at || '');
          return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
        });

        const ingresos = dayTransactions
          .filter((t) => t.tipo === 'ingreso')
          .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || t.monto || 0)), 0);

        const gastos = dayTransactions
          .filter((t) => t.tipo === 'gasto')
          .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || t.monto || 0)), 0);

        points.push({
          fecha: day.toLocaleDateString('es-AR', { weekday: 'short' }),
          ingresos,
          gastos,
          balance: ingresos - gastos,
        });
      }
      return points;
    }

    if (chartPeriod === 'yearly') {
      const points = [];
      const yearNow = new Date().getFullYear();

      for (let year = yearNow - 4; year <= yearNow; year++) {
        const yearTransactions = tx.filter((t) => {
          const date = new Date(t.fecha_transaccion || t.fecha || t.created_at || '');
          return date.getFullYear() === year;
        });

        const ingresos = yearTransactions
          .filter((t) => t.tipo === 'ingreso')
          .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || t.monto || 0)), 0);

        const gastos = yearTransactions
          .filter((t) => t.tipo === 'gasto')
          .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || t.monto || 0)), 0);

        points.push({
          fecha: `${year}`,
          ingresos,
          gastos,
          balance: ingresos - gastos,
        });
      }

      return points;
    }

    const points = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();

      const monthTransactions = tx.filter((t) => {
        const date = new Date(t.fecha_transaccion || t.fecha || t.created_at || '');
        return date.getFullYear() === year && date.getMonth() === month;
      });

      const ingresos = monthTransactions
        .filter((t) => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || t.monto || 0)), 0);

      const gastos = monthTransactions
        .filter((t) => t.tipo === 'gasto')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || t.monto || 0)), 0);

      points.push({
        fecha: monthDate.toLocaleDateString('es-AR', { month: 'short' }),
        ingresos,
        gastos,
        balance: ingresos - gastos,
      });
    }

    return points;
  })();

  const moneyDetailsActive = Object.entries(monthlyStatsByCurrency).filter(
    ([, s]) => s.income > 0 || s.expenses > 0
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-32 bg-[#0a0a0a] min-h-screen">

      {/* ── Saludo ── */}
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold text-white leading-tight">
          Hola<br />
          <span className="text-cyan-400">
            {user?.name || user?.first_name || user?.full_name || 'Usuario'}
          </span>
        </h1>
      </div>

      {/* ── Top Cards Grid: Dinero / Tarjetas / Deuda ── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Dinero */}
        <button
          onClick={() => setShowMoneyDetails(true)}
          className="bg-[#0f151a] border border-cyan-500/50 rounded-3xl p-4 flex flex-col justify-between h-32 relative overflow-hidden text-left transition-transform active:scale-95"
        >
          <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <div>
            <h3 className="text-white font-bold text-sm">Dinero</h3>
            <div className="mt-1 space-y-0.5">
              {moneyDetailsActive.slice(0, 2).map(([moneda, stats]) => (
                <p
                  key={moneda}
                  className={`text-sm font-bold ${stats.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}
                >
                  {getCurrencySymbol(moneda)}{Math.round(Math.abs(stats.balance)).toLocaleString()} {moneda}
                </p>
              ))}
              {moneyDetailsActive.length > 2 && (
                <p className="text-gray-500 text-[10px]">+{moneyDetailsActive.length - 2} más</p>
              )}
              {moneyDetailsActive.length === 0 && (
                <p className="text-cyan-400 text-sm font-bold">{formatAmount(0)}</p>
              )}
            </div>
          </div>
          <p className="text-gray-500 text-[10px] leading-tight">Toca para ver detalles</p>
        </button>

        {/* Tarjetas */}
        <button
          onClick={() => onNavigate && onNavigate('tarjetas-full')}
          className="bg-[#0f151a] border border-orange-500/30 rounded-3xl p-4 flex flex-col justify-between h-32 relative overflow-hidden text-left transition-transform active:scale-95"
        >
          <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
          <div className="w-full">
            <h3 className="text-white font-bold text-sm">Tarjetas</h3>
            <p className="text-orange-400 font-bold mt-1 text-lg">
              {formatAmount(totalDeudaTarjetas, { short: true })}
            </p>
          </div>
          <p className="text-gray-500 text-[10px]">Crédito</p>
        </button>

        {/* Deuda */}
        <button
          onClick={() => setShowDebtDetails(true)}
          className="bg-[#0f151a] border border-red-500/30 rounded-3xl p-4 flex flex-col justify-between h-32 relative overflow-hidden text-left transition-transform active:scale-95"
        >
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <div className="w-full">
            <h3 className="text-white font-bold text-sm">Deuda</h3>
            <p className="text-red-400 font-bold mt-1 text-lg">
              {formatAmount(totalDeuda.total, { short: true })}
            </p>
          </div>
          <p className="text-gray-500 text-[10px]">Resúmenes</p>
        </button>
      </div>

      {/* ── Pagos Pendientes ── */}
      <button
        onClick={() => onNavigate && onNavigate('pending-payments')}
        className="w-full bg-[#0f151a] border border-white/10 rounded-3xl h-48 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center group-hover:border-cyan-500/50 group-hover:scale-110 transition-all">
          <List className="w-8 h-8 text-gray-500 group-hover:text-cyan-400 transition-colors" />
        </div>
        <span className="text-gray-500 font-medium text-lg group-hover:text-white transition-colors">
          Pagos Pendientes
        </span>
      </button>

      {/* ── Balance Reciente (Chart + tabs) ── */}
      <div className="bg-[#0f151a] rounded-3xl p-5 border border-white/5 flex flex-col gap-4">

        {/* Mini resumen */}
        <div className="bg-[#162028] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Balance Reciente</span>
            <button
              onClick={() => onNavigate && onNavigate('transactions')}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              Ver todo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">$ ARS</span>
            <span className={`font-bold text-lg ${balanceMes >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {balanceMes >= 0 ? '+' : ''}{formatAmount(balanceMes)}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-400">Ingresos</span>
              </div>
              <span className="text-sm font-semibold text-green-400">{formatAmount(ingresosMes)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-green-400 h-1.5 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-xs text-gray-400">Gastos</span>
              </div>
              <span className="text-sm font-semibold text-red-400">{formatAmount(gastosMes)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-red-400 h-1.5 rounded-full"
                style={{ width: ingresosMes > 0 ? `${Math.min((gastosMes / ingresosMes) * 100, 100)}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="w-full -ml-2">
          <EvolucionMensualWidget
            data={evolucionData}
            periodo={chartPeriod}
            onChangePeriodo={setChartPeriod}
            balanceReal={balanceMes}
            allTransactions={transactions}
            compact
          />
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-[#162028] rounded-full">
          {[
            { key: 'weekly', label: 'Semana' },
            { key: 'monthly', label: 'Mes' },
            { key: 'yearly', label: 'Año' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setChartPeriod(tab.key)}
              className={`flex-1 py-3 text-sm font-medium rounded-full transition-colors capitalize ${
                chartPeriod === tab.key
                  ? 'text-black bg-cyan-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ver todas las transacciones */}
        <button
          onClick={() => onNavigate && onNavigate('transactions')}
          className="w-full text-center text-gray-500 text-sm font-medium hover:text-white flex items-center justify-center gap-2 bg-[#162028] py-3 rounded-xl border border-white/5"
        >
          Ver todas las transacciones
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Presupuestos ── */}
      <PresupuestosWidget
        presupuestos={presupuestos}
        onClick={() => onNavigate && onNavigate('presupuestos-full')}
      />

      {/* ── Objetivos ── */}
      <ObjetivosWidget
        objetivos={objetivos}
        onNavigate={onNavigate}
      />

      {/* ── FAB ── */}
      <div className="fixed bottom-24 right-4 z-50">
        <button
          onClick={() => onNewTransaction && onNewTransaction()}
          className="w-14 h-14 bg-[#a8c5da] hover:bg-[#90b0c5] text-black rounded-2xl shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* ── Modal: Detalles de Dinero ── */}
      {showMoneyDetails && (
        <div
          className="fixed inset-0 z-[9999] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMoneyDetails(false)}
        >
          <div
            className="w-full bg-[#0f151a] border-t border-white/10 rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Balance por Moneda</h2>
              <button onClick={() => setShowMoneyDetails(false)} className="p-2 rounded-xl hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {moneyDetailsActive.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Sin transacciones este mes</p>
            ) : (
              <div className="space-y-4">
                {moneyDetailsActive.map(([moneda, stats]) => (
                  <div key={moneda} className="bg-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-white text-lg">{moneda}</span>
                      <span className={`font-bold ${stats.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {stats.balance >= 0 ? '+' : ''}{getCurrencySymbol(moneda)}{Math.round(Math.abs(stats.balance)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">↑ Ingresos: {getCurrencySymbol(moneda)}{Math.round(stats.income).toLocaleString()}</span>
                      <span className="text-red-400">↓ Gastos: {getCurrencySymbol(moneda)}{Math.round(stats.expenses).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Detalles de Deuda ── */}
      {showDebtDetails && (
        <div
          className="fixed inset-0 z-[9999] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDebtDetails(false)}
        >
          <div
            className="w-full bg-[#0f151a] border-t border-white/10 rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Deuda Pendiente</h2>
              <button onClick={() => setShowDebtDetails(false)} className="p-2 rounded-xl hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {pendingPayments.filter((p) => (p.estado || '').toLowerCase() !== 'pagado').length === 0 ? (
              <p className="text-gray-500 text-center py-4">Sin deuda pendiente 🎉</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {pendingPayments
                  .filter((p) => (p.estado || '').toLowerCase() !== 'pagado')
                  .map((p, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
                      <span className="text-white text-sm">{p.descripcion || p.concepto || `Pago ${i + 1}`}</span>
                      <span className="text-red-400 font-bold">{formatAmount(parseFloat(p.monto || 0))}</span>
                    </div>
                  ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
              <span className="text-gray-400">Total</span>
              <span className="text-red-400 font-bold text-lg">{formatAmount(totalDeuda.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MobileDashboardHome.propTypes = {
  user: PropTypes.object,
  dashboardData: PropTypes.object,
  transactions: PropTypes.array,
  pendingPayments: PropTypes.array,
  presupuestos: PropTypes.array,
  objetivos: PropTypes.array,
  onNavigate: PropTypes.func,
  onNewTransaction: PropTypes.func,
};

export default MobileDashboardHome;
