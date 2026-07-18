import PropTypes from 'prop-types';
import { kanagawaAssets } from '../../../theme/kanagawa-assets';
import { DecorativeCardImage } from './KanagawaDecorativeImages';

/**
 * KpiCard — card de indicador compartida por las vistas del tema "Kanagawa"
 * (Inicio, Movimientos, y futuras: Vencimientos, etc).
 * Ver DESIGN.md "Components" → "KPI card" y
 * design_handoff_rediseno_papel/README.md sección "2. Inicio (dashboard)".
 */
const CARD_ART = {
  ingresos: {
    src: kanagawaAssets.incomePines,
    className: 'card-art-income',
    variantClassName: 'card-income',
  },
  gastos: {
    src: kanagawaAssets.expenseFuji,
    className: 'card-art-expense',
    variantClassName: 'card-expense',
  },
};

const KpiCard = ({ kpiKey, label, value, subtext, borderColor, valueColor }) => {
  const art = CARD_ART[kpiKey];

  return (
    <div
      className={`kanagawa-card kanagawa-interactive rounded-md px-2.5 py-3 sm:px-[18px] sm:py-4 ${art?.variantClassName || ''}`}
      style={{ borderTop: `3px solid ${borderColor}` }}
    >
      <div className="card-copy">
        <div className="truncate text-[10px] uppercase tracking-[.06em] text-muted-foreground sm:text-[11px]">{label}</div>
        <div
          className="mt-1.5 truncate font-mono text-[15px] font-semibold sm:text-[19px] md:text-[24px]"
          style={{ color: valueColor }}
        >
          {value}
        </div>
        {subtext ? <div className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-[12px]">{subtext}</div> : null}
      </div>
      {art ? <DecorativeCardImage src={art.src} className={art.className} /> : null}
    </div>
  );
};

KpiCard.propTypes = {
  kpiKey: PropTypes.string,
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  subtext: PropTypes.node,
  borderColor: PropTypes.string.isRequired,
  valueColor: PropTypes.string.isRequired,
};

export default KpiCard;
