import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CreditCard, Wallet, DollarSign } from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

const COLORS = ['#4338CA', '#4F46E5', '#6366F1', '#7C3AED', '#8B5CF6', '#2563EB', '#3B82F6'];

export const PaymentMethodsChart = ({ transactions = [], selectedMonth }) => {
  const { formatAmount } = useAmountVisibility();

  const formatCurrency = (amount) => {
    return formatAmount(amount, { decimals: 0 });
  };

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return { pieData: [], barData: [], total: 0 };

    // Filtrar por mes seleccionado y solo gastos
    const [selectedYear, selectedMonthNum] = selectedMonth ? selectedMonth.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

    const filteredTransactions = transactions.filter(t => {
      const fecha = t.FechaTransaccion || t.fecha_transaccion || t.fecha;
      if (!fecha) return false;
      const transDate = new Date(fecha);
      const tipo = (t.Tipo || t.tipo || '').toLowerCase();
      return transDate.getFullYear() === selectedYear &&
             transDate.getMonth() + 1 === selectedMonthNum &&
             tipo === 'gasto';
    });

    const methodMap = {};
    let total = 0;

    filteredTransactions.forEach(transaction => {
      const monto = Math.abs(transaction.Monto || transaction.monto || 0);
      const metodo = transaction.metodos_pago1 || transaction.MetodosPago || transaction.metodo_pago;
      const metodoNombre = metodo?.Nombre || metodo?.nombre || 'Efectivo';

      total += monto;
      if (!methodMap[metodoNombre]) {
        methodMap[metodoNombre] = { amount: 0, transactions: 0 };
      }
      methodMap[metodoNombre].amount += monto;
      methodMap[metodoNombre].transactions++;
    });

    const pieData = Object.entries(methodMap)
      .map(([name, data]) => ({
        name,
        value: data.amount,
        transactions: data.transactions,
        percentage: total > 0 ? (data.amount / total * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);

    return { pieData, barData: pieData, total };
  }, [transactions, selectedMonth]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-1">{data.name}</p>
        <p className="text-gray-300 text-sm mb-1">
          {data.transactions} transaccion{data.transactions !== 1 ? 'es' : ''}
        </p>
        <p className="text-white font-bold text-lg">
          {formatCurrency(data.value)}
        </p>
        <p className="text-gray-400 text-sm">
          {data.percentage?.toFixed(1)}% del total
        </p>
      </div>
    );
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const getMethodIcon = (methodName) => {
    const name = methodName.toLowerCase();
    if (name.includes('tarjeta') || name.includes('crédito') || name.includes('débito')) {
      return <CreditCard className="w-5 h-5" />;
    } else if (name.includes('efectivo') || name.includes('cash')) {
      return <DollarSign className="w-5 h-5" />;
    }
    return <Wallet className="w-5 h-5" />;
  };

  if (!transactions || transactions.length === 0 || chartData.pieData.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-6 h-6 text-[#059467]" />
          <h3 className="text-white text-xl font-bold">Métodos de Pago</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay transacciones este mes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#171E2F] border border-[#E2E8F0] dark:border-[#2E3A59] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#4338CA]/10 rounded-xl">
            <Wallet className="w-6 h-6 text-[#4338CA]" />
          </div>
          <div>
            <h3 className="text-[#0F172A] dark:text-[#F8FAFC] text-xl font-semibold">Métodos de Pago</h3>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">Análisis de uso mensual</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">Total Gastado</p>
          <p className="text-[#0F172A] dark:text-[#F8FAFC] text-2xl font-bold">{formatCurrency(chartData.total)}</p>
          <p className="text-[#64748B] dark:text-[#94A3B8] text-xs">{chartData.pieData.length} métodos usados</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div>
          <h4 className="text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold mb-3">Distribución de Uso</h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomPieLabel}
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold mb-3">Comparación por Monto</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData.barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Methods List */}
      <div className="mt-6">
        <h4 className="text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold mb-3">Detalle por Método</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {chartData.pieData.map((method, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-[#1a2332] rounded-lg p-4 border-l-4 flex items-center gap-3"
              style={{ borderLeftColor: COLORS[index % COLORS.length] }}
            >
              <div
                className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
              >
                <div style={{ color: COLORS[index % COLORS.length] }}>
                  {getMethodIcon(method.name)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0F172A] dark:text-[#F8FAFC] font-semibold truncate">{method.name}</p>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">{method.transactions} transacciones</p>
              </div>
              <div className="text-right">
                <p className="text-[#0F172A] dark:text-[#F8FAFC] font-bold">{method.percentage.toFixed(0)}%</p>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">{formatCurrency(method.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
