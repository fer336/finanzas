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
  const macdColor = (macd) => {
    if (macd === 'compra') return '#476442';
    if (macd === 'venta') return '#a04a34';
    return '#5d6470';
  };
  const rsiColor = (rsi) => {
    if (rsi === null || rsi === undefined) return '#5d6470';
    if (rsi >= 70) return '#a04a34';
    if (rsi <= 30) return '#476442';
    return '#5d6470';
  };

  return (
    <div>
      {/* Buscador + refrescar */}
      <div className="mb-4 flex gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8677]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar CEDEAR (ej: GGAL)…"
            className="w-full rounded-sm border border-[#ddd5c2] bg-white py-[7px] pl-9 pr-3 font-mono text-[12px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-sm border border-[#ddd5c2] bg-white px-3 py-[7px] font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {/* Tabla (patrón Movimientos) */}
      <div className="overflow-hidden overflow-x-auto rounded-md border border-[#ddd5c2] bg-card">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b-2 border-[#ddd5c2]">
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>Ticker</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>Nombre</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>Sector</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>Precio</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>Variación</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>RSI</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>MACD</th>
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
                const variacionColor = isPositive ? '#476442' : '#a04a34';
                return (
                  <tr
                    key={c.symbol}
                    onClick={() => onViewDetails && onViewDetails(c)}
                    className={`group border-b border-[#e7e0cf] transition-colors hover:bg-[#f0ead9] ${onViewDetails ? 'cursor-pointer' : ''}`}
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
                        className="inline-flex items-center justify-end gap-1 font-mono text-[12px] font-semibold"
                        style={{ color: variacionColor }}
                      >
                        {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {isPositive ? '+' : ''}{c.variacion.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-[12px]" style={{ color: rsiColor(c.rsi) }}>
                      {c.rsi ?? '—'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <span className="font-mono text-[11px] font-semibold uppercase" style={{ color: macdColor(c.macd) }}>
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
