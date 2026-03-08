import React from 'react';
import PropTypes from 'prop-types';
import { Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/**
 * MetodosPagoWidget - Widget de estadísticas de métodos de pago
 */
const MetodosPagoWidget = ({ metodosPago = [], onClick }) => {
  // Si no hay datos, usar ejemplo
  const defaultData = [
    { name: 'Débito', value: 45, color: '#10b981' },
    { name: 'Crédito', value: 30, color: '#3b82f6' },
    { name: 'Efectivo', value: 15, color: '#fbbf24' },
    { name: 'Transferencia', value: 10, color: '#a855f7' }
  ];

  const data = metodosPago.length > 0 ? metodosPago : defaultData;

  return (
    <div 
      className="bg-[#18181b] rounded-3xl p-5 border border-white/5 cursor-pointer hover:border-white/10 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-white">
            Métodos de Pago
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Gráfico de Dona */}
        <div className="w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={48}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda */}
        <div className="flex-1 space-y-2">
          {data.slice(0, 4).map((metodo, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: metodo.color }}
                />
                <span className="text-xs text-gray-400 truncate">
                  {metodo.name}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {metodo.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

MetodosPagoWidget.propTypes = {
  metodosPago: PropTypes.array,
  onClick: PropTypes.func,
};

export default MetodosPagoWidget;
