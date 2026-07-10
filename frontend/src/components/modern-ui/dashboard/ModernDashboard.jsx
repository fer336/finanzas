import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useIsMobile } from '../../../hooks/use-mobile';
import { Skeleton } from '../../ui/skeleton';
import KpiCard from '../common/KpiCard';
import MobileDashboardHome from './MobileDashboardHome';
import { useDashboardHomeData } from './useDashboardHomeData';

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
      <div className="mb-[22px] flex items-end justify-between gap-5 border-b-[3px] border-double border-[#cfc6ae] pb-[18px]">
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
  dollarQuotes,
  loading = false,
  onNavigate,
  onNewTransaction,
}) => {
  const isMobile = useIsMobile();
  const {
    formatAmount,
    periodoLabel,
    tituloMes,
    veredicto,
    saldoEstimado,
    usdEquivalent,
    kpis,
    movimientosRecientes,
    categoriasOrdenadas,
    totalPendiente,
    pendientesActivos,
    proximoVencimiento,
    proximoVencimientoLabel,
  } = useDashboardHomeData({ transactions, pendingPayments, dollarQuotes });

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <MobileDashboardHome
        user={user}
        transactions={transactions}
        pendingPayments={pendingPayments}
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
        <div className="mb-[22px] flex items-end justify-between gap-5 border-b-[3px] border-double border-[#cfc6ae] pb-[18px]">
          <div>
            <div
              className="font-mono text-[11px] uppercase text-[#3d5a80]"
              style={{ letterSpacing: '.16em' }}
            >
              Período {periodoLabel}
            </div>
            <h1 className="mt-1 font-serif text-[42px] font-bold leading-none text-foreground">
              {tituloMes}
            </h1>
            <p className="mt-2 max-w-[58ch] text-[13.5px] text-[#5d6470]">
              {veredicto}
            </p>
          </div>
          <div className="shrink-0 rounded-md border border-[#ddd5c2] bg-card px-[18px] py-3 text-right">
            <div className="font-mono text-[10px] uppercase tracking-[.1em] text-[#8a8677]">
              Saldo estimado
            </div>
            <div className="mt-1 font-mono text-[24px] font-semibold text-foreground">
              {formatAmount(saldoEstimado, { decimals: 0 })}
            </div>
            <div className="font-mono text-[11px] text-[#8a8677]">{usdEquivalent}</div>
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
          <div className="rounded-md border border-[#ddd5c2] bg-card px-5 py-[18px]">
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
                      className={`font-mono text-[11.5px] text-[#8a8677] ${i > 0 ? 'border-t border-dashed border-[#ddd5c2] pt-[9px]' : ''}`}
                    >
                      {m.fechaMMDD}
                    </span>
                    <span className={i > 0 ? 'border-t border-dashed border-[#ddd5c2] pt-[9px]' : ''}>
                      {m.descripcion}{' '}
                      <span
                        className="ml-1.5 font-mono text-[10px] uppercase"
                        style={{ color: m.esIngreso ? '#476442' : '#a04a34' }}
                      >
                        {m.categoria}
                      </span>
                    </span>
                    <span
                      className={`text-right font-mono font-semibold ${i > 0 ? 'border-t border-dashed border-[#ddd5c2] pt-[9px]' : ''}`}
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

            {/* Gastos por categoría */}
            <div className="rounded-md border border-[#ddd5c2] bg-card px-5 py-[18px]">
              <h2 className="mb-3 font-serif text-[17px] font-semibold text-foreground">Gastos por categoría</h2>
              {categoriasOrdenadas.length === 0 ? (
                <EmptyState>Sin gastos en esta vista.</EmptyState>
              ) : (
                <>
                  <div className="mb-3 flex h-3.5 overflow-hidden rounded-full">
                    {categoriasOrdenadas.map((c) => (
                      <span key={c.nombre} style={{ width: `${c.pct}%`, background: c.color }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-x-3.5 gap-y-[5px] text-[12.5px]">
                    {categoriasOrdenadas.map((c) => (
                      <Fragment key={c.nombre}>
                        <span className="flex items-center gap-[7px] text-foreground">
                          <span className="h-[9px] w-[9px] shrink-0 rounded-sm" style={{ background: c.color }} />
                          {c.nombre}
                        </span>
                        <span className="font-mono text-[#5d6470]">{c.pct}%</span>
                      </Fragment>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Aviso vencimientos */}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('pending-payments-full')}
              className="rounded-md border border-[#e0c98a] bg-[#fdf6e3] px-5 py-4 text-left"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-[15px] font-semibold text-foreground">Vencimientos</span>
                <span className="font-mono text-[12px] font-semibold text-[#8a6a1f]">
                  {formatAmount(totalPendiente, { decimals: 0 })}
                </span>
              </div>
              {pendientesActivos.length === 0 ? (
                <p className="mt-1.5 text-[12.5px] italic text-[#8a8677]">Sin vencimientos pendientes.</p>
              ) : (
                <p className="mt-1.5 text-[12.5px] text-[#5d6470]">
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
          </div>
        </div>
      </div>
    </div>
  );
};

ModernDashboard.propTypes = {
  user: PropTypes.object,
  transactions: PropTypes.array,
  pendingPayments: PropTypes.array,
  dollarQuotes: PropTypes.array,
  loading: PropTypes.bool,
  onNavigate: PropTypes.func,
  onNewTransaction: PropTypes.func,
};

export default ModernDashboard;
