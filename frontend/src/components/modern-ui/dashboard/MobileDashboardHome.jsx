import { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '../../ui/skeleton';
import CategoriaDonut from './CategoriaDonut';
import PillToggle from '../common/PillToggle';
import KpiCard from '../common/KpiCard';
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
  <div className="min-h-screen space-y-4 px-4 pb-28 pt-6">
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
    <div className="min-h-screen space-y-5 px-4 pb-28 pt-6">

      {/* ── Cabecera de período ── */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-[10px] uppercase" style={{ color: 'var(--info)', letterSpacing: '.16em' }}>
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
      <div className="kanagawa-card rounded-md px-[18px] py-3">
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
          <KpiCard
            key={kpi.key}
            kpiKey={kpi.key}
            label={kpi.label}
            value={kpi.value}
            subtext={kpi.subtext}
            borderColor={kpi.borderColor}
            valueColor={kpi.valueColor}
          />
        ))}
      </div>

      {/* ── Movimientos recientes ── */}
      <div className="kanagawa-card rounded-md px-5 py-[18px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[17px] font-semibold text-foreground">Movimientos recientes</h2>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('transactions-full')}
            className="text-[13px] hover:underline"
            style={{ color: 'var(--info)' }}
          >
            ver todos
          </button>
        </div>

        {movimientosRecientes.length === 0 ? (
          <EmptyState>Sin movimientos en esta vista.</EmptyState>
        ) : (
          <div className="grid min-w-0 grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-[9px] text-[13.5px]">
            {movimientosRecientes.map((m, i) => (
              <Fragment key={m.id ?? `${m.fechaMMDD}-${m.descripcion}-${i}`}>
                <span
                  className={`font-mono text-[11px] text-muted-foreground ${i > 0 ? 'border-t border-dashed border-muted pt-[9px]' : ''}`}
                >
                  {m.fechaMMDD}
                </span>
                <span className={`min-w-0 ${i > 0 ? 'border-t border-dashed border-muted pt-[9px]' : ''}`}>
                  <span className="block truncate">{m.descripcion}</span>
                  <span
                    className="block truncate font-mono text-[10px] uppercase"
                    style={{ color: m.esIngreso ? 'var(--success)' : 'var(--destructive)' }}
                  >
                    {m.categoria}
                  </span>
                </span>
                <span
                  className={`shrink-0 whitespace-nowrap text-right font-mono font-semibold ${i > 0 ? 'border-t border-dashed border-muted pt-[9px]' : ''}`}
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
      <div className="kanagawa-card rounded-md px-5 py-[18px]">
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
          <div className="flex min-w-0 items-center gap-4">
            <CategoriaDonut
              categorias={donutData}
              total={donutTotal}
              formatAmount={formatAmount}
              size={96}
            />
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-3.5 gap-y-[5px] text-[12.5px]">
              {donutData.map((c) => (
                <Fragment key={c.nombre}>
                  <span className="flex min-w-0 items-center gap-[7px] text-foreground">
                    <span className="h-[9px] w-[9px] shrink-0 rounded-sm" style={{ background: c.color }} />
                    <span className="min-w-0 truncate">{c.nombre}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-right font-mono text-secondary-foreground dark:text-muted-foreground">{c.pct}%</span>
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
        className="kanagawa-callout-warning kanagawa-interactive w-full rounded-md border px-5 py-4 text-left"
      >
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-[15px] font-semibold text-foreground">Vencimientos</span>
          <span className="font-mono text-[12px] font-semibold text-accent-foreground">
            {formatAmount(totalPendiente, { decimals: 0 })}
          </span>
        </div>
        {pendientesActivos.length === 0 ? (
          <p className="mt-1.5 text-[12.5px] italic text-muted-foreground">Sin vencimientos pendientes.</p>
        ) : (
          <p className="mt-1.5 text-[12.5px] text-secondary-foreground dark:text-muted-foreground">
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
        className="kanagawa-callout-info kanagawa-interactive w-full rounded-md border px-5 py-4 text-left"
      >
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-[15px] font-semibold text-foreground">Préstamos</span>
          <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--result-positive)' }}>
            {formatAmount(totalPrestamosADevolver, { decimals: 0 })}
          </span>
        </div>
        {prestamosActivos.length === 0 ? (
          <p className="mt-1.5 text-[12.5px] italic text-muted-foreground">Sin préstamos pendientes.</p>
        ) : (
          <p className="mt-1.5 text-[12.5px] text-secondary-foreground dark:text-muted-foreground">
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
