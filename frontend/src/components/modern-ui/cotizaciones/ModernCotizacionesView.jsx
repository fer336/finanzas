import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRightLeft, DollarSign } from 'lucide-react';

const ModernCotizacionesView = ({ cotizaciones = [], onRefresh }) => {
  const mock = [
    { casa: 'oficial', nombre: 'Oficial', venta: 990, variacion: 0.5 },
    { casa: 'blue', nombre: 'Blue', venta: 1270, variacion: -1.2, brecha: 28.3 },
    { casa: 'mep', nombre: 'MEP', venta: 1180, variacion: 0.8 },
    { casa: 'ccl', nombre: 'CCL', venta: 1210, variacion: 1.1 },
    { casa: 'tarjeta', nombre: 'Tarjeta', venta: 1584, variacion: 0.5 },
    { casa: 'cripto', nombre: 'Cripto', venta: 1265, variacion: -0.3 }
  ];
  const data = cotizaciones.length > 0 ? cotizaciones : mock;
  const [calcARS, setCalcARS] = useState('');
  const [calcUSD, setCalcUSD] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('blue');

  const handleConvertARStoUSD = () => {
    if (!calcARS) return;
    const cot = data.find(c => c.casa === selectedTipo);
    if (cot) setCalcUSD((parseFloat(calcARS) / cot.venta).toFixed(2));
  };

  const handleConvertUSDtoARS = () => {
    if (!calcUSD) return;
    const cot = data.find(c => c.casa === selectedTipo);
    if (cot) setCalcARS((parseFloat(calcUSD) * cot.venta).toFixed(2));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="flex justify-end mb-6">
        <button onClick={onRefresh} className="px-4 py-2.5 bg-[#18181b] text-white border border-white/5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {data.map((cot) => {
          const isPositive = cot.variacion >= 0;
          return (
            <div key={cot.casa} className="bg-[#18181b] rounded-3xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#10b981]/10">
                  <DollarSign className="w-6 h-6 text-[#10b981]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Dólar {cot.nombre}</h3>
                  {cot.brecha && <p className="text-xs text-gray-400">Brecha: {cot.brecha}%</p>}
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-3">${cot.venta.toFixed(2)}</p>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${isPositive ? 'bg-[#10b981]/10' : 'bg-red-500/10'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4 text-[#10b981]" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                <span className={`text-sm font-bold ${isPositive ? 'text-[#10b981]' : 'text-red-500'}`}>{isPositive ? '+' : ''}{cot.variacion}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calculadora */}
      <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5">
        <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-[#10b981]" />
          Calculadora de Conversión
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Pesos (ARS)</label>
            <input type="number" value={calcARS} onChange={(e) => setCalcARS(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] text-white border border-white/5 focus:outline-none focus:border-[#10b981]/30 transition-colors" />
            <button onClick={handleConvertARStoUSD} className="w-full mt-2 px-4 py-2 bg-[#18181b] text-white text-sm border border-white/5 rounded-xl hover:bg-white/5 transition-colors">Convertir a USD →</button>
          </div>
          <div className="flex items-end">
            <select value={selectedTipo} onChange={(e) => setSelectedTipo(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] text-white border border-white/5 focus:outline-none focus:border-[#10b981]/30 transition-colors">
              {data.map(c => <option key={c.casa} value={c.casa}>Dólar {c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Dólares (USD)</label>
            <input type="number" value={calcUSD} onChange={(e) => setCalcUSD(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] text-white border border-white/5 focus:outline-none focus:border-[#10b981]/30 transition-colors" />
            <button onClick={handleConvertUSDtoARS} className="w-full mt-2 px-4 py-2 bg-[#18181b] text-white text-sm border border-white/5 rounded-xl hover:bg-white/5 transition-colors">← Convertir a ARS</button>
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
