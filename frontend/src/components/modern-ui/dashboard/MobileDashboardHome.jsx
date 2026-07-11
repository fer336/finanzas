import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Skeleton } from '../../ui/skeleton';
import { useDashboardHomeData } from './useDashboardHomeData';
import { useBalanceNeto } from '../../../hooks/useFinancialData';

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
 * MobileDashboardHome — vista "Inicio" del tema Papel en mobile (<768px).
 * Mismo contenido que ModernDashboard (desktop), en una sola columna. Ver
 * design_handoff_rediseno_papel/README.md sección "2. Inicio (dashboard)" y
 * "Responsive" — el FAB verde flotante desapareció: la acción primaria es
 * "+ Nuevo" en ModernTopNav.
 */
const MobileDashboardHome = ({
  user,
  transactions = [],
  pendingPayments = [],
  dollarQuotes,
  loading = false,
  onNavigate,
  // onNewTransaction ya no se usa acá: el FAB verde flotante se sacó (ver
  // README "Mapa de migración" — la acción primaria es "+ Nuevo" en
  // ModernTopNav). Se mantiene en las props/PropTypes por compatibilidad.
}) => {
  const now = new Date();
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { data: balanceNetoData } = useBalanceNeto(mesActual);
  const {
    formatAmount,
    periodoLabel,
    tituloMes,
    veredicto,
    balanceNeto,
    usdEquivalent,
    kpis,
    movimientosRecientes,
    categoriasOrdenadas,
    totalPendiente,
    pendientesActivos,
    proximoVencimiento,
    proximoVencimientoLabel,
  } = useDashboardHomeData({
    transactions,
    pendingPayments,
    dollarQuotes,
    balanceNeto: balanceNetoData?.balance_neto,
  });

  if (loading) {
    return <MobileSkeleton />;
  }

  return (
    <div className="min-h-screen space-y-5 bg-background px-4 pb-28 pt-6">

      {/* ── Cabecera de período ── */}
      <div>
        <div className="font-mono text-[10px] uppercase text-[#3d5a80]" style={{ letterSpacing: '.16em' }}>
          Período {periodoLabel}
        </div>
        <h1 className="mt-1 font-serif text-[30px] font-bold leading-tight text-foreground">
          {tituloMes}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-[#5d6470]">{veredicto}</p>
      </div>

      {/* Sello de saldo */}
      <div className="rounded-md border border-[#ddd5c2] bg-card px-[18px] py-3">
        <div className="font-mono text-[10px] uppercase tracking-[.1em] text-[#8a8677]">Balance neto</div>
        <div className="mt-1 font-mono text-[24px] font-semibold text-foreground">
          {formatAmount(balanceNeto, { decimals: 0 })}
        </div>
        <div className="font-mono text-[11px] text-[#8a8677]">{usdEquivalent}</div>
      </div>

      {/* ── KPIs (1 columna en mobile) ── */}
      <div className="space-y-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.key}
            className="rounded-md border border-[#ddd5c2] bg-card px-[18px] py-4"
            style={{ borderTop: `3px solid ${kpi.borderColor}` }}
          >
            <div className="text-[11px] uppercase tracking-[.06em] text-[#8a8677]">{kpi.label}</div>
            <div className="mt-1.5 font-mono text-[24px] font-semibold" style={{ color: kpi.valueColor }}>
              {kpi.value}
            </div>
            <div className="mt-0.5 text-[12px] text-[#8a8677]">{kpi.subtext}</div>
          </div>
        ))}
      </div>

      {/* ── Movimientos recientes ── */}
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
          <div className="grid grid-cols-[46px_1fr_auto] items-center gap-x-2.5 gap-y-[9px] text-[13.5px]">
            {movimientosRecientes.map((m, i) => (
              <Fragment key={m.id ?? `${m.fechaMMDD}-${m.descripcion}-${i}`}>
                <span
                  className={`font-mono text-[11px] text-[#8a8677] ${i > 0 ? 'border-t border-dashed border-[#ddd5c2] pt-[9px]' : ''}`}
                >
                  {m.fechaMMDD}
                </span>
                <span className={i > 0 ? 'border-t border-dashed border-[#ddd5c2] pt-[9px]' : ''}>
                  {m.descripcion}
                  <span
                    className="ml-1.5 block font-mono text-[10px] uppercase"
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

      {/* ── Gastos por categoría ── */}
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

      {/* ── Aviso vencimientos ── */}
      <button
        type="button"
        onClick={() => onNavigate && onNavigate('pending-payments-full')}
        className="w-full rounded-md border border-[#e0c98a] bg-[#fdf6e3] px-5 py-4 text-left"
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
  );
};

MobileDashboardHome.propTypes = {
  user: PropTypes.object,
  transactions: PropTypes.array,
  pendingPayments: PropTypes.array,
  dollarQuotes: PropTypes.array,
  loading: PropTypes.bool,
  onNavigate: PropTypes.func,
  onNewTransaction: PropTypes.func,
};

export default MobileDashboardHome;
