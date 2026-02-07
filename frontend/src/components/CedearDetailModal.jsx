import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Bot } from 'lucide-react';
import { ComposedChart, Bar, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useIsMobile } from '../hooks/use-mobile';

const CedearDetailModal = ({ cedear, isOpen, onClose }) => {
  const isMobile = useIsMobile();
  const [historicalData, setHistoricalData] = useState([]);
  const [technicalData, setTechnicalData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1mo');
  const [error, setError] = useState(null);

  const periods = [
    { value: '5d', label: '5D' },
    { value: '1mo', label: '1M' },
    { value: '3mo', label: '3M' },
    { value: '1y', label: '1A' }
  ];

  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatPercent = (val) => `${val >= 0 ? '+' : ''}${val?.toFixed(2)}%`;

  const loadData = useCallback(async () => {
    if (!cedear) return;
    setLoading(true);
    setAnalyzing(true);
    
    try {
      // Auto-detect backend URL
      const isDev = window.location.hostname === 'localhost';
      const baseUrl = isDev ? 'http://localhost:8000' : '';

      // 1. Fetch History & Technicals in Parallel
      const [histRes, techRes] = await Promise.all([
        fetch(`${baseUrl}/api/yfinance/cedears/${cedear.ticker}/history?period=${selectedPeriod}`),
        fetch(`${baseUrl}/api/yfinance/cedears/${cedear.ticker}/technical`)
      ]);

      if (!histRes.ok) throw new Error('Error historial');
      const histData = await histRes.json();
      setHistoricalData(histData.data || []);

      if (techRes.ok) {
        const techData = await techRes.json();
        setTechnicalData(techData.indicators);

        // 2. Trigger AI Analysis (only if technical data exists)
        fetch(`${baseUrl}/api/agent/analyze-asset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: cedear.ticker,
            price: techData.indicators.price,
            indicators: techData.indicators
          })
        })
        .then(res => res.json())
        .then(data => setAiAnalysis(data.response))
        .catch(err => console.error("AI Error:", err))
        .finally(() => setAnalyzing(false));
      } else {
        setAnalyzing(false);
      }

    } catch (err) {
      console.error(err);
      setError('Error cargando datos');
      setAnalyzing(false);
    } finally {
      setLoading(false);
    }
  }, [cedear, selectedPeriod]);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen, loadData]);

  if (!isOpen || !cedear) return null;

  // Calculate real-time variation based on fetched history
  const lastPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : cedear.precio_ars;
  const firstPrice = historicalData.length > 0 ? historicalData[0].close : cedear.precio_ars;
  const variation = lastPrice - firstPrice;
  const variationPercent = firstPrice !== 0 ? (variation / firstPrice) * 100 : 0;
  const isPositive = variation >= 0;

  // Prepare Candle Data for Chart
  const prices = historicalData.flatMap(d => [d.high, d.low]);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  
  const candleData = historicalData.map(d => ({
    ...d,
    open: Number(d.open),
    high: Number(d.high),
    low: Number(d.low),
    close: Number(d.close),
    body: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
    wick: [d.low, d.high],
    color: d.close > d.open ? '#22c55e' : '#ef4444'
  }));

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-0 md:p-4">
      <div className="bg-[#0f0f11] w-full h-full md:max-w-6xl md:h-[85vh] md:rounded-2xl border-0 md:border border-zinc-800 overflow-hidden flex flex-col shadow-2xl">
        
        {/* Mobile-Optimized Header */}
        <div className="flex flex-col bg-[#141416] border-b border-zinc-800 relative">
          
          {/* Mobile: Compact Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 md:hidden">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold text-white">{cedear.ticker}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {formatPercent(variationPercent)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-white">{formatCurrency(lastPrice)}</span>
              </div>
            </div>
            
            {/* Close Button - High Z-Index for Mobile */}
            <button 
              onClick={onClose} 
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors shrink-0 z-[10000]"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Mobile: Period Selector Row */}
          <div className="px-4 pb-3 md:hidden">
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 gap-1">
              {periods.map(p => (
                <button
                  key={p.value}
                  onClick={() => setSelectedPeriod(p.value)}
                  className={`flex-1 py-2 rounded text-xs font-bold transition-colors ${selectedPeriod === p.value ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:flex md:items-center md:justify-between px-6 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-bold text-white tracking-tight">{cedear.ticker}</h2>
                <span className="text-zinc-400 text-sm truncate max-w-[200px]">{cedear.nombre}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-bold text-white">{formatCurrency(lastPrice)}</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {formatPercent(variationPercent)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                {periods.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setSelectedPeriod(p.value)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${selectedPeriod === p.value ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 overflow-y-auto lg:overflow-hidden">
          
          {/* Left: Chart (2/3 width) */}
          <div className="lg:col-span-2 lg:border-r border-zinc-800 p-4 flex flex-col relative bg-[#0f0f11] h-[300px] lg:h-auto">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={candleData}>
                    <YAxis 
                      domain={[minPrice * 0.99, maxPrice * 1.01]} 
                      hide 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const isUp = d.close > d.open;
                          return (
                            <div className="bg-zinc-900 border border-zinc-700 p-2 md:p-3 rounded-lg shadow-xl min-w-[120px] md:min-w-[150px]">
                              <p className="text-zinc-400 text-[10px] md:text-xs mb-1 md:mb-2 border-b border-zinc-800 pb-1">
                                {new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                              </p>
                              <div className="space-y-0.5 md:space-y-1 font-mono text-[10px] md:text-xs">
                                <div className="flex justify-between gap-2"><span className="text-zinc-500">Open</span> <span className="text-white">{formatCurrency(d.open)}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-zinc-500">High</span> <span className="text-white">{formatCurrency(d.high)}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-zinc-500">Low</span> <span className="text-white">{formatCurrency(d.low)}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-zinc-500">Close</span> <span className={isUp ? 'text-green-400' : 'text-red-400'}>{formatCurrency(d.close)}</span></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {/* Wicks (Thin Bars) */}
                    <Bar dataKey="wick" shape={(props) => {
                      const { x, y, width, height, fill } = props;
                      return (
                        <line 
                          x1={x + width / 2} 
                          y1={y} 
                          x2={x + width / 2} 
                          y2={y + height} 
                          stroke={fill} 
                          strokeWidth={1.5}
                        />
                      );
                    }}>
                      {candleData.map((entry, index) => (
                        <Cell key={`wick-${index}`} fill={entry.color} />
                      ))}
                    </Bar>

                    {/* Bodies (Thick Bars) */}
                    <Bar dataKey="body" shape={(props) => {
                      const { x, y, width, height, fill } = props;
                      return (
                        <rect 
                          x={x} 
                          y={y} 
                          width={width} 
                          height={Math.max(height, 2)} 
                          fill={fill} 
                          rx={1}
                        />
                      );
                    }}>
                      {candleData.map((entry, index) => (
                        <Cell key={`body-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right: Analysis & Stats (1/3 width) */}
          <div className="lg:col-span-1 bg-[#141416] p-4 md:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 flex flex-col gap-4 md:gap-6">
            
            {/* Technical Indicators Compact */}
            {technicalData && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">RSI (14)</p>
                  <p className={`text-xl font-bold ${technicalData.rsi > 70 ? 'text-red-400' : technicalData.rsi < 30 ? 'text-green-400' : 'text-zinc-300'}`}>
                    {technicalData.rsi?.toFixed(1)}
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">MACD</p>
                  <p className={`text-xl font-bold ${technicalData.macd > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {technicalData.macd?.toFixed(2)}
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">SMA 50</p>
                  <p className="text-lg font-bold text-blue-400">
                    ${technicalData.sma_50?.toFixed(0)}
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">SMA 200</p>
                  <p className="text-lg font-bold text-purple-400">
                    ${technicalData.sma_200?.toFixed(0)}
                  </p>
                </div>
              </div>
            )}

            {/* AI Analysis Section */}
            <div className="flex-1 bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/50">
                <Bot className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Análisis Inteligente</h3>
              </div>
              
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  <p className="text-zinc-500 text-xs animate-pulse">Analizando mercado...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({children}) => <p className="text-zinc-400 text-xs leading-relaxed mb-3">{children}</p>,
                      strong: ({children}) => <span className="text-white font-bold">{children}</span>,
                      h1: () => null, 
                      h2: () => null,
                      h3: () => null,
                      ul: ({children}) => <ul className="space-y-1 mb-3">{children}</ul>,
                      li: ({children}) => (
                        <li className="text-zinc-400 text-xs flex items-start gap-2">
                          <span className="w-1 h-1 bg-zinc-600 rounded-full mt-1.5 shrink-0"/>
                          <span>{children}</span>
                        </li>
                      ),
                      blockquote: ({children}) => (
                        <div className="bg-purple-500/10 border-l-2 border-purple-500 pl-3 py-2 my-3 text-purple-200 text-xs italic">
                          {children}
                        </div>
                      )
                    }}
                  >
                    {aiAnalysis}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-600 text-xs italic">Análisis no disponible.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CedearDetailModal;