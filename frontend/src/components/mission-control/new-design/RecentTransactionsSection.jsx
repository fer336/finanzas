import React from 'react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const RecentTransactionsSection = ({ data, selectedMonth, onViewAll, onTransactionClick }) => {
  const { formatAmount } = useAmountVisibility();

  if (!data) return null;

  // Calcular transacciones del mes actual
  const calculateTransactions = () => {
    const currentTransactions = data.transacciones || [];

    // Ordenar por fecha y tomar la última
    const sorted = [...currentTransactions].sort((a, b) => {
      const dateA = new Date(a.FechaTransaccion || a.fecha_transaccion || a.fecha);
      const dateB = new Date(b.FechaTransaccion || b.fecha_transaccion || b.fecha);
      return dateB - dateA;
    });

    const lastTransaction = sorted[0];

    const getTipo = (t) => (t.Tipo || t.tipo || '').toLowerCase();
    const getMonto = (t) => Math.abs(parseFloat(t.Monto || t.monto || 0));

    const ingresos = currentTransactions
      .filter(t => getTipo(t) === 'ingreso')
      .reduce((sum, t) => sum + getMonto(t), 0);

    const gastos = currentTransactions
      .filter(t => getTipo(t) === 'gasto')
      .reduce((sum, t) => sum + getMonto(t), 0);

    const totalMes = ingresos - gastos;

    // Calcular hace cuánto fue la última transacción
    let lastTransactionText = 'Sin transacciones';
    if (lastTransaction) {
      const lastDate = new Date(lastTransaction.FechaTransaccion || lastTransaction.fecha_transaccion || lastTransaction.fecha);
      const today = new Date();
      const diffTime = Math.abs(today - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) lastTransactionText = 'hace hoy';
      else if (diffDays === 1) lastTransactionText = 'hace 1 día';
      else lastTransactionText = `hace ${diffDays} días`;
    }

    return {
      lastTransaction,
      lastTransactionText,
      ingresos,
      gastos,
      totalMes
    };
  };

  const stats = calculateTransactions();

  const formatCurrency = (amount) => {
    return formatAmount(amount, { decimals: 2 });
  };

  // Preparar datos para gráficos
  const prepareChartData = () => {
    const currentTransactions = data.transacciones || [];
    
    // Agrupar por día (últimos 7 días)
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      
      const dayTransactions = currentTransactions.filter(t => {
        const tDate = new Date(t.FechaTransaccion || t.fecha_transaccion || t.fecha);
        return tDate.toDateString() === date.toDateString();
      });
      
      const getTipo = (t) => (t.Tipo || t.tipo || '').toLowerCase();
      const getMonto = (t) => Math.abs(parseFloat(t.Monto || t.monto || 0));
      
      const ingresos = dayTransactions
        .filter(t => getTipo(t) === 'ingreso')
        .reduce((sum, t) => sum + getMonto(t), 0);
      
      const gastos = dayTransactions
        .filter(t => getTipo(t) === 'gasto')
        .reduce((sum, t) => sum + getMonto(t), 0);
      
      last7Days.push({
        date: dateStr,
        ingresos: Math.round(ingresos),
        gastos: Math.round(gastos),
        balance: Math.round(ingresos - gastos)
      });
    }
    
    return last7Days;
  };

  const chartData = prepareChartData();

  return (
    <div className="glass-panel flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
          Transacciones Recientes
          {(data.transacciones?.length || 0) > 0 && <span className="text-muted-foreground text-sm font-normal">({data.transacciones.length})</span>}
        </h3>
        <button
          onClick={onViewAll}
          className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors cursor-pointer"
        >
          Ver más
        </button>
      </div>
      <div className="flex flex-col-reverse md:flex-row flex-1">
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-sm mb-4">
              <p className="text-muted-foreground">Última transacción</p>
              <p className="text-white font-medium bg-white/5 px-2 py-1 rounded text-xs">{stats.lastTransactionText}</p>
            </div>
            {stats.lastTransaction && (
              <div
                onClick={() => onTransactionClick && onTransactionClick(stats.lastTransaction)}
                className="group flex justify-between items-center text-sm mb-6 cursor-pointer bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all border border-white/5 hover:border-white/10"
              >
                <div className="flex flex-col">
                  <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                    {stats.lastTransaction.Descripcion || stats.lastTransaction.descripcion || 'Sin descripción'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(stats.lastTransaction.FechaTransaccion || stats.lastTransaction.fecha_transaccion).toLocaleDateString()}
                  </p>
                </div>
                <p className={`font-bold text-lg ${(stats.lastTransaction.Tipo || stats.lastTransaction.tipo || '').toLowerCase() === 'ingreso'
                    ? 'text-emerald-400'
                    : 'text-red-400'
                  }`}>
                  {(stats.lastTransaction.Tipo || stats.lastTransaction.tipo || '').toLowerCase() === 'ingreso' ? '+' : '-'}
                  {formatCurrency(Math.abs(stats.lastTransaction.Monto || stats.lastTransaction.monto || 0))}
                </p>
              </div>
            )}
            <div className="flex justify-between items-center text-sm mb-2">
              <p className="text-muted-foreground">Balance mensual</p>
              <p className={`font-bold text-lg ${stats.totalMes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(stats.totalMes)}
              </p>
            </div>
          </div>

          <button
            onClick={onViewAll}
            className="w-full mt-4 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl text-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
          >
            Ver historial completo
          </button>
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col gap-4 border-l border-white/5 bg-black/20">
          {/* Gráfico de Balance (Líneas) */}
          <div className="h-48">
            <p className="text-xs text-zinc-400 mb-2 font-medium">Balance Últimos 7 Días</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Ingresos vs Gastos (Barras) */}
          <div className="h-48">
            <p className="text-xs text-zinc-400 mb-2 font-medium">Ingresos vs Gastos</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

