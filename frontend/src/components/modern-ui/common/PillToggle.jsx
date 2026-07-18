import PropTypes from 'prop-types';

/**
 * PillToggle — toggle de pills genérico (Mensual/Acumulado, Día/Semana/Mes,
 * Gastos/Ingresos...), tema "Kanagawa". Extraído de ModernTransactionsView para
 * reusar en Inicio (Dashboard).
 */
const PillToggle = ({ options, value, onChange, activeClassName }) => (
  <div className="inline-flex items-center gap-[3px] rounded-full border border-[#c8bf91] dark:border-[#363646] bg-card p-[3px]">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`rounded-full px-3 py-1 font-mono text-[12px] transition-colors duration-150 ${
          value === opt.value
            ? `${activeClassName} font-semibold`
            : 'text-[#43436c] dark:text-[#c8c093] hover:text-foreground'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

PillToggle.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
  })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  activeClassName: PropTypes.string.isRequired,
};

export default PillToggle;
