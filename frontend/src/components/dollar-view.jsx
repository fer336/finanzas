import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Clock, ArrowLeft, Building2, Globe, CreditCard, Factory, Bitcoin, Wallet } from 'lucide-react';

const DollarCard = ({ title, data, loading, icon: Icon }) => {
  if (loading) {
    return (
      <div className="bg-[#161616] border border-white/5 rounded-3xl p-6 h-[200px] animate-pulse relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-10" />
      </div>
    );
  }

  if (!data) return null;

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('es-AR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
      });
  };

  return (
    <div className="bg-[#161616] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        {Icon && <Icon className="w-24 h-24 text-white transform rotate-12 translate-x-4 -translate-y-4" />}
      </div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/80">
                    {Icon && <Icon className="w-5 h-5" />}
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">{title}</h3>
                    <p className="text-white/40 text-xs">Cotización Actual</p>
                </div>
            </div>
            {data.fechaActualizacion && (
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                    <Clock className="w-3 h-3 text-white/40" />
                    <span className="text-[10px] text-white/60">{formatDate(data.fechaActualizacion)}</span>
                 </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-[#0f151a] rounded-2xl p-3 border border-white/5">
                <span className="text-xs text-white/40 font-medium uppercase tracking-wider block mb-1">Compra</span>
                <span className="text-xl font-bold text-white block">
                    {formatCurrency(data.compra)}
                </span>
            </div>
            <div className="bg-[#0f151a] rounded-2xl p-3 border border-white/5">
                <span className="text-xs text-white/40 font-medium uppercase tracking-wider block mb-1">Venta</span>
                <span className="text-xl font-bold text-white block">
                    {formatCurrency(data.venta)}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export function DollarView({ onBack }) {
  const [dollarRates, setDollarRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDollarRates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares');
      const data = await response.json();
      
      const rates = {};
      data.forEach(d => {
        rates[d.casa] = {
            compra: d.compra,
            venta: d.venta,
            fechaActualizacion: d.fechaActualizacion
        };
      });
      setDollarRates(rates);
    } catch (err) {
      console.error('Error fetching dollar rates:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDollarRates();
    const interval = setInterval(fetchDollarRates, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchDollarRates]);

  const dollarTypes = [
    { id: 'oficial', name: 'Oficial', icon: Building2 },
    { id: 'blue', name: 'Blue', icon: Wallet }, // Using Wallet as visual proxy for cash/blue
    { id: 'bolsa', name: 'MEP', icon: TrendingUp },
    { id: 'contadoconliqui', name: 'CCL', icon: Globe },
    { id: 'tarjeta', name: 'Tarjeta', icon: CreditCard },
    { id: 'mayorista', name: 'Mayorista', icon: Factory },
    { id: 'cripto', name: 'Cripto', icon: Bitcoin },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-32 animate-fadeIn">
       {/* Header */}
       <div className="flex items-center justify-between p-4 pt-6 md:p-8">
            <div className="flex items-center gap-4">
                {onBack && (
                  <button 
                    onClick={onBack}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                <div>
                    <h1 className="text-2xl font-bold md:text-3xl">Dólar Hoy</h1>
                    <p className="text-white/40 text-sm">Cotizaciones en tiempo real</p>
                </div>
            </div>
            <button 
                onClick={fetchDollarRates}
                disabled={isRefreshing}
                className={`w-10 h-10 rounded-full bg-[#161616] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
            >
                <RefreshCw className={`w-5 h-5 text-white/80 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
       </div>

       {/* Cards Grid */}
       <div className="px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dollarTypes.map((type) => {
                const rate = dollarRates[type.id];
                // For crypto, we might not get it from dolarapi standard endpoint sometimes, but let's see. 
                // DolarApi usually returns: oficial, blue, bolsa, contadoconliqui, mayorista, tarjeta, cripto
                if (!rate && !loading) return null;
                return (
                    <DollarCard
                        key={type.id}
                        title={type.name}
                        data={rate}
                        loading={loading}
                        icon={type.icon}
                    />
                );
            })}
       </div>
    </div>
  );
}
