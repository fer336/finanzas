import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Tag, TrendingDown, TrendingUp } from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

const CHART_COLORS = [
  '#4338CA', '#4F46E5', '#6366F1', '#7C3AED', '#8B5CF6',
  '#2563EB', '#3B82F6', '#6366F1', '#1E40AF', '#5B21B6'
];

export const CategoriesChart = ({ transactions = [], selectedMonth }) => {
  const { formatAmount } = useAmountVisibility();

  const formatCurrency = (amount) => {
    return formatAmount(amount, { decimals: 0 });
  };

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return { pieData: [], barData: [], totalGastos: 0, totalIngresos: 0 };

    // Filtrar por mes seleccionado
    const [selectedYear, selectedMonthNum] = selectedMonth ? selectedMonth.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

    const filteredTransactions = transactions.filter(t => {
      const fecha = t.FechaTransaccion || t.fecha_transaccion || t.fecha;
      if (!fecha) return false;
      const transDate = new Date(fecha);
      return transDate.getFullYear() === selectedYear && transDate.getMonth() + 1 === selectedMonthNum;
    });

    const categoryMap = {};
    let totalGastos = 0;
    let totalIngresos = 0;

    filteredTransactions.forEach(transaction => {
      const tipo = (transaction.Tipo || transaction.tipo || '').toLowerCase();
      const monto = Math.abs(transaction.Monto || transaction.monto || 0);
      const categoria = transaction.categorias1 || transaction.Categorias || transaction.categoria;
      const categoriaNombre = categoria?.Nombre || categoria?.nombre || 'Sin Categoría';

      if (tipo === 'gasto') {
        totalGastos += monto;
        if (!categoryMap[categoriaNombre]) {
          categoryMap[categoriaNombre] = { gastos: 0, ingresos: 0, transactions: 0 };
        }
        categoryMap[categoriaNombre].gastos += monto;
        categoryMap[categoriaNombre].transactions++;
      } else if (tipo === 'ingreso') {
        totalIngresos += monto;
      }
    });

    // Convertir a array y ordenar
    const pieData = Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        value: data.gastos,
        transactions: data.transactions,
        percentage: 0
      }))
      .sort((a, b) => b.value - a.value);

    // Calcular porcentajes
    pieData.forEach(item => {
      item.percentage = totalGastos > 0 ? (item.value / totalGastos * 100) : 0;
    });

    // Top 10 para el bar chart
    const barData = pieData.slice(0, 10);

    return { pieData, barData, totalGastos, totalIngresos };
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

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null; // No mostrar label si es menor al 5%

    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!transactions || transactions.length === 0 || chartData.pieData.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Tag className="w-6 h-6 text-[#059467]" />
          <h3 className="text-white text-xl font-bold">Gastos por Categoría</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
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
            <Tag className="w-6 h-6 text-[#4338CA]" />
          </div>
          <div>
            <h3 className="text-[#0F172A] dark:text-[#F8FAFC] text-xl font-semibold">Gastos por Categoría</h3>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">Distribución del gasto mensual</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-[#7C3AED]" />
            <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">Total Gastos</p>
          </div>
          <p className="text-[#0F172A] dark:text-[#F8FAFC] text-2xl font-bold">{formatCurrency(chartData.totalGastos)}</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="w-4 h-4 text-[#4338CA]" />
            <p className="text-[#64748B] dark:text-[#94A3B8] text-xs">Ingresos: {formatCurrency(chartData.totalIngresos)}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <h4 className="text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold mb-3">Proporción del Gasto</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomPieLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Top 10 */}
        <div>
          <h4 className="text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold mb-3">Top 10 Categorías</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.barData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis
                type="number"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {chartData.barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category List */}
      <div className="mt-6">
        <h4 className="text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold mb-3">Detalle de Categorías</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto scrollbar-hide">
          {chartData.pieData.map((category, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-[#1a2332] rounded-lg p-2 border-l-2 flex items-center justify-between"
              style={{ borderLeftColor: CHART_COLORS[index % CHART_COLORS.length] }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[#0F172A] dark:text-[#F8FAFC] text-sm font-medium truncate">{category.name}</p>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-xs">{category.transactions} trans.</p>
              </div>
              <div className="text-right ml-2">
                <p className="text-[#0F172A] dark:text-[#F8FAFC] text-sm font-bold">{category.percentage.toFixed(0)}%</p>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-xs">{formatCurrency(category.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
