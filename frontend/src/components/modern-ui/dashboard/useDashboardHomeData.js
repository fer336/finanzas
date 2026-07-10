import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

/**
 * Derivación de datos para la vista "Inicio" (tema Papel), compartida entre
 * ModernDashboard (desktop) y MobileDashboardHome (mobile) — ver
 * design_handoff_rediseno_papel/README.md sección "2. Inicio (dashboard)".
 *
 * Es presentación pura: no hace fetch, solo agrupa/formatea lo que ya llega
 * en `transactions` / `pendingPayments` / `dollarQuotes` (hooks de
 * useFinancialData.js, sin tocar).
 */

const CATEGORY_PALETTE = ['#b35a42', '#e9c46a', '#5a7d52', '#3d5a80', '#8a6fa0', '#9aa2ad'];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function lightenHex(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getCategoryColor(index) {
  const base = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
  const cycle = Math.floor(index / CATEGORY_PALETTE.length);
  return cycle === 0 ? base : lightenHex(base, cycle * 28);
}

function getTransactionAmount(t) {
  return Math.abs(parseFloat(t.monto_ars ?? t.monto ?? 0));
}

function getTransactionDate(t) {
  const raw = t.fecha_transaccion || t.fecha || t.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function useDashboardHomeData({ transactions = [], pendingPayments = [], dollarQuotes }) {
  const { formatAmount } = useAmountVisibility();

  // ── Período (siempre el mes calendario actual — Inicio no expone el
  // toggle Mensual/Acumulado de Ajustes, ver README "Interactions") ─────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const periodoLabel = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const tituloMes = `${MESES[currentMonth].replace(/^./, (c) => c.toUpperCase())} ${currentYear}`;

  const movimientosDelMes = transactions.filter((t) => {
    const fecha = getTransactionDate(t);
    return fecha && fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
  });
  const ingresosDelMes = movimientosDelMes.filter((t) => t.tipo === 'ingreso');
  const gastosDelMes = movimientosDelMes.filter((t) => t.tipo === 'gasto');
  const totalIngresos = ingresosDelMes.reduce((sum, t) => sum + getTransactionAmount(t), 0);
  const totalGastos = gastosDelMes.reduce((sum, t) => sum + getTransactionAmount(t), 0);
  const resultadoMes = totalIngresos - totalGastos;
  const ratioGastosIngresos = totalIngresos > 0 ? Math.round((totalGastos / totalIngresos) * 100) : null;

  const veredicto = (() => {
    if (totalIngresos === 0 && totalGastos === 0) return 'Sin movimientos registrados en este período.';
    if (ratioGastosIngresos === null) {
      return `Gastos del mes: ${formatAmount(totalGastos, { decimals: 0 })}, sin ingresos registrados todavía.`;
    }
    if (ratioGastosIngresos > 100) {
      return `El mes viene ajustado: los gastos consumen el ${ratioGastosIngresos}% de los ingresos.`;
    }
    if (ratioGastosIngresos >= 80) {
      return `Mes ajustado: los gastos representan el ${ratioGastosIngresos}% de los ingresos.`;
    }
    return `Balance controlado: los gastos representan el ${ratioGastosIngresos}% de los ingresos.`;
  })();

  // ── Saldo estimado (acumulado histórico) + equivalencia USD con la
  // cotización blue vigente del sistema ────────────────────────────────────
  const saldoEstimado = transactions.reduce((sum, t) => {
    const monto = getTransactionAmount(t);
    return sum + (t.tipo === 'ingreso' ? monto : -monto);
  }, 0);
  const blueQuote = Array.isArray(dollarQuotes) ? dollarQuotes.find((q) => q.casa === 'blue') : null;
  const usdRate = blueQuote?.venta ? parseFloat(blueQuote.venta) : null;
  const usdEquivalent = usdRate
    ? `≈ USD ${Math.round(saldoEstimado / usdRate).toLocaleString('es-AR')}`
    : '≈ USD —';

  const kpis = [
    {
      key: 'ingresos',
      label: 'Ingresos',
      borderColor: '#5a7d52',
      valueColor: '#476442',
      value: formatAmount(totalIngresos, { decimals: 0 }),
      subtext: `${ingresosDelMes.length} entrada${ingresosDelMes.length === 1 ? '' : 's'}`,
    },
    {
      key: 'gastos',
      label: 'Gastos',
      borderColor: '#b35a42',
      valueColor: '#a04a34',
      value: formatAmount(totalGastos, { decimals: 0 }),
      subtext: `${gastosDelMes.length} movimiento${gastosDelMes.length === 1 ? '' : 's'}`,
    },
    {
      key: 'resultado',
      label: 'Resultado del mes',
      borderColor: '#3d5a80',
      valueColor: resultadoMes >= 0 ? '#476442' : '#a04a34',
      value: resultadoMes < 0
        ? `− ${formatAmount(Math.abs(resultadoMes), { decimals: 0 })}`
        : formatAmount(resultadoMes, { decimals: 0 }),
      subtext: resultadoMes < 0
        ? `gastos ${ratioGastosIngresos}% de ingresos`
        : `${movimientosDelMes.length} movimiento${movimientosDelMes.length === 1 ? '' : 's'} en el mes`,
    },
  ];

  // ── Movimientos recientes (últimos 5; `transactions` ya viene ordenado
  // desc por fecha desde ModernMissionControl) ─────────────────────────────
  const movimientosRecientes = transactions.slice(0, 5).map((t) => {
    const fecha = getTransactionDate(t);
    const esIngreso = t.tipo === 'ingreso';
    return {
      id: t.id ?? t.Id,
      fechaMMDD: fecha
        ? `${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
        : '—',
      descripcion: t.descripcion || 'Sin descripción',
      categoria: t.categoria || 'Sin categoría',
      esIngreso,
      montoFormatted: `${esIngreso ? '+' : '−'} ${formatAmount(getTransactionAmount(t), { decimals: 0 })}`,
    };
  });

  // ── Gastos por categoría (barra apilada) ─────────────────────────────────
  const categoriaTotales = {};
  gastosDelMes.forEach((t) => {
    const nombre = t.categoria || 'Sin categoría';
    categoriaTotales[nombre] = (categoriaTotales[nombre] || 0) + getTransactionAmount(t);
  });
  const totalGastosCategorias = Object.values(categoriaTotales).reduce((a, b) => a + b, 0);
  const categoriasOrdenadas = Object.entries(categoriaTotales)
    .sort((a, b) => b[1] - a[1])
    .map(([nombre, monto], index) => ({
      nombre,
      monto,
      pct: totalGastosCategorias > 0 ? Math.round((monto / totalGastosCategorias) * 100) : 0,
      color: getCategoryColor(index),
    }));

  // ── Aviso vencimientos ────────────────────────────────────────────────────
  const pendientesActivos = pendingPayments
    .map((p) => {
      const estado = (p.estado ?? p.Estado ?? 'pendiente').toString().toLowerCase();
      const fechaVencimiento = p.fecha_vencimiento ?? p.FechaVencimiento ?? p.fechavencimiento ?? p.Fechavencimiento ?? null;
      return {
        id: p.id ?? p.Id,
        nombre: p.nombre || p.Nombre || p.descripcion || p.Descripcion || 'Sin nombre',
        monto: parseFloat(p.monto ?? p.Monto ?? 0),
        fechaVencimiento,
        pagado: estado === 'pagado' || estado === 'true' || p.pagada === true,
      };
    })
    .filter((p) => !p.pagado);

  const totalPendiente = pendientesActivos.reduce((sum, p) => sum + p.monto, 0);

  const proximoVencimiento = pendientesActivos
    .filter((p) => p.fechaVencimiento && p.fechaVencimiento !== 'a confirmar')
    .map((p) => ({ ...p, fechaObj: new Date(p.fechaVencimiento) }))
    .filter((p) => !Number.isNaN(p.fechaObj.getTime()))
    .sort((a, b) => a.fechaObj - b.fechaObj)[0];

  const proximoVencimientoLabel = proximoVencimiento
    ? proximoVencimiento.fechaObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
    : null;

  return {
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
  };
}

export default useDashboardHomeData;
