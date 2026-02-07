import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const DollarQuotesChart = ({ quotes }) => {
    if (!quotes || quotes.length === 0) {
        return (
            <div className="glass-panel lg:col-span-2 p-6 flex items-center justify-center">
                <p className="text-muted-foreground">Cargando cotizaciones...</p>
            </div>
        );
    }

    // Tomar las cotizaciones más importantes y ordenar según lo solicitado
    // Orden solicitado: Crypto, Blue, Oficial, MEP
    const desiredOrder = ['Cripto', 'Blue', 'Oficial', 'MEP'];
    
    const mainQuotes = quotes
        .filter(q => desiredOrder.includes(q.title))
        .sort((a, b) => {
            return desiredOrder.indexOf(a.title) - desiredOrder.indexOf(b.title);
        });

    return (
        <div className="glass-panel lg:col-span-2 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                    Cotizaciones del Dólar
                </h3>
                <p className="text-xs text-muted-foreground">
                    Actualizado: {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mainQuotes.map((quote, index) => {
                    const data = quote.data || {};
                    const compra = data.compra || 0;
                    const venta = data.venta || 0;
                    const variacion = data.variacion || 0;
                    const isPositive = variacion >= 0;

                    return (
                        <div
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">{quote.title}</p>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        ${venta.toFixed(2)}
                                    </p>
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {isPositive ? (
                                        <TrendingUp className="w-4 h-4" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4" />
                                    )}
                                    {Math.abs(variacion).toFixed(2)}%
                                </div>
                            </div>

                            <div className="flex justify-between text-xs">
                                <div>
                                    <p className="text-muted-foreground">Compra</p>
                                    <p className="text-white font-medium">${compra.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground">Venta</p>
                                    <p className="text-white font-medium">${venta.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
