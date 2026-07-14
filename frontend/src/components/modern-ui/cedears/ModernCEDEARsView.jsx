import { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '../../ui/badge';

/**
 * ModernCEDEARsView — tab "CEDEARs" dentro de Inversiones (tema "Papel").
 * Se renderiza embebido en ModernInversionesView, que ya provee el
 * contenedor de página / cabecera. Ver design_handoff_rediseno_papel/README.md
 * sección "6. Inversiones".
 */
const ModernCEDEARsView = ({ cedears = [], onRefresh, onViewDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Normalizar CEDEARs del API
  const normalizedCedears = cedears.map((c) => ({
    symbol: c.ticker || c.symbol,
    nombre: c.nombre || c.name || c.ticker,
    precio: parseFloat(c.precio_ars || c.price || 0),
    variacion: parseFloat(c.variacion_pct || c.change_percent || 0),
    rsi: c.rsi_14 ?? c.rsi ?? null,
    macd: c.macd_signal || c.macd || null,
    sector: c.sector || 'Otros',
  }));

  const filtered = normalizedCedears.filter(
    (c) =>
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const macdLabel = (macd) => {
    if (macd === 'compra') return 'Compra';
    if (macd === 'venta') return 'Venta';
    return 'Neutral';
  };
  // Devuelven clases Tailwind (no hex crudo) para que el par claro/dark
  // conviva en el mismo lugar — ver mapeo de colores del tema "Papel".
  const macdColorClass = (macd) => {
    if (macd === 'compra') return 'text-[#476442] dark:text-[#8fae7f]';
    if (macd === 'venta') return 'text-[#a04a34] dark:text-[#c26a52]';
    return 'text-[#5d6470] dark:text-[#93a0af]';
  };
  const rsiColorClass = (rsi) => {
    if (rsi === null || rsi === undefined) return 'text-[#5d6470] dark:text-[#93a0af]';
    if (rsi >= 70) return 'text-[#a04a34] dark:text-[#c26a52]';
    if (rsi <= 30) return 'text-[#476442] dark:text-[#8fae7f]';
    return 'text-[#5d6470] dark:text-[#93a0af]';
  };

  return (
    <div>
      {/* Buscador + refrescar */}
      <div className="mb-4 flex gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8677] dark:text-[#93a0af]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar CEDEAR (ej: GGAL)…"
            className="w-full rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] py-[7px] pl-9 pr-3 font-mono text-[12px] text-foreground placeholder:text-[#8a8677] dark:placeholder:text-[#93a0af] focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>
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
      <div className="overflow-hidden overflow-x-auto rounded-md border border-[#ddd5c2] dark:border-[#2e3844] bg-card">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b-2 border-[#ddd5c2] dark:border-[#2e3844]">
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Ticker</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Nombre</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Sector</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Precio</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Variación</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>RSI</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>MACD</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <p className="text-[13.5px] italic text-muted-foreground">
                    {searchQuery ? `Sin resultados para "${searchQuery}".` : 'Sin CEDEARs para mostrar.'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isPositive = c.variacion >= 0;
                const variacionColorClass = isPositive
                  ? 'text-[#476442] dark:text-[#8fae7f]'
                  : 'text-[#a04a34] dark:text-[#c26a52]';
                return (
                  <tr
                    key={c.symbol}
                    onClick={() => onViewDetails && onViewDetails(c)}
                    className={`group border-b border-[#e7e0cf] dark:border-[#2e3844] transition-colors hover:bg-[#f0ead9] dark:hover:bg-[#212836] ${onViewDetails ? 'cursor-pointer' : ''}`}
                  >
                    <td className="px-3.5 py-2.5 font-mono text-[12px] font-semibold text-foreground">{c.symbol}</td>
                    <td className="px-3.5 py-2.5 text-[13.5px] text-foreground">{c.nombre}</td>
                    <td className="px-3.5 py-2.5">
                      <Badge variant="outline">{c.sector}</Badge>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-[12px] text-foreground">
                      $ {c.precio.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <span
                        className={`inline-flex items-center justify-end gap-1 font-mono text-[12px] font-semibold ${variacionColorClass}`}
                      >
                        {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {isPositive ? '+' : ''}{c.variacion.toFixed(2)}%
                      </span>
                    </td>
                    <td className={`px-3.5 py-2.5 text-right font-mono text-[12px] ${rsiColorClass(c.rsi)}`}>
                      {c.rsi ?? '—'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <span className={`font-mono text-[11px] font-semibold uppercase ${macdColorClass(c.macd)}`}>
                        {macdLabel(c.macd)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ModernCEDEARsView.propTypes = {
  cedears: PropTypes.array,
  onRefresh: PropTypes.func,
  onViewDetails: PropTypes.func,
};

export default ModernCEDEARsView;
