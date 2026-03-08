import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const ModernCEDEARsView = ({ cedears = [], onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Normalizar CEDEARs del API
  const normalizedCedears = cedears.map(c => ({
    symbol: c.ticker || c.symbol,
    nombre: c.nombre || c.name || c.ticker,
    precio: parseFloat(c.precio_ars || c.price || 0),
    variacion: parseFloat(c.variacion_pct || c.change_percent || 0),
    rsi: c.rsi_14 || c.rsi || null,
    macd: c.macd_signal || c.macd || null,
    sector: c.sector || 'Otros'
  }));

  console.log('📊 CEDEARs normalizados:', normalizedCedears.length);

  const data = normalizedCedears;
  const filtered = data.filter(c => 
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar CEDEAR (ej: GGAL)..." className="pl-11 pr-4 py-2.5 w-80 bg-[#18181b] text-white text-sm border border-white/5 rounded-2xl placeholder:text-gray-500 focus:outline-none focus:border-[#10b981]/30 transition-colors" />
        </div>
        <button onClick={onRefresh} className="px-4 py-2.5 bg-[#18181b] text-white border border-white/5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((c) => {
          const isPositive = c.variacion >= 0;
          return (
            <div key={c.symbol} className="bg-[#18181b] rounded-3xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-white">{c.symbol}</h3>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isPositive ? 'bg-[#10b981]/10' : 'bg-red-500/10'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4 text-[#10b981]" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                    <span className={`text-sm font-bold ${isPositive ? 'text-[#10b981]' : 'text-red-500'}`}>{isPositive ? '+' : ''}{c.variacion}%</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{c.nombre}</p>
              <p className="text-3xl font-bold text-[#10b981] mb-4">${c.precio.toFixed(2)}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0a0a0a] rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">RSI</p>
                  <p className={`text-sm font-bold ${c.rsi >= 70 ? 'text-red-500' : c.rsi <= 30 ? 'text-[#10b981]' : 'text-yellow-500'}`}>{c.rsi}</p>
                </div>
                <div className="p-3 bg-[#0a0a0a] rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">MACD</p>
                  <p className={`text-xs font-bold ${c.macd === 'compra' ? 'text-[#10b981]' : c.macd === 'venta' ? 'text-red-500' : 'text-yellow-500'}`}>{c.macd === 'compra' ? 'Compra' : c.macd === 'venta' ? 'Venta' : 'Neutral'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ModernCEDEARsView.propTypes = {
  cedears: PropTypes.array,
  onRefresh: PropTypes.func,
};

export default ModernCEDEARsView;
