import React from 'react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

export const PendingPaymentsSection = ({ data, selectedMonth, onPayClick, onViewAll, onAddClick }) => {
  const { formatAmount } = useAmountVisibility();

  if (!data) return null;

  // Calcular pagos pendientes del mes actual
  const calculatePendingPayments = () => {
    const allPayments = data.pagos || [];
    /* eslint-disable no-unused-vars */
    // const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
    /* eslint-enable no-unused-vars */

    const pendingPayments = allPayments.filter(p => {
      const estado = (p.Estado || p.estado || '').toString().toLowerCase();
      const isPaid = estado === 'pagado' || estado === 'true' || p.pagada === true || p.Pagada === true;
      if (isPaid) return false;

      // Mostrar todos los pagos pendientes, independientemente del mes
      return true;
    });

    // Encontrar el próximo a vencer
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDue = pendingPayments
      .map(p => {
        const fechaVencimiento = new Date(p.Fechavencimiento || p.fechavencimiento || p.FechaVencimiento || p.fecha_vencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        const diffTime = fechaVencimiento - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...p, daysUntilDue: diffDays };
      })
      .filter(p => p.daysUntilDue >= 0)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)[0];

    const totalPending = pendingPayments.reduce((sum, p) =>
      sum + parseFloat(p.Monto || p.monto || 0), 0
    );

    // Calcular porcentajes para el gráfico (próximo vs resto)
    const nextAmount = nextDue ? parseFloat(nextDue.Monto || nextDue.monto || 0) : 0;
    // const restAmount = totalPending - nextAmount;
    const nextPercentage = totalPending > 0 ? (nextAmount / totalPending) * 100 : 0;
    const restPercentage = 100 - nextPercentage;

    return {
      pendingPayments,
      nextDue,
      totalPending,
      nextPercentage,
      restPercentage,
      count: pendingPayments.length
    };
  };

  const stats = calculatePendingPayments();

  const formatCurrency = (amount) => {
    return formatAmount(amount, { decimals: 2 });
  };

  return (
    <div className="glass-panel flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-1 h-6 bg-red-500 rounded-full"></span>
          Pagos Pendientes {stats.count > 0 && <span className="text-muted-foreground text-sm font-normal">({stats.count})</span>}
        </h3>
        <button
          onClick={onViewAll}
          className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors cursor-pointer"
        >
          Ver todo
        </button>
      </div>
      <div className="flex flex-col-reverse md:flex-row flex-1">
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            {stats.nextDue ? (
              <>
                <div className="flex justify-between items-center text-sm mb-4">
                  <p className="text-muted-foreground">Próximo a vencer</p>
                  <p className="text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded text-xs">
                    {stats.nextDue.daysUntilDue === 0 ? 'Hoy' :
                      stats.nextDue.daysUntilDue === 1 ? 'Mañana' :
                        `En ${stats.nextDue.daysUntilDue} días`}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-white text-lg">
                      {stats.nextDue.Nombre || stats.nextDue.nombre || 'Sin nombre'}
                    </p>
                  </div>
                  <p className="font-bold text-2xl text-red-400">
                    {formatCurrency(stats.nextDue.Monto || stats.nextDue.monto || 0)}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-sm mb-6 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-emerald-400 font-medium">¡Al día! No hay pagos próximos</p>
              </div>
            )}
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground">Total Pendiente</p>
              <p className="text-red-400 font-bold text-lg">{formatCurrency(stats.totalPending)}</p>
            </div>
          </div>

          <button
            onClick={() => stats.nextDue && onPayClick && onPayClick(stats.nextDue)}
            disabled={!stats.nextDue}
            className={`w-full mt-4 px-4 py-3 text-sm font-bold text-white rounded-xl text-center transition-colors shadow-lg ${stats.nextDue
              ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 cursor-pointer'
              : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}
          >
            {stats.nextDue ? 'Pagar ahora' : 'Nada pendiente'}
          </button>
        </div>

        <div className="w-full md:w-1/2 p-6 flex items-center justify-center border-l border-white/5 bg-black/20">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90 drop-shadow-lg" viewBox="0 0 36 36">
              {/* Próximo pago (rojo) */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#ef4444"
                strokeDasharray={`${stats.nextPercentage}, 100`}
                strokeWidth="3"
                className="transition-all duration-1000 ease-out"
                style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.5))' }}
              />
              {/* Resto (amarillo) */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f59e0b"
                strokeDasharray={`${stats.restPercentage}, 100`}
                strokeDashoffset={`-${stats.nextPercentage}`}
                strokeWidth="3"
                className="transition-all duration-1000 ease-out delay-300"
                style={{ opacity: stats.restPercentage > 0 ? 1 : 0 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Total</p>
              <p className="text-red-400 font-bold text-2xl tracking-tight">{formatCurrency(stats.totalPending)}</p>
              <p className="text-muted-foreground text-xs mt-1 bg-white/5 px-2 py-0.5 rounded-full">{stats.count} {stats.count === 1 ? 'factura' : 'facturas'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

