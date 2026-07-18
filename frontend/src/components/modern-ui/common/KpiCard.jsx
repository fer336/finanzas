import PropTypes from 'prop-types';

/**
 * KpiCard — card de indicador compartida por las vistas del tema "Kanagawa"
 * (Inicio, Movimientos, y futuras: Vencimientos, etc).
 * Ver DESIGN.md "Components" → "KPI card" y
 * design_handoff_rediseno_papel/README.md sección "2. Inicio (dashboard)".
 */
const KpiCard = ({ label, value, subtext, borderColor, valueColor }) => (
  <div
    className="rounded-md border border-[#c8bf91] dark:border-[#363646] bg-card px-2.5 py-3 sm:px-[18px] sm:py-4"
    style={{ borderTop: `3px solid ${borderColor}` }}
  >
    <div className="truncate text-[10px] uppercase tracking-[.06em] text-[#625f55] dark:text-[#c8c093] sm:text-[11px]">{label}</div>
    <div
      className="mt-1.5 truncate font-mono text-[15px] font-semibold sm:text-[19px] md:text-[24px]"
      style={{ color: valueColor }}
    >
      {value}
    </div>
    {subtext ? <div className="mt-0.5 truncate text-[11px] text-[#625f55] dark:text-[#c8c093] sm:text-[12px]">{subtext}</div> : null}
  </div>
);

KpiCard.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  subtext: PropTypes.node,
  borderColor: PropTypes.string.isRequired,
  valueColor: PropTypes.string.isRequired,
};

export default KpiCard;
