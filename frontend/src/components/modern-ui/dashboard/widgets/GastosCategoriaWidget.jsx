import React from 'react';
import PropTypes from 'prop-types';
import { TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/**
 * GastosCategoriaWidget - Widget con gráfico de dona
 */
const GastosCategoriaWidget = ({ categorias = [], total = 0, onNavigate }) => {
  const defaultCategorias = [
    { name: 'Vivienda', value: 40, color: '#a78bfa', monto: 218000 },
    { name: 'Alimentos', value: 20, color: '#10b981', monto: 109000 },
    { name: 'Ocio', value: 15, color: '#34d399', monto: 81750 },
    { name: 'Otros', value: 25, color: '#4a5568', monto: 136250 }
  ];

  const data = categorias.length > 0 ? categorias : defaultCategorias;
  
  // Formatear total
  const totalFormatted = total > 0 
    ? (total >= 1000 
        ? `$${(total / 1000).toFixed(0)}k` 
        : `$${total.toFixed(0)}`)
    : (categorias.length > 0 ? '$0' : '$545k');

  return (
    <div className="bg-[#18181b] rounded-3xl p-5 border border-white/5 relative">
      <h2 className="text-base font-semibold text-white mb-4">
        Gastos por Categoría
      </h2>

      {/* Gráfico + Leyenda en fila */}
      <div className="flex items-center gap-4">
        {/* Gráfico de Dona */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Total en el centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-white">{totalFormatted}</p>
          </div>
        </div>

        {/* Leyenda a la derecha */}
        <div className="flex-1 space-y-2">
          {data.map((cat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs text-gray-400">
                  {cat.name}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {cat.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

GastosCategoriaWidget.propTypes = {
  categorias: PropTypes.array,
  total: PropTypes.number,
  onNavigate: PropTypes.func,
};

export default GastosCategoriaWidget;
