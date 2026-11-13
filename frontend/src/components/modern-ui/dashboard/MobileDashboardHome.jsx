import { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Skeleton } from '../../ui/skeleton';
import CategoriaDonut from './CategoriaDonut';
import { useDashboardHomeData } from './useDashboardHomeData';
import { useBalanceNeto } from '../../../hooks/useFinancialData';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

const panelClass = 'min-w-0 rounded-[10px] border border-border bg-card p-4 md:p-5';
const controlClass = 'min-h-11 rounded-md border border-border px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40';
const headingClass = 'text-xl font-semibold text-foreground';

function mesActualStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const EmptyState = ({ children }) => (
  <p className="py-4 text-sm italic text-muted-foreground">{children}</p>
);
EmptyState.propTypes = { children: PropTypes.node };

function ModeSelector({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`${controlClass} ${value === option.value ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover' : 'bg-secondary text-foreground'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
ModeSelector.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

/** Resumen compartido: el período nunca se confunde con el saldo acumulado. */
const MobileDashboardHome = ({
  transactions = [],
  pendingPayments = [],
  prestamos = [],
  dollarQuotes,
  loading = false,
  onNavigate,
  onNewTransaction,
  compact = true,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(mesActualStr);
  const [balanceMode, setBalanceMode] = useState('mensual');
  const [donutMode, setDonutMode] = useState('gastos');
  const { isAmountVisible } = useAmountVisibility();
  const { data: balanceNetoData } = useBalanceNeto(selectedMonth);
  const {
    formatAmount, periodoLabel, tituloMes, veredicto,
    balanceDisponible, apartadoObjetivos, usdEquivalent, kpis, resultadoMes,
    movimientosRecientes, categoriasOrdenadas, categoriasIngresosOrdenadas,
    evolucionMensual, totalPendiente, pendientesActivos,
    proximoVencimiento, proximoVencimientoLabel,
    prestamosActivos, totalPrestamosADevolver, proximoPrestamo, proximoPrestamoLabel,
  } = useDashboardHomeData({
    transactions, pendingPayments, prestamos, dollarQuotes,
    balanceNeto: balanceNetoData?.balance_neto,
    balanceDisponible: balanceNetoData?.balance_disponible,
    apartadoObjetivos: balanceNetoData?.apartado_objetivos,
    mes: selectedMonth,
  });

  function changeMonth(offset) {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (next <= mesActualStr()) setSelectedMonth(next);
  }
  function navigatePayments(section) {
    try { localStorage.setItem('vencimientos_section', section); } catch { /* La navegación funciona sin almacenamiento. */ }
    onNavigate?.('pending-payments-full');
  }
  const amount = (value) => formatAmount(value, { decimals: 0 });
  const signedAmount = (value) => `${value < 0 ? '−' : '+'} ${amount(Math.abs(value))}`;
  const donutData = donutMode === 'gastos' ? categoriasOrdenadas : categoriasIngresosOrdenadas;
  const donutTotal = donutData.reduce((sum, category) => sum + category.monto, 0);
  const selectedBalance = balanceMode === 'mensual' ? resultadoMes : balanceDisponible;
  const maxEvolution = Math.max(1, ...evolucionMensual.flatMap((month) => [month.ingresos, month.gastos]));
  const pageClass = compact
    ? 'mx-auto max-w-[1100px] space-y-6 px-4 pb-28 pt-6 text-foreground'
    : 'mx-auto max-w-[1100px] space-y-6 px-[34px] py-7 text-foreground';

  if (loading) {
    return (
      <div role="status" aria-label="Cargando resumen" className={pageClass}>
        <Skeleton className="h-11 w-48 motion-reduce:animate-none" />
        <Skeleton className="h-40 w-full motion-reduce:animate-none" />
        <Skeleton className="h-64 w-full motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Tu mes, en claro</h1>
          <p className="mt-1 text-secondary-foreground">{tituloMes} · Resumen en ARS</p>
          <p className="mt-2 max-w-[65ch] text-sm text-muted-foreground">{veredicto}</p>
        </div>
        {onNewTransaction && (
          <button type="button" onClick={onNewTransaction} className={`${controlClass} flex items-center gap-2 border-primary bg-primary text-primary-foreground hover:bg-primary-hover`}>
            <Plus aria-hidden="true" className="h-4 w-4" /> Nuevo movimiento
          </button>
        )}
        <nav aria-label="Período del resumen" className="flex w-full flex-wrap items-center gap-2">
          <button type="button" aria-label="Mes anterior" onClick={() => changeMonth(-1)} className={controlClass}>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="font-mono text-sm">{periodoLabel}</span>
          <button type="button" aria-label="Mes siguiente" disabled={selectedMonth >= mesActualStr()} onClick={() => changeMonth(1)} className={controlClass}>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setSelectedMonth(mesActualStr())} className={controlClass}>Hoy</button>
        </nav>
      </header>

      <section aria-label="Resumen financiero del período" className={`${panelClass} grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]`}>
        <div className="min-w-0 border-b border-border pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-5">
          <h2 className="text-base font-medium">Balance del período</h2>
          <p className="my-2 break-words text-[32px] font-semibold tabular-nums">{signedAmount(resultadoMes)}</p>
          <p className="text-sm text-muted-foreground">Ingresos menos gastos. No es saldo bancario.</p>
        </div>
        {kpis.filter((kpi) => kpi.key !== 'resultado').map((kpi) => (
          <div key={kpi.key} className="min-w-0">
            <h2 className="text-base font-medium">{kpi.label}</h2>
            <p className="my-2 break-words text-2xl font-semibold tabular-nums">
              {kpi.key === 'ingresos' ? '+' : '−'} {kpi.value}
            </p>
            <p className="text-sm text-muted-foreground">{kpi.subtext}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="due-heading" className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="due-heading" className={headingClass}>Próximos vencimientos</h2>
          <button type="button" onClick={() => navigatePayments('vencimientos')} className={controlClass} aria-label="Ver próximos vencimientos">
            Ver vencimientos ({pendientesActivos.length})
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Importes por pagar; este listado no los registra como gastos.</p>
        {pendientesActivos.length === 0 ? <EmptyState>Sin vencimientos pendientes.</EmptyState> : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <div>
              <h3 className="font-medium">{proximoVencimiento?.nombre || 'Pendientes sin próximo vencimiento confirmado'}</h3>
              <p className="text-sm text-muted-foreground">{proximoVencimientoLabel || 'Revisá fechas y pagos vencidos en Vencimientos.'}</p>
            </div>
            {proximoVencimiento && <p className="font-mono tabular-nums">{amount(proximoVencimiento.monto)}</p>}
          </div>
        )}
        <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-sm">
          <span>Total pendiente · ARS</span><strong className="tabular-nums">{amount(totalPendiente)}</strong>
        </div>
      </section>

      <section aria-labelledby="recent-heading" className={panelClass}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-heading" className={headingClass}>Movimientos recientes</h2>
          <button type="button" onClick={() => onNavigate?.('transactions-full')} className={controlClass}>Ver movimientos →</button>
        </div>
        <p className="text-sm text-muted-foreground">{tituloMes} · Importes en ARS</p>
        {movimientosRecientes.length === 0 ? <EmptyState>Sin movimientos en esta vista.</EmptyState> : (
          <ul className="mt-3 divide-y divide-border">
            {movimientosRecientes.map((movement, index) => (
              <li key={movement.id ?? index} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-4">
                <div className="min-w-0 flex-1 basis-36">
                  <p className="break-words font-medium">{movement.descripcion}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{movement.fechaMMDD} · {movement.categoria}</p>
                </div>
                <div className="max-w-full text-right">
                  <p className="break-words font-mono font-semibold tabular-nums">{movement.montoFormatted}</p>
                  <p className="text-sm text-muted-foreground">{movement.esIngreso ? 'Ingreso' : 'Gasto'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className={panelClass}>
        <summary className="min-h-11 cursor-pointer rounded-md py-2 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Más seguimiento</summary>
        <p className="mb-5 text-sm text-muted-foreground">Balance acumulado, categorías, préstamos y evolución del período seleccionado.</p>
        <div className="grid min-w-0 gap-6 md:grid-cols-2">
          <section aria-label="Consulta de balance" className="min-w-0">
            <h2 className={`${headingClass} mb-3`}>Consulta de balance</h2>
            <ModeSelector label="Tipo de balance" value={balanceMode} onChange={setBalanceMode} options={[{ value: 'mensual', label: 'Mensual' }, { value: 'acumulado', label: 'Acumulado' }]} />
            <h3 className="mt-4 text-sm text-muted-foreground">{balanceMode === 'mensual' ? 'Resultado del mes' : 'Balance acumulado disponible'}</h3>
            <p className="my-2 break-words text-2xl font-semibold tabular-nums">{signedAmount(selectedBalance)}</p>
            {balanceMode === 'acumulado' && (
              <>
                <p className="text-sm text-muted-foreground">{isAmountVisible ? usdEquivalent : '≈ USD ****'}</p>
                {apartadoObjetivos > 0 && <p className="mt-1 text-sm text-muted-foreground">Apartado en objetivos: {amount(apartadoObjetivos)}</p>}
              </>
            )}
          </section>
          <section className="min-w-0">
            <h2 className={`${headingClass} mb-3`}>{donutMode === 'gastos' ? 'Gastos por categoría' : 'Ingresos por categoría'}</h2>
            <ModeSelector label="Tipo de categorías" value={donutMode} onChange={setDonutMode} options={[{ value: 'gastos', label: 'Gastos' }, { value: 'ingresos', label: 'Ingresos' }]} />
            {donutData.length === 0 ? <EmptyState>Sin {donutMode} en esta vista.</EmptyState> : (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <CategoriaDonut categorias={donutData} total={donutTotal} formatAmount={formatAmount} size={96} />
                <ul className="min-w-0 flex-1 space-y-2 text-sm">
                  {donutData.map((category) => (
                    <li key={category.nombre} className="flex justify-between gap-3"><span className="break-words">{category.nombre}</span><span>{category.pct}%</span></li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <section>
            <h2 className={headingClass}>Préstamos</h2>
            <p className="my-2 font-mono tabular-nums">{amount(totalPrestamosADevolver)}</p>
            <p className="mb-3 text-sm text-muted-foreground">
              {prestamosActivos.length === 0 ? 'Sin préstamos pendientes.' : `${prestamosActivos.length} préstamos activos`}
              {proximoPrestamo && proximoPrestamoLabel && ` · ${proximoPrestamo.nombre}, ${proximoPrestamoLabel}, ${amount(proximoPrestamo.montoADevolver)}`}
            </p>
            <button type="button" onClick={() => navigatePayments('prestamos')} className={controlClass}>Ver préstamos</button>
          </section>
          <section className="min-w-0">
            <h2 className={headingClass}>Evolución mensual</h2>
            <p className="mt-2 text-sm text-muted-foreground">Últimos seis meses en ARS. El mes en curso es parcial; no es una proyección.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm tabular-nums">
                <caption className="sr-only">Ingresos y gastos registrados por mes</caption>
                <thead><tr><th scope="col" className="py-2">Mes</th><th scope="col" className="px-2 text-right">Ingresos</th><th scope="col" className="text-right">Gastos</th></tr></thead>
                <tbody>
                  {evolucionMensual.map((month) => (
                    <tr key={month.mes} className="border-t border-border">
                      <th scope="row" className="py-2 font-normal">{month.mes}</th>
                      {['ingresos', 'gastos'].map((type) => (
                        <td key={type} className="px-1 py-2 text-right">
                          {amount(month[type])}
                          {isAmountVisible && <span aria-hidden="true" className={`ml-auto mt-1 block h-1 rounded-full ${type === 'ingresos' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${month[type] / maxEvolution * 100}%` }} />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </details>
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
  compact: PropTypes.bool,
};

export default MobileDashboardHome;
