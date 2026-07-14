import { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '../../../hooks/use-mobile';
import { Skeleton } from '../../ui/skeleton';
import KpiCard from '../common/KpiCard';
import PillToggle from '../common/PillToggle';
import MobileDashboardHome from './MobileDashboardHome';
import CategoriaDonut from './CategoriaDonut';
import { useDashboardHomeData } from './useDashboardHomeData';
import { useBalanceNeto } from '../../../hooks/useFinancialData';

function mesActualStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * EvolucionMensualChart — barras ingresos/gastos, últimos 6 meses.
 */
const EvolucionMensualChart = ({ data, formatAmount }) => (
  <div className="h-[160px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={2}>
        <XAxis
          dataKey="mes"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'IBM Plex Mono, monospace' }}
        />
        <Tooltip
          formatter={(value, name) => [formatAmount(value, { decimals: 0 }), name === 'ingresos' ? 'Ingresos' : 'Gastos']}
          cursor={{ fill: 'var(--card-hover)' }}
          contentStyle={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 12.5,
            color: 'var(--foreground)',
          }}
        />
        <Bar dataKey="ingresos" fill="#5a7d52" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="gastos" fill="#b35a42" radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

EvolucionMensualChart.propTypes = {
  data: PropTypes.array.isRequired,
  formatAmount: PropTypes.func.isRequired,
};

/**
 * EmptyState — DESIGN.md "Estado vacío": itálico 13.5px #8a8677, nunca un
 * área en blanco.
 */
const EmptyState = ({ children }) => (
  <p className="text-[13.5px] italic text-muted-foreground">{children}</p>
);

EmptyState.propTypes = { children: PropTypes.node };

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-[1100px] px-[34px] py-[28px]">
      <div className="mb-[22px] flex items-end justify-between gap-5 border-b-[3px] border-double border-[#cfc6ae] pb-[18px] dark:border-border">
        <div className="space-y-2.5">
          <Skeleton className="h-[11px] w-40" />
          <Skeleton className="h-[42px] w-72" />
          <Skeleton className="h-[13px] w-96" />
        </div>
        <Skeleton className="h-[76px] w-44 shrink-0 rounded-md" />
      </div>
      <div className="mb-5 grid grid-cols-3 gap-3.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[92px] rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        <Skeleton className="h-[320px] rounded-md" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[190px] rounded-md" />
          <Skeleton className="h-[92px] rounded-md" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * ModernDashboard — vista "Inicio" del tema Papel (desktop).
 * Ver design_handoff_rediseno_papel/README.md sección "2. Inicio (dashboard)".
 */
const ModernDashboard = ({
  user,
  transactions = [],
  pendingPayments = [],
  prestamos = [],
  dollarQuotes,
  loading = false,
  onNavigate,
  onNewTransaction,
}) => {
  const isMobile = useIsMobile();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(mesActualStr);
  const [balanceMode, setBalanceMode] = useState('acumulado');
  const [donutMode, setDonutMode] = useState('gastos');
  const { data: balanceNetoData } = useBalanceNeto(selectedMonth);
  const {
    formatAmount,
    periodoLabel,
    tituloMes,
    veredicto,
    balanceDisponible,
    apartadoObjetivos,
    usdEquivalent,
    kpis,
    resultadoMes,
    movimientosRecientes,
    categoriasOrdenadas,
    categoriasIngresosOrdenadas,
    evolucionMensual,
    totalPendiente,
    pendientesActivos,
    proximoVencimiento,
    proximoVencimientoLabel,
    prestamosActivos,
    totalPrestamosADevolver,
    proximoPrestamo,
    proximoPrestamoLabel,
  } = useDashboardHomeData({
    transactions,
    pendingPayments,
    prestamos,
    dollarQuotes,
    balanceNeto: balanceNetoData?.balance_neto,
    balanceDisponible: balanceNetoData?.balance_disponible,
    apartadoObjetivos: balanceNetoData?.apartado_objetivos,
    mes: selectedMonth,
  });

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
  const goToToday = () => setSelectedMonth(mesActualStr());
  const isCurrentMonth = selectedMonth >= mesActualStr();

  const donutData = donutMode === 'gastos' ? categoriasOrdenadas : categoriasIngresosOrdenadas;
  const donutTotal = donutData.reduce((sum, c) => sum + c.monto, 0);
  const balanceMostrado = balanceMode === 'mensual' ? resultadoMes : balanceDisponible;
  const goToVencimientos = () => {
    try { localStorage.setItem('vencimientos_section', 'vencimientos'); } catch { /* ignore */ }
    onNavigate && onNavigate('pending-payments-full');
  };
  const goToPrestamos = () => {
    try { localStorage.setItem('vencimientos_section', 'prestamos'); } catch { /* ignore */ }
    onNavigate && onNavigate('pending-payments-full');
  };

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <MobileDashboardHome
        user={user}
        transactions={transactions}
        pendingPayments={pendingPayments}
        prestamos={prestamos}
        dollarQuotes={dollarQuotes}
        loading={loading}
        onNavigate={onNavigate}
        onNewTransaction={onNewTransaction}
      />
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1100px] px-[34px] py-[28px]">

        {/* ── Cabecera de período ── */}
        <div className="mb-[22px] flex items-end justify-between gap-5 border-b-[3px] border-double border-[#cfc6ae] pb-[18px] dark:border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="font-mono text-[11px] uppercase text-[#3d5a80] dark:text-muted-foreground"
                style={{ letterSpacing: '.16em' }}
              >
                Período {periodoLabel}
              </div>
              <div className="flex items-center gap-1 rounded-full border border-[#ddd5c2] bg-card px-1.5 py-1 dark:border-border">
                <button onClick={goToPrevMonth} className="p-1 rounded-full hover:bg-black/5 transition-colors dark:hover:bg-card-hover" title="Mes anterior">
                  <ChevronLeft className="w-3.5 h-3.5 text-[#8a8677] dark:text-muted-foreground" />
                </button>
                <button onClick={goToToday} className="px-1.5 font-mono text-[11px] text-[#5d6470] transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground">
                  hoy
                </button>
                <button
                  onClick={goToNextMonth}
                  disabled={isCurrentMonth}
                  className="p-1 rounded-full hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-card-hover"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#8a8677] dark:text-muted-foreground" />
                </button>
              </div>
            </div>
            <h1 className="mt-1 font-serif text-[42px] font-bold leading-none text-foreground">
              {tituloMes}
            </h1>
            <p className="mt-2 max-w-[58ch] text-[13.5px] text-[#5d6470] dark:text-muted-foreground">
              {veredicto}
            </p>
          </div>
          <div className="shrink-0 rounded-md border border-[#ddd5c2] bg-card px-[18px] py-3 text-right dark:border-border">
            <div className="flex items-center justify-end gap-2">
              <div className="font-mono text-[10px] uppercase tracking-[.1em] text-[#8a8677] dark:text-muted-foreground">
                {balanceMode === 'mensual' ? 'Resultado del mes' : 'Balance disponible'}
              </div>
              <PillToggle
                options={[{ value: 'mensual', label: 'Mensual' }, { value: 'acumulado', label: 'Acumulado' }]}
                value={balanceMode}
                onChange={setBalanceMode}
                activeClassName="bg-[#20242c] text-[#f4f0e6]"
              />
            </div>
            <div className="mt-1 font-mono text-[24px] font-semibold text-foreground">
              {balanceMostrado < 0 ? '− ' : ''}{formatAmount(Math.abs(balanceMostrado), { decimals: 0 })}
            </div>
            {balanceMode === 'acumulado' && (
              <div className="font-mono text-[11px] text-[#8a8677] dark:text-muted-foreground">{usdEquivalent}</div>
            )}
            {balanceMode === 'acumulado' && apartadoObjetivos > 0 && (
              <div className="font-mono text-[11px] text-[#8a8677] dark:text-muted-foreground">
                Apartado en objetivos: {formatAmount(apartadoObjetivos, { decimals: 0 })}
              </div>
            )}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="mb-5 grid grid-cols-3 gap-3.5">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.key}
              label={kpi.label}
              value={kpi.value}
              subtext={kpi.subtext}
              borderColor={kpi.borderColor}
              valueColor={kpi.valueColor}
            />
          ))}
        </div>

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-[1.5fr_1fr] gap-4">

          {/* Movimientos recientes */}
          <div className="rounded-md border border-[#ddd5c2] bg-card px-5 py-[18px] dark:border-border">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-[17px] font-semibold text-foreground">Movimientos recientes</h2>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('transactions-full')}
                className="text-[13px] text-[#3d5a80] hover:underline"
              >
                ver todos
              </button>
            </div>

            {movimientosRecientes.length === 0 ? (
              <EmptyState>Sin movimientos en esta vista.</EmptyState>
            ) : (
              <div className="grid grid-cols-[52px_1fr_auto] items-center gap-x-3.5 gap-y-[9px] text-[13.5px]">
                {movimientosRecientes.map((m, i) => (
                  <Fragment key={m.id ?? `${m.fechaMMDD}-${m.descripcion}-${i}`}>
                    <span
                      className={`font-mono text-[11.5px] text-[#8a8677] dark:text-muted-foreground ${i > 0 ? 'border-t border-dashed border-[#ddd5c2] pt-[9px] dark:border-muted' : ''}`}
                    >
                      {m.fechaMMDD}
                    </span>
                    <span className={i > 0 ? 'border-t border-dashed border-[#ddd5c2] pt-[9px] dark:border-muted' : ''}>
                      {m.descripcion}{' '}
                      <span
                        className="ml-1.5 font-mono text-[10px] uppercase"
                        style={{ color: m.esIngreso ? '#476442' : '#a04a34' }}
                      >
                        {m.categoria}
                      </span>
                    </span>
                    <span
                      className={`text-right font-mono font-semibold ${i > 0 ? 'border-t border-dashed border-[#ddd5c2] pt-[9px] dark:border-muted' : ''}`}
                      style={{ color: m.esIngreso ? '#476442' : '#a04a34' }}
                    >
                      {m.montoFormatted}
                    </span>
                  </Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-4">

            {/* Gastos / Ingresos por categoría */}
            <div className="rounded-md border border-[#ddd5c2] bg-card px-5 py-[18px] dark:border-border">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-serif text-[17px] font-semibold text-foreground">
                  {donutMode === 'gastos' ? 'Gastos por categoría' : 'Ingresos por categoría'}
                </h2>
                <PillToggle
                  options={[{ value: 'gastos', label: 'Gastos' }, { value: 'ingresos', label: 'Ingresos' }]}
                  value={donutMode}
                  onChange={setDonutMode}
                  activeClassName="bg-[#20242c] text-[#f4f0e6]"
                />
              </div>
              {donutData.length === 0 ? (
                <EmptyState>Sin {donutMode === 'gastos' ? 'gastos' : 'ingresos'} en esta vista.</EmptyState>
              ) : (
                <div className="flex items-center gap-4">
                  <CategoriaDonut
                    categorias={donutData}
                    total={donutTotal}
                    formatAmount={formatAmount}
                  />
                  <div className="grid flex-1 grid-cols-[1fr_auto] gap-x-3.5 gap-y-[5px] text-[12.5px]">
                    {donutData.map((c) => (
                      <Fragment key={c.nombre}>
                        <span className="flex items-center gap-[7px] text-foreground">
                          <span className="h-[9px] w-[9px] shrink-0 rounded-sm" style={{ background: c.color }} />
                          {c.nombre}
                        </span>
                        <span className="font-mono text-[#5d6470] dark:text-muted-foreground">{c.pct}%</span>
                      </Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Aviso vencimientos */}
            <button
              type="button"
              onClick={goToVencimientos}
              className="rounded-md border border-[#e0c98a] bg-[#fdf6e3] px-5 py-4 text-left dark:border-[#d8ac5a] dark:bg-[rgba(216,172,90,0.14)]"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-[15px] font-semibold text-foreground">Vencimientos</span>
                <span className="font-mono text-[12px] font-semibold text-[#8a6a1f] dark:text-[#d8ac5a]">
                  {formatAmount(totalPendiente, { decimals: 0 })}
                </span>
              </div>
              {pendientesActivos.length === 0 ? (
                <p className="mt-1.5 text-[12.5px] italic text-[#8a8677] dark:text-[#93a0af]">Sin vencimientos pendientes.</p>
              ) : (
                <p className="mt-1.5 text-[12.5px] text-[#5d6470] dark:text-[#93a0af]">
                  {pendientesActivos.length} pendiente{pendientesActivos.length === 1 ? '' : 's'}
                  {proximoVencimiento && proximoVencimientoLabel ? (
                    <>
                      {' '}· el más próximo vence el <strong>{proximoVencimientoLabel}</strong> ({proximoVencimiento.nombre}, {formatAmount(proximoVencimiento.monto, { decimals: 0 })})
                    </>
                  ) : (
                    ' · sin fecha confirmada para el más próximo'
                  )}
                </p>
              )}
            </button>

            {/* Aviso préstamos */}
            <button
              type="button"
              onClick={goToPrestamos}
              className="rounded-md border border-[#b7c7d8] bg-[#eef5fb] px-5 py-4 text-left dark:border-[#6f8baa] dark:bg-[rgba(111,139,170,0.16)]"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-[15px] font-semibold text-foreground">Préstamos</span>
                <span className="font-mono text-[12px] font-semibold text-[#3d5a80] dark:text-[#9eb7d0]">
                  {formatAmount(totalPrestamosADevolver, { decimals: 0 })}
                </span>
              </div>
              {prestamosActivos.length === 0 ? (
                <p className="mt-1.5 text-[12.5px] italic text-[#8a8677] dark:text-[#93a0af]">Sin préstamos pendientes.</p>
              ) : (
                <p className="mt-1.5 text-[12.5px] text-[#5d6470] dark:text-[#93a0af]">
                  {prestamosActivos.length} préstamo{prestamosActivos.length === 1 ? '' : 's'} activo{prestamosActivos.length === 1 ? '' : 's'}
                  {proximoPrestamo && proximoPrestamoLabel ? (
                    <>
                      {' '}· el más próximo vence el <strong>{proximoPrestamoLabel}</strong> ({proximoPrestamo.nombre}, {formatAmount(proximoPrestamo.montoADevolver, { decimals: 0 })})
                    </>
                  ) : (
                    ' · sin fecha confirmada para el más próximo'
                  )}
                </p>
              )}
            </button>
          </div>
        </div>

        {/* ── Evolución mensual (últimos 6 meses) ── */}
        <div className="mt-4 rounded-md border border-[#ddd5c2] bg-card px-5 py-[18px] dark:border-border">
          <div className="mb-3 flex items-center gap-4">
            <h2 className="font-serif text-[17px] font-semibold text-foreground">Evolución mensual</h2>
            <div className="flex items-center gap-3 text-[11.5px] text-[#5d6470] dark:text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#5a7d52]" />Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#b35a42]" />Gastos</span>
            </div>
          </div>
          <EvolucionMensualChart data={evolucionMensual} formatAmount={formatAmount} />
        </div>
      </div>
    </div>
  );
};

ModernDashboard.propTypes = {
  user: PropTypes.object,
  transactions: PropTypes.array,
  pendingPayments: PropTypes.array,
  prestamos: PropTypes.array,
  dollarQuotes: PropTypes.array,
  loading: PropTypes.bool,
  onNavigate: PropTypes.func,
  onNewTransaction: PropTypes.func,
};

export default ModernDashboard;
