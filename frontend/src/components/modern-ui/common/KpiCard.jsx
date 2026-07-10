import PropTypes from 'prop-types';

/**
 * KpiCard — card de indicador compartida por las vistas del tema "Papel"
 * (Inicio, Movimientos, y futuras: Vencimientos, etc).
 * Ver DESIGN.md "Components" → "KPI card" y
 * design_handoff_rediseno_papel/README.md sección "2. Inicio (dashboard)".
 */
const KpiCard = ({ label, value, subtext, borderColor, valueColor }) => (
  <div
    className="rounded-md border border-[#ddd5c2] bg-card px-[18px] py-4"
    style={{ borderTop: `3px solid ${borderColor}` }}
  >
    <div className="text-[11px] uppercase tracking-[.06em] text-[#8a8677]">{label}</div>
    <div className="mt-1.5 font-mono text-[24px] font-semibold" style={{ color: valueColor }}>
      {value}
    </div>
    {subtext ? <div className="mt-0.5 text-[12px] text-[#8a8677]">{subtext}</div> : null}
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
