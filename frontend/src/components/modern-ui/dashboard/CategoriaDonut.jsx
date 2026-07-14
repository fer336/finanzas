import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * CategoriaDonut — dona de recharts para "Gastos por categoría", tema
 * Papel. Compartida entre ModernDashboard (desktop) y MobileDashboardHome.
 */
const CategoriaDonut = ({ categorias, total, formatAmount, size = 120 }) => (
  <div className="relative mx-auto shrink-0" style={{ height: size, width: size }}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={categorias}
          cx="50%"
          cy="50%"
          innerRadius={size * 0.32}
          outerRadius={size * 0.47}
          paddingAngle={2}
          dataKey="monto"
          nameKey="nombre"
          startAngle={90}
          endAngle={450}
          stroke="none"
        >
          {categorias.map((c) => (
            <Cell key={c.nombre} fill={c.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [formatAmount(value, { decimals: 0 }), name]}
          contentStyle={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 12.5,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <p className="font-mono text-[9.5px] uppercase tracking-[.06em] text-[#8a8677] dark:text-[#93a0af]">Total</p>
      <p className="font-mono text-[13px] font-semibold text-foreground">{formatAmount(total, { decimals: 0 })}</p>
    </div>
  </div>
);

CategoriaDonut.propTypes = {
  categorias: PropTypes.array.isRequired,
  total: PropTypes.number.isRequired,
  formatAmount: PropTypes.func.isRequired,
  size: PropTypes.number,
};

export default CategoriaDonut;
