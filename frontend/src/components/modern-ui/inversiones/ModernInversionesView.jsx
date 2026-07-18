import { useState } from 'react';
import PropTypes from 'prop-types';
import ModernCEDEARsView from '../cedears/ModernCEDEARsView';
import ModernCotizacionesView from '../cotizaciones/ModernCotizacionesView';
import ModernMonedasView from '../monedas/ModernMonedasView';
import { useIsMobile } from '../../../hooks/use-mobile';

/**
 * ModernInversionesView — container "Inversiones" del tema "Kanagawa".
 * Agrupa CEDEARs + Cotización Dólar + Monedas en una sola sección con
 * tabs internos (ver design_handoff_rediseno_papel/README.md "Mapa de
 * migración" y sección "6. Inversiones"). Cada tab sigue usando su propia
 * lógica de datos/hook existente — este componente solo wrappea + restylea.
 */
const INVERSIONES_TAB_KEY = 'inversiones_tab';

const TABS = [
  { value: 'cedears', label: 'CEDEARs' },
  { value: 'dollar', label: 'Dólar' },
  { value: 'monedas', label: 'Monedas' },
];

const loadTab = () => {
  try {
    const saved = localStorage.getItem(INVERSIONES_TAB_KEY);
    if (TABS.some((t) => t.value === saved)) return saved;
  } catch { /* ignore */ }
  return 'cedears';
};

// Toggle de pills — mismo patrón visual que Mensual/Acumulado y Día/Semana/Mes
// (ver ModernTransactionsView). Activa en fondo oscuro #545464, ya que estos
// tabs cambian de contenido completo (nivel "modo"), no filtran un rango.
const PillToggle = ({ options, value, onChange }) => (
  <div className="inline-flex items-center gap-[3px] rounded-full border border-[#c8bf91] dark:border-[#363646] bg-card p-[3px]">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`rounded-full px-4 py-1.5 font-mono text-[12px] transition-colors duration-150 ${
          value === opt.value
            ? 'bg-[#545464] dark:bg-[#dcd7ba] font-semibold text-[#f2ecbc] dark:text-[#1f1f28]'
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
    label: PropTypes.string.isRequired,
  })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const ModernInversionesView = ({
  cedears = [],
  onRefreshCedears,
  onViewCedearDetails,
  cotizaciones = [],
  onRefreshCotizaciones,
  monedas = [],
  onNewMoneda,
  onEditMoneda,
  onDeleteMoneda,
  onToggleActiveMoneda,
  onInitializeDefaultMonedas,
}) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState(loadTab);

  const handleTabChange = (value) => {
    setTab(value);
    try {
      localStorage.setItem(INVERSIONES_TAB_KEY, value);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen">
      <div className={`mx-auto max-w-[1100px] ${isMobile ? 'px-4 py-4' : 'px-[34px] py-[28px]'}`}>
        {/* Cabecera (mismo patrón que Movimientos / Vencimientos) */}
        <div
          className={`flex items-end justify-between gap-5 border-b-[3px] border-double border-[#b8ad78] dark:border-[#363646] ${
            isMobile ? 'mb-3 pb-3' : 'mb-[22px] pb-[18px]'
          }`}
        >
          <h1 className={`font-serif font-bold leading-none text-foreground ${isMobile ? 'text-[26px]' : 'text-[42px]'}`}>
            Inversiones
          </h1>
        </div>

        {/* Tabs internos */}
        <div className="mb-5">
          <PillToggle options={TABS} value={tab} onChange={handleTabChange} />
        </div>

        {tab === 'cedears' && (
          <ModernCEDEARsView
            cedears={cedears}
            onRefresh={onRefreshCedears}
            onViewDetails={onViewCedearDetails}
          />
        )}
        {tab === 'dollar' && (
          <ModernCotizacionesView
            cotizaciones={cotizaciones}
            onRefresh={onRefreshCotizaciones}
          />
        )}
        {tab === 'monedas' && (
          <ModernMonedasView
            monedas={monedas}
            onNewMoneda={onNewMoneda}
            onEditMoneda={onEditMoneda}
            onDeleteMoneda={onDeleteMoneda}
            onToggleActive={onToggleActiveMoneda}
            onInitializeDefault={onInitializeDefaultMonedas}
          />
        )}
      </div>
    </div>
  );
};

ModernInversionesView.propTypes = {
  cedears: PropTypes.array,
  onRefreshCedears: PropTypes.func,
  onViewCedearDetails: PropTypes.func,
  cotizaciones: PropTypes.array,
  onRefreshCotizaciones: PropTypes.func,
  monedas: PropTypes.array,
  onNewMoneda: PropTypes.func,
  onEditMoneda: PropTypes.func,
  onDeleteMoneda: PropTypes.func,
  onToggleActiveMoneda: PropTypes.func,
  onInitializeDefaultMonedas: PropTypes.func,
};

export default ModernInversionesView;
