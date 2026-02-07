import React from 'react';

export const IncomeExpensesChart = ({ data, selectedMonth }) => {
  if (!data) return null;

  // Calcular datos de los últimos 6 meses
  const calculateLast6Months = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const months = [];

    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;

      if (m <= 0) {
        m += 12;
        y -= 1;
      }

      months.push({
        year: y,
        month: m,
        name: new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'short' })
      });
    }

    return months.map(({ year, month, name }) => {
      const monthTransactions = data.transacciones?.filter(t => {
        const fecha = new Date(t.FechaTransaccion || t.fecha_transaccion || t.fecha);
        return fecha.getFullYear() === year && (fecha.getMonth() + 1) === month;
      }) || [];

      const getTipo = (t) => (t.Tipo || t.tipo || '').toLowerCase();
      const getMonto = (t) => Math.abs(parseFloat(t.Monto || t.monto || 0));

      const ingresos = monthTransactions
        .filter(t => getTipo(t) === 'ingreso')
        .reduce((sum, t) => sum + getMonto(t), 0);

      const gastos = monthTransactions
        .filter(t => getTipo(t) === 'gasto')
        .reduce((sum, t) => sum + getMonto(t), 0);

      return { name, ingresos, gastos };
    });
  };

  const monthsData = calculateLast6Months();

  // Encontrar el valor máximo para escalar las barras
  const maxValue = Math.max(
    ...monthsData.map(m => Math.max(m.ingresos, m.gastos))
  );

  const getHeight = (value) => {
    if (maxValue === 0) return '10%';
    return `${(value / maxValue) * 100}%`;
  };

  return (
    <div className="lg:col-span-3 glass-panel p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-bold text-lg">Comparativa de Ingresos y Gastos</p>
          <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
            <p className="text-sm text-muted-foreground">Ingresos</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
            <p className="text-sm text-muted-foreground">Gastos</p>
          </div>
        </div>
      </div>
      <div className="w-full h-64 mt-4">
        <div className="flex items-end w-full h-full gap-4 px-2 border-b border-white/5 pb-2">
          {monthsData.map((month, index) => (
            <div key={index} className="flex flex-col items-center flex-1 h-full group">
              <div className="flex items-end w-full h-full gap-2 relative">
                {/* Grid lines background effect could go here */}

                <div
                  className="w-full bg-emerald-500/20 border-t border-x border-emerald-500/30 rounded-t-sm transition-all duration-500 hover:bg-emerald-500/40 relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  style={{ height: getHeight(month.ingresos) }}
                  title={`Ingresos: $${month.ingresos.toFixed(2)}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent"></div>
                </div>
                <div
                  className="w-full bg-red-500/20 border-t border-x border-red-500/30 rounded-t-sm transition-all duration-500 hover:bg-red-500/40 relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  style={{ height: getHeight(month.gastos) }}
                  title={`Gastos: $${month.gastos.toFixed(2)}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent"></div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground font-medium uppercase tracking-wider group-hover:text-white transition-colors">{month.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


