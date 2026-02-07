import React from 'react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { Building2 } from 'lucide-react';

export const BankSummariesWidget = ({ data, onViewDetails }) => {
    const { formatAmount } = useAmountVisibility();

    if (!data) return null;

    // Filtrar resúmenes que NO están pagados totalmente
    const resumenes = (data.resumenesBancarios || []).filter(r => !r.total_pagado);

    // Calcular balance total (DEUDA TOTAL) - solo resúmenes completamente pendientes
    const totalBalance = resumenes.reduce((sum, r) => {
        // Solo sumar si NO está pagado ni el mínimo ni el total
        const isPending = !r.total_pagado && !r.minimo_pagado;
        if (isPending) {
            const saldo = parseFloat(r.totales?.saldo_actual_pesos || 0);
            return sum + saldo;
        }
        return sum;
    }, 0);

    // Calcular límite total (para tarjetas de crédito)
    const totalLimit = resumenes.reduce((sum, r) => {
        const limite = parseFloat(r.limites?.compras || r.limite_credito || r.LimiteCredito || 0);
        return sum + limite;
    }, 0);

    // Calcular porcentaje usado (para el círculo de progreso)
    const percentageUsed = totalLimit > 0 ? ((totalBalance / totalLimit) * 100) : 0;

    // Calcular stroke-dashoffset para el círculo
    const circumference = 2 * Math.PI * 40; // radio = 40
    const strokeDashoffset = circumference - (Math.min(percentageUsed, 100) / 100) * circumference;

    const formatCurrency = (amount) => {
        return formatAmount(amount, { decimals: 2 });
    };

    return (
        <div className="glass-panel flex flex-col h-full min-h-[300px]">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h3 className="text-lg font-bold leading-tight flex items-center gap-2 text-white">
                    <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
                    Resúmenes Bancarios <span className="text-white/50 text-sm font-normal">({resumenes.length})</span>
                </h3>
                <button
                    onClick={onViewDetails}
                    className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors cursor-pointer"
                >
                    Ver detalles
                </button>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 p-6 gap-6" onClick={onViewDetails} style={{ cursor: 'pointer' }}>
                {/* Gráfico circular de progreso */}
                <div className="relative w-48 h-48">
                    <svg
                        className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-lg"
                        fill="none"
                        viewBox="0 0 100 100"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Círculo de fondo */}
                        <circle
                            cx="50"
                            cy="50"
                            fill="transparent"
                            r="40"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="8"
                        ></circle>
                        {/* Círculo de progreso */}
                        <circle
                            className={`${percentageUsed > 80 ? 'text-red-500' : percentageUsed > 50 ? 'text-yellow-500' : 'text-cyan-500'}`}
                            cx="50"
                            cy="50"
                            fill="transparent"
                            r="40"
                            stroke="currentColor"
                            strokeDasharray="251.2"
                            strokeDashoffset={strokeDashoffset}
                            strokeWidth="8"
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s ease-out', filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.5))' }}
                        ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">Deuda Total</p>
                        <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalBalance)}</p>
                    </div>
                </div>

                {/* Resumen rápido de cuentas */}
                <div className="w-full space-y-3">
                    {resumenes.slice(0, 2).map((resumen, index) => {
                        const banco = resumen.banco || resumen.Banco || 'Sin nombre';
                        const saldo = parseFloat(resumen.totales?.saldo_actual_pesos || 0);
                        const minimoPagado = resumen.minimo_pagado;
                        const saldoColor = minimoPagado ? 'text-yellow-400' : 'text-red-400';

                        return (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                        <Building2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{banco}</p>
                                        <p className="text-xs text-white/50">{resumen.tipo_tarjeta || 'Cuenta'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-semibold ${saldoColor}`}>
                                        {formatCurrency(saldo)}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground">
                                        {minimoPagado ? 'Mínimo Pagado' : 'Pendiente'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
