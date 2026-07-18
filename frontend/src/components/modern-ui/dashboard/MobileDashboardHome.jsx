import { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '../../ui/skeleton';
import CategoriaDonut from './CategoriaDonut';
import PillToggle from '../common/PillToggle';
import { useDashboardHomeData } from './useDashboardHomeData';
import { useBalanceNeto } from '../../../hooks/useFinancialData';

function mesActualStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const EmptyState = ({ children }) => (
  <p className="text-[13.5px] italic text-muted-foreground">{children}</p>
);

EmptyState.propTypes = { children: PropTypes.node };

const MobileSkeleton = () => (
  <div className="min-h-screen space-y-4 bg-background px-4 pb-28 pt-6">
    <Skeleton className="h-[11px] w-32" />
    <Skeleton className="h-9 w-48" />
    <Skeleton className="h-[13px] w-full" />
    <Skeleton className="h-[76px] rounded-md" />
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[84px] rounded-md" />
      ))}
    </div>
    <Skeleton className="h-[220px] rounded-md" />
    <Skeleton className="h-[170px] rounded-md" />
    <Skeleton className="h-[90px] rounded-md" />
  </div>
);

/**
 * MobileDashboardHome — vista "Inicio" del tema Kanagawa en mobile (<768px).
 * Mismo contenido que ModernDashboard (desktop), en una sola columna. Ver
 * design_handoff_rediseno_papel/README.md sección "2. Inicio (dashboard)" y
 * "Responsive" — el FAB verde flotante desapareció: la acción primaria es
 * "+ Nuevo" en ModernTopNav.
 */
const MobileDashboardHome = ({
  user,
  transactions = [],
  pendingPayments = [],
  prestamos = [],
  dollarQuotes,
  loading = false,
  onNavigate,
  // onNewTransaction ya no se usa acá: el FAB verde flotante se sacó (ver
  // README "Mapa de migración" — la acción primaria es "+ Nuevo" en
  // ModernTopNav). Se mantiene en las props/PropTypes por compatibilidad.
}) => {
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

  if (loading) {
    return <MobileSkeleton />;
  }

  return (
    <div className="min-h-screen space-y-5 bg-background px-4 pb-28 pt-6">

      {/* ── Cabecera de período ── */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-[10px] uppercase text-[var(--info)]" style={{ letterSpacing: '.16em' }}>
            Período {periodoLabel}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1.5 py-1">
            <button onClick={goToPrevMonth} className="p-1 rounded-full hover:bg-black/5 transition-colors dark:hover:bg-card-hover" title="Mes anterior">
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={goToToday} className="px-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground">
              hoy
            </button>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="p-1 rounded-full hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-card-hover"
              title="Mes siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <h1 className="mt-1 font-serif text-[30px] font-bold leading-tight text-foreground">
          {tituloMes}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-secondary-foreground dark:text-muted-foreground">{veredicto}</p>
      </div>

      {/* Sello de saldo */}
      <div className="rounded-md border border-border bg-card px-[18px] py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[.1em] text-muted-foreground">
            {balanceMode === 'mensual' ? 'Resultado del mes' : 'Balance disponible'}
          </div>
          <PillToggle
            options={[{ value: 'mensual', label: 'Mensual' }, { value: 'acumulado', label: 'Acumulado' }]}
            value={balanceMode}
            onChange={setBalanceMode}
            activeClassName="bg-foreground text-background"
          />
        </div>
        <div className="mt-1 font-mono text-[24px] font-semibold text-foreground">
          {balanceMostrado < 0 ? '− ' : ''}{formatAmount(Math.abs(balanceMostrado), { decimals: 0 })}
        </div>
        {balanceMode === 'acumulado' && (
          <div className="font-mono text-[11px] text-muted-foreground">{usdEquivalent}</div>
        )}
        {balanceMode === 'acumulado' && apartadoObjetivos > 0 && (
          <div className="font-mono text-[11px] text-muted-foreground">
            Apartado en objetivos: {formatAmount(apartadoObjetivos, { decimals: 0 })}
          </div>
        )}
      </div>

      {/* ── KPIs (1 columna en mobile) ── */}
      <div className="space-y-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.key}
            className="rounded-md border border-border bg-card px-[18px] py-4"
            style={{ borderTop: `3px solid ${kpi.borderColor}` }}
          >
            <div className="text-[11px] uppercase tracking-[.06em] text-muted-foreground">{kpi.label}</div>
            <div className="mt-1.5 font-mono text-[24px] font-semibold" style={{ color: kpi.valueColor }}>
              {kpi.value}
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">{kpi.subtext}</div>
          </div>
        ))}
      </div>

      {/* ── Movimientos recientes ── */}
      <div className="rounded-md border border-border bg-card px-5 py-[18px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[17px] font-semibold text-foreground">Movimientos recientes</h2>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('transactions-full')}
            className="text-[13px] text-[var(--info)] hover:underline"
          >
            ver todos
          </button>
        </div>

        {movimientosRecientes.length === 0 ? (
          <EmptyState>Sin movimientos en esta vista.</EmptyState>
        ) : (
          <div className="grid grid-cols-[46px_1fr_auto] items-center gap-x-2.5 gap-y-[9px] text-[13.5px]">
            {movimientosRecientes.map((m, i) => (
              <Fragment key={m.id ?? `${m.fechaMMDD}-${m.descripcion}-${i}`}>
                <span
                  className={`font-mono text-[11px] text-muted-foreground ${i > 0 ? 'border-t border-dashed border-muted pt-[9px]' : ''}`}
                >
                  {m.fechaMMDD}
                </span>
                <span className={i > 0 ? 'border-t border-dashed border-muted pt-[9px]' : ''}>
                  {m.descripcion}
                  <span
                    className="ml-1.5 block font-mono text-[10px] uppercase"
                    style={{ color: m.esIngreso ? 'var(--success)' : 'var(--destructive)' }}
                  >
                    {m.categoria}
                  </span>
                </span>
                <span
                  className={`text-right font-mono font-semibold ${i > 0 ? 'border-t border-dashed border-muted pt-[9px]' : ''}`}
                  style={{ color: m.esIngreso ? 'var(--success)' : 'var(--destructive)' }}
                >
                  {m.montoFormatted}
                </span>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ── Gastos / Ingresos por categoría ── */}
      <div className="rounded-md border border-border bg-card px-5 py-[18px]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-serif text-[17px] font-semibold text-foreground">
            {donutMode === 'gastos' ? 'Gastos por categoría' : 'Ingresos por categoría'}
          </h2>
          <PillToggle
            options={[{ value: 'gastos', label: 'Gastos' }, { value: 'ingresos', label: 'Ingresos' }]}
            value={donutMode}
            onChange={setDonutMode}
            activeClassName="bg-foreground text-background"
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
              size={96}
            />
            <div className="grid flex-1 grid-cols-[1fr_auto] gap-x-3.5 gap-y-[5px] text-[12.5px]">
              {donutData.map((c) => (
                <Fragment key={c.nombre}>
                  <span className="flex items-center gap-[7px] text-foreground">
                    <span className="h-[9px] w-[9px] shrink-0 rounded-sm" style={{ background: c.color }} />
                    {c.nombre}
                  </span>
                  <span className="font-mono text-secondary-foreground dark:text-muted-foreground">{c.pct}%</span>
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Aviso vencimientos ── */}
      <button
        type="button"
        onClick={goToVencimientos}
        className="w-full rounded-md border border-[#de9800] bg-[#f9d791] px-5 py-4 text-left dark:border-[#e6c384] dark:bg-[rgba(230,195,132,0.14)]"
      >
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-[15px] font-semibold text-foreground">Vencimientos</span>
          <span className="font-mono text-[12px] font-semibold text-[#6b572f] dark:text-[#e6c384]">
            {formatAmount(totalPendiente, { decimals: 0 })}
          </span>
        </div>
        {pendientesActivos.length === 0 ? (
          <p className="mt-1.5 text-[12.5px] italic text-[#625f55] dark:text-muted-foreground">Sin vencimientos pendientes.</p>
        ) : (
          <p className="mt-1.5 text-[12.5px] text-[#43436c] dark:text-muted-foreground">
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

      {/* ── Aviso préstamos ── */}
      <button
        type="button"
        onClick={goToPrestamos}
        className="w-full rounded-md border border-[#9fb5c9] bg-[#c7d7e0] px-5 py-4 text-left dark:border-[#658594] dark:bg-[rgba(126,156,216,0.14)]"
      >
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-[15px] font-semibold text-foreground">Préstamos</span>
          <span className="font-mono text-[12px] font-semibold text-[#4d699b] dark:text-[#7e9cd8]">
            {formatAmount(totalPrestamosADevolver, { decimals: 0 })}
          </span>
        </div>
        {prestamosActivos.length === 0 ? (
          <p className="mt-1.5 text-[12.5px] italic text-[#625f55] dark:text-muted-foreground">Sin préstamos pendientes.</p>
        ) : (
          <p className="mt-1.5 text-[12.5px] text-[#43436c] dark:text-muted-foreground">
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
  );
};

MobileDashboardHome.propTypes = {
  user: PropTypes.object,
  transactions: PropTypes.array,
  pendingPayments: PropTypes.array,
  prestamos: PropTypes.array,
  dollarQuotes: PropTypes.array,
  loading: PropTypes.bool,
  onNavigate: PropTypes.func,
  onNewTransaction: PropTypes.func,
};

export default MobileDashboardHome;
