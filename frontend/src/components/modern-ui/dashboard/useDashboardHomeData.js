import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

/**
 * Derivación de datos para la vista "Inicio" (tema Kanagawa), compartida entre
 * ModernDashboard (desktop) y MobileDashboardHome (mobile) — ver
 * design_handoff_rediseno_papel/README.md sección "2. Inicio (dashboard)".
 *
 * Es presentación pura: no hace fetch, solo agrupa/formatea lo que ya llega
 * en `transactions` / `pendingPayments` / `dollarQuotes` (hooks de
 * useFinancialData.js, sin tocar).
 */

const CATEGORY_PALETTE = ['var(--destructive)', 'var(--warning)', 'var(--success)', 'var(--info)', 'var(--violet)', 'var(--muted-foreground)'];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function getCategoryColor(index) {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
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

function getPrestamoDate(p) {
  const raw = p.fecha_vencimiento || p.FechaVencimiento || p.fechavencimiento || p.Fechavencimiento;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mesActualStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function useDashboardHomeData({
  transactions = [],
  pendingPayments = [],
  prestamos = [],
  dollarQuotes,
  balanceNeto: balanceNetoOverride = null,
  balanceDisponible: balanceDisponibleOverride = null,
  apartadoObjetivos: apartadoObjetivosOverride = null,
  mes = mesActualStr(),
}) {
  const { formatAmount } = useAmountVisibility();

  // ── Período: mes seleccionado por el usuario en Inicio (selector de mes,
  // default: mes calendario actual) ─────────────────────────────────────────
  const [anioStr, mesStr] = mes.split('-');
  const currentYear = parseInt(anioStr, 10);
  const currentMonth = parseInt(mesStr, 10) - 1;
  const periodoLabel = mes;
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

  // ── Balance neto: dinero real que debería tener, mes a mes (ancla de
  // balance-inicial + ingresos - gastos desde ahí, calculado en el backend
  // vía /api/v1/balance-inicial/neto). Mientras esa consulta resuelve o si
  // falla, se usa como fallback la suma naive de lo ya cargado en memoria
  // (no contempla balance inicial, pero evita una pantalla vacía) ──────────
  const saldoEstimadoFallback = transactions.reduce((sum, t) => {
    const monto = getTransactionAmount(t);
    return sum + (t.tipo === 'ingreso' ? monto : -monto);
  }, 0);
  const balanceNeto = typeof balanceNetoOverride === 'number' ? balanceNetoOverride : saldoEstimadoFallback;
  // Apartado en objetivos: plata ya asignada a un objetivo de ahorro (no
  // generó un gasto real, pero tampoco está disponible para gastar) — ver
  // GET /balance-inicial/neto → apartado_objetivos / balance_disponible.
  const apartadoObjetivos = typeof apartadoObjetivosOverride === 'number' ? apartadoObjetivosOverride : 0;
  const balanceDisponible = typeof balanceDisponibleOverride === 'number'
    ? balanceDisponibleOverride
    : balanceNeto - apartadoObjetivos;
  const blueQuote = Array.isArray(dollarQuotes) ? dollarQuotes.find((q) => q.casa === 'blue') : null;
  const usdRate = blueQuote?.venta ? parseFloat(blueQuote.venta) : null;
  const usdEquivalent = usdRate
    ? `≈ USD ${Math.round(balanceDisponible / usdRate).toLocaleString('es-AR')}`
    : '≈ USD —';

  const kpis = [
    {
      key: 'ingresos',
      label: 'Ingresos',
      borderColor: 'var(--success)',
      valueColor: 'var(--success)',
      value: formatAmount(totalIngresos, { decimals: 0 }),
      subtext: `${ingresosDelMes.length} entrada${ingresosDelMes.length === 1 ? '' : 's'}`,
    },
    {
      key: 'gastos',
      label: 'Gastos',
      borderColor: 'var(--destructive)',
      valueColor: 'var(--destructive)',
      value: formatAmount(totalGastos, { decimals: 0 }),
      subtext: `${gastosDelMes.length} movimiento${gastosDelMes.length === 1 ? '' : 's'}`,
    },
    {
      key: 'resultado',
      label: 'Resultado del mes',
      borderColor: 'var(--info)',
      valueColor: resultadoMes >= 0 ? 'var(--success)' : 'var(--destructive)',
      value: resultadoMes < 0
        ? `− ${formatAmount(Math.abs(resultadoMes), { decimals: 0 })}`
        : formatAmount(resultadoMes, { decimals: 0 }),
      subtext: resultadoMes < 0
        ? `gastos ${ratioGastosIngresos}% de ingresos`
        : `${movimientosDelMes.length} movimiento${movimientosDelMes.length === 1 ? '' : 's'} en el mes`,
    },
  ];

  // ── Movimientos recientes (últimos 5 DEL MES seleccionado; `transactions`
  // ya viene ordenado desc por fecha desde ModernMissionControl) ───────────
  const movimientosRecientes = movimientosDelMes.slice(0, 5).map((t) => {
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

  // ── Gastos e ingresos por categoría (donut) ───────────────────────────────
  function agruparPorCategoria(movimientos) {
    const totales = {};
    movimientos.forEach((t) => {
      const nombre = t.categoria || 'Sin categoría';
      totales[nombre] = (totales[nombre] || 0) + getTransactionAmount(t);
    });
    const total = Object.values(totales).reduce((a, b) => a + b, 0);
    return Object.entries(totales)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, monto], index) => ({
        nombre,
        monto,
        pct: total > 0 ? Math.round((monto / total) * 100) : 0,
        color: getCategoryColor(index),
      }));
  }

  const categoriasOrdenadas = agruparPorCategoria(gastosDelMes);
  const categoriasIngresosOrdenadas = agruparPorCategoria(ingresosDelMes);

  // ── Evolución mensual (últimos 6 meses, ingresos vs gastos) ──────────────
  const evolucionMensual = (() => {
    const meses = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(currentYear, currentMonth - i, 1);
      meses.push({ year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()].slice(0, 3) });
    }
    return meses.map(({ year, month, label }) => {
      const delMes = transactions.filter((t) => {
        const fecha = getTransactionDate(t);
        return fecha && fecha.getMonth() === month && fecha.getFullYear() === year;
      });
      const ingresos = delMes.filter((t) => t.tipo === 'ingreso').reduce((sum, t) => sum + getTransactionAmount(t), 0);
      const gastos = delMes.filter((t) => t.tipo === 'gasto').reduce((sum, t) => sum + getTransactionAmount(t), 0);
      return { mes: label, ingresos, gastos };
    });
  })();

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

  // ── Aviso préstamos ───────────────────────────────────────────────────────
  const prestamosActivos = prestamos
    .map((p) => {
      const estado = (p.estado ?? p.Estado ?? 'pendiente').toString().toLowerCase();
      const fechaObj = getPrestamoDate(p);
      return {
        id: p.id ?? p.Id,
        nombre: p.nombre_fuente || p.NombreFuente || p.fuente || 'Sin nombre',
        montoPrestado: parseFloat(p.monto_prestado ?? p.MontoPrestado ?? 0),
        montoADevolver: parseFloat(p.monto_a_devolver ?? p.MontoADevolver ?? p.monto_prestado ?? p.MontoPrestado ?? 0),
        fechaVencimiento: p.fecha_vencimiento || p.FechaVencimiento || p.fechavencimiento || p.Fechavencimiento || null,
        fechaObj,
        pagado: estado === 'pagado' || estado === 'true' || p.pagado === true,
      };
    })
    .filter((p) => !p.pagado);

  const totalPrestamosADevolver = prestamosActivos.reduce((sum, p) => sum + p.montoADevolver, 0);

  const proximoPrestamo = prestamosActivos
    .filter((p) => p.fechaObj)
    .sort((a, b) => a.fechaObj - b.fechaObj)[0];

  const proximoPrestamoLabel = proximoPrestamo
    ? proximoPrestamo.fechaObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
    : null;

  return {
    formatAmount,
    periodoLabel,
    tituloMes,
    veredicto,
    balanceNeto,
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
  };
}

export default useDashboardHomeData;
