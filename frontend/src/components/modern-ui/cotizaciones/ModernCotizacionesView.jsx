import { useState } from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

const MOCK_QUOTES = [
  { casa: 'oficial', nombre: 'Oficial', venta: 990, variacion: 0.5 },
  { casa: 'blue', nombre: 'Blue', venta: 1270, variacion: -1.2, brecha: 28.3 },
  { casa: 'mep', nombre: 'MEP', venta: 1180, variacion: 0.8 },
  { casa: 'ccl', nombre: 'CCL', venta: 1210, variacion: 1.1 },
  { casa: 'tarjeta', nombre: 'Tarjeta', venta: 1584, variacion: 0.5 },
  { casa: 'cripto', nombre: 'Cripto', venta: 1265, variacion: -0.3 },
];

/**
 * ModernCotizacionesView — tab "Dólar" dentro de Inversiones (tema "Papel").
 * Se renderiza embebido en ModernInversionesView. Ver
 * design_handoff_rediseno_papel/README.md sección "6. Inversiones".
 */
const ModernCotizacionesView = ({ cotizaciones = [], onRefresh }) => {
  const data = cotizaciones.length > 0 ? cotizaciones : MOCK_QUOTES;
  const [calcARS, setCalcARS] = useState('');
  const [calcUSD, setCalcUSD] = useState('');
  const [selectedTipo, setSelectedTipo] = useState(data[0]?.casa || 'blue');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConvertARStoUSD = () => {
    if (!calcARS) return;
    const cot = data.find((c) => c.casa === selectedTipo);
    if (cot) setCalcUSD((parseFloat(calcARS) / cot.venta).toFixed(2));
  };

  const handleConvertUSDtoARS = () => {
    if (!calcUSD) return;
    const cot = data.find((c) => c.casa === selectedTipo);
    if (cot) setCalcARS((parseFloat(calcUSD) * cot.venta).toFixed(2));
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] px-3 py-[7px] font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9] dark:hover:bg-[#212836] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {/* Tabla (patrón Movimientos) */}
      <div className="mb-5 overflow-hidden overflow-x-auto rounded-md border border-[#ddd5c2] dark:border-[#2e3844] bg-card">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b-2 border-[#ddd5c2] dark:border-[#2e3844]">
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Casa</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Venta</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Variación</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Brecha</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cot) => {
              const isPositive = cot.variacion >= 0;
              const variacionColor = isPositive ? 'var(--success)' : 'var(--destructive)';
              return (
                <tr key={cot.casa} className="group border-b border-[#e7e0cf] dark:border-[#2e3844] transition-colors hover:bg-[#f0ead9] dark:hover:bg-[#212836]">
                  <td className="px-3.5 py-2.5 text-[13.5px] text-foreground">Dólar {cot.nombre}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[13px] font-semibold text-foreground">
                    $ {cot.venta.toFixed(2)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <span
                      className="inline-flex items-center justify-end gap-1 font-mono text-[12px] font-semibold"
                      style={{ color: variacionColor }}
                    >
                      {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {isPositive ? '+' : ''}{cot.variacion}%
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[12px] text-[#8a8677] dark:text-[#93a0af]">
                    {cot.brecha ? `${cot.brecha}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Calculadora */}
      <div className="rounded-md border border-[#ddd5c2] dark:border-[#2e3844] bg-card px-5 py-[18px]">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-[17px] font-semibold text-foreground">
          <ArrowRightLeft className="h-4 w-4 text-[#3d5a80]" />
          Calculadora de conversión
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[.06em] text-[#8a8677] dark:text-[#93a0af]">Pesos (ARS)</label>
            <input
              type="number"
              value={calcARS}
              onChange={(e) => setCalcARS(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] px-3 py-[7px] font-mono text-[13px] text-foreground placeholder:text-[#8a8677] dark:placeholder:text-[#93a0af] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleConvertARStoUSD}
              className="mt-2 w-full rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] px-3 py-[7px] font-sans text-[12.5px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9] dark:hover:bg-[#212836]"
            >
              Convertir a USD →
            </button>
          </div>
          <div className="flex items-end">
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] px-3 py-[7px] font-mono text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {data.map((c) => (
                <option key={c.casa} value={c.casa}>Dólar {c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[.06em] text-[#8a8677] dark:text-[#93a0af]">Dólares (USD)</label>
            <input
              type="number"
              value={calcUSD}
              onChange={(e) => setCalcUSD(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] px-3 py-[7px] font-mono text-[13px] text-foreground placeholder:text-[#8a8677] dark:placeholder:text-[#93a0af] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleConvertUSDtoARS}
              className="mt-2 w-full rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] px-3 py-[7px] font-sans text-[12.5px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9] dark:hover:bg-[#212836]"
            >
              ← Convertir a ARS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ModernCotizacionesView.propTypes = {
  cotizaciones: PropTypes.array,
  onRefresh: PropTypes.func,
};

export default ModernCotizacionesView;
