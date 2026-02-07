import React, { useState, useEffect } from 'react';

export const QuotationsTicker = () => {
  const [quotations] = useState([
    { symbol: 'USD/EUR', value: '0.92', change: '+0.12%', isPositive: true },
    { symbol: 'AAPL', value: '190.45', change: '-0.85%', isPositive: false },
    { symbol: 'MELI', value: '1750.20', change: '+1.55%', isPositive: true },
    { symbol: 'TSLA', value: '177.48', change: '-1.10%', isPositive: false },
    { symbol: 'BTC/USD', value: '68,500', change: '+2.30%', isPositive: true },
  ]);

  // TODO: Implementar fetch real de cotizaciones cuando esté disponible
  useEffect(() => {
    // const fetchQuotations = async () => {
    //   try {
    //     const response = await fetch('/api/quotations');
    //     const data = await response.json();
    //     setQuotations(data);
    //   } catch (error) {
    //     console.error('Error fetching quotations:', error);
    //   }
    // };
    
    // fetchQuotations();
    // const interval = setInterval(fetchQuotations, 300000); // Cada 5 minutos
    
    // return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black/50 py-2 overflow-hidden sticky bottom-0 border-t border-white/10 backdrop-blur-sm z-10">
      <style>
        {`
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
        `}
      </style>
      
      <div className="flex animate-marquee whitespace-nowrap">
        {/* Duplicamos el contenido para el efecto continuo */}
        {[...quotations, ...quotations].map((quote, index) => (
          <div key={`${quote.symbol}-${index}`} className="flex items-center mx-4">
            <span className="text-sm font-bold text-white">{quote.symbol}</span>
            <span className="text-sm text-white/70 ml-2">{quote.value}</span>
            <span className={`text-sm ml-1 ${quote.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              ({quote.change})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

