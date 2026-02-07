import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

export const ExpensesBreakdownChart = ({ data, selectedMonth }) => {
  const { formatAmount } = useAmountVisibility();

  if (!data) return null;

  // Calcular gastos por categoría del mes actual
  const calculateCategoryBreakdown = () => {
    const currentTransactions = data.transacciones || [];
    const categorias = data.categorias || [];

    const getTipo = (t) => (t.Tipo || t.tipo || '').toLowerCase();
    const getMonto = (t) => Math.abs(parseFloat(t.Monto || t.monto || 0));
    const getCategoriaId = (t) => t.categoria_id || t.categorias_id || t.CategoriaId;

    // Filtrar solo gastos
    const gastos = currentTransactions.filter(t => getTipo(t) === 'gasto');

    // Agrupar por categoría
    const categoryTotals = {};
    gastos.forEach(t => {
      const catId = getCategoriaId(t);
      if (!catId) return;

      if (!categoryTotals[catId]) {
        categoryTotals[catId] = 0;
      }
      categoryTotals[catId] += getMonto(t);
    });

    // Convertir a array y ordenar
    const breakdown = Object.entries(categoryTotals)
      .map(([catId, total]) => {
        const categoria = categorias.find(c => (c.id || c.Id) === catId);
        return {
          id: catId,
          nombre: categoria?.Nombre || categoria?.nombre || 'Sin categoría',
          total,
          color: categoria?.Color || categoria?.color || '#6B7280'
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 4); // Top 4 categorías

    const totalGastos = breakdown.reduce((sum, cat) => sum + cat.total, 0);

    return { breakdown, totalGastos };
  };

  const { breakdown, totalGastos } = calculateCategoryBreakdown();

  // Colores predefinidos si no hay suficientes categorías
  const defaultColors = ['#60a5fa', '#34d399', '#f59e0b', '#f472b6'];

  // Calcular ángulos para el gráfico de dona
  let currentOffset = 0;
  const segments = breakdown.map((cat, index) => {
    const percentage = totalGastos > 0 ? (cat.total / totalGastos) * 100 : 0;
    const dashArray = `${percentage}, 100`;
    const color = cat.color || defaultColors[index % defaultColors.length];
    const offset = currentOffset;
    currentOffset -= percentage;

    return { ...cat, percentage, dashArray, color, offset };
  });

  const formatCurrency = (amount) => {
    return formatAmount(amount, { decimals: 0 });
  };

  return (
    <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-white font-bold text-lg">Desglose de Gastos</p>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex justify-center items-center my-4 min-h-[180px] relative">
        {/* Glow effect behind the chart */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>

        <div className="relative w-48 h-48 z-10">
          <svg className="w-full h-full -rotate-90 drop-shadow-lg" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="3.8"
            />
            {segments.map((segment, index) => (
              <path
                key={index}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={segment.color}
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.offset}
                strokeWidth="3.8"
                className="transition-all duration-500 hover:stroke-width-[4.5] cursor-pointer"
                style={{ filter: `drop-shadow(0 0 2px ${segment.color}80)` }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Total</span>
            <span className="text-white text-2xl font-bold tracking-tight">{formatCurrency(totalGastos)}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2 group cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: segment.color, boxShadow: `0 0 8px ${segment.color}60` }}
            ></div>
            <p className="text-sm text-muted-foreground group-hover:text-white transition-colors truncate font-medium" title={segment.nombre}>
              {segment.nombre}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};


