import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

export const DollarQuoteWidget = () => {
  const [quotes, setQuotes] = useState({
    oficial: { compra: 0, venta: 0, variation: 0 },
    blue: { compra: 0, venta: 0, variation: 0 },
    mep: { compra: 0, venta: 0, variation: 0 },
    ccl: { compra: 0, venta: 0, variation: 0 },
    tarjeta: { compra: 0, venta: 0, variation: 0 },
    mayorista: { compra: 0, venta: 0, variation: 0 },
    cripto: { compra: 0, venta: 0, variation: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      // Fetch from dolarapi.com (free API for Argentine dollar quotes)
      const response = await fetch('https://dolarapi.com/v1/dolares');
      const data = await response.json();

      const quotesMap = {
        oficial: data.find(d => d.casa === 'oficial') || {},
        blue: data.find(d => d.casa === 'blue') || {},
        mep: data.find(d => d.casa === 'bolsa') || {},
        ccl: data.find(d => d.casa === 'contadoconliqui') || {},
        tarjeta: data.find(d => d.casa === 'tarjeta') || {},
        mayorista: data.find(d => d.casa === 'mayorista') || {},
        cripto: data.find(d => d.casa === 'cripto') || {}
      };

      setQuotes({
        oficial: {
          compra: quotesMap.oficial.compra || 0,
          venta: quotesMap.oficial.venta || 0,
          variation: quotesMap.oficial.variacion || 0
        },
        blue: {
          compra: quotesMap.blue.compra || 0,
          venta: quotesMap.blue.venta || 0,
          variation: quotesMap.blue.variacion || 0
        },
        mep: {
          compra: quotesMap.mep.compra || 0,
          venta: quotesMap.mep.venta || 0,
          variation: quotesMap.mep.variacion || 0
        },
        ccl: {
          compra: quotesMap.ccl.compra || 0,
          venta: quotesMap.ccl.venta || 0,
          variation: quotesMap.ccl.variacion || 0
        },
        tarjeta: {
          compra: quotesMap.tarjeta.compra || 0,
          venta: quotesMap.tarjeta.venta || 0,
          variation: quotesMap.tarjeta.variacion || 0
        },
        mayorista: {
          compra: quotesMap.mayorista.compra || 0,
          venta: quotesMap.mayorista.venta || 0,
          variation: quotesMap.mayorista.variacion || 0
        },
        cripto: {
          compra: quotesMap.cripto.compra || 0,
          venta: quotesMap.cripto.venta || 0,
          variation: quotesMap.cripto.variacion || 0
        }
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dollar quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    // Refresh every 5 minutes
    const interval = setInterval(fetchQuotes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const QuoteCard = ({ title, quote, color }) => (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-primary/90 transition-all">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white/80 text-sm font-medium">{title}</h4>
        {quote.variation !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${quote.variation > 0 ? 'text-primary' : 'text-red-400'
            }`}>
            {quote.variation > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(quote.variation).toFixed(2)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-xs">Compra</span>
          <span className="text-white font-bold" style={{ color }}>
            {formatCurrency(quote.compra)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-xs">Venta</span>
          <span className="text-white font-bold" style={{ color }}>
            {formatCurrency(quote.venta)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-primary p-6 bg-white/5 backdrop-blur-sm flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            Cotizaciones del Dólar (ARS)
          </h3>
        </div>
        <button
          onClick={fetchQuotes}
          disabled={loading}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {lastUpdate && (
        <p className="text-white/40 text-xs">
          Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <QuoteCard title="Oficial" quote={quotes.oficial} color="#3b82f6" />
        <QuoteCard title="Blue" quote={quotes.blue} color="#10b981" />
        <QuoteCard title="Tarjeta" quote={quotes.tarjeta} color="#ef4444" />
        <QuoteCard title="Mayorista" quote={quotes.mayorista} color="#f59e0b" />
        <QuoteCard title="MEP" quote={quotes.mep} color="#8b5cf6" />
        <QuoteCard title="CCL" quote={quotes.ccl} color="#ec4899" />
        <QuoteCard title="Cripto" quote={quotes.cripto} color="#06b6d4" />
      </div>
    </div>
  );
};

