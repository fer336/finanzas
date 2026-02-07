import React, { useState } from 'react';
import { Building2, CheckCircle, AlertCircle, Clock, History } from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

export const BankSummariesFullView = ({ data, onBack, onViewDetails, onPay, onUndoPayment }) => {
    const { formatAmount } = useAmountVisibility();
    const [searchTerm] = useState('');
    const [showPaid, setShowPaid] = useState(false); // Default: hide paid summaries

    const resumenes = data?.resumenesBancarios || [];

    // Helper to check if fully paid
    const isFullyPaid = (r) => {
        // Check legacy total_pagado flag first
        if (r.total_pagado === true || r.total_pagado === 'true' || r.total_pagado === 1) {
            return true;
        }
        
        // New logic: Check if all currencies with debt are paid
        const totales = r.totales || {};
        const tieneARS = parseFloat(totales.saldo_actual_pesos || 0) > 0;
        const tieneUSD = parseFloat(totales.saldo_actual_dolares || 0) > 0;
        const pagadoARS = r.pagado_ars || false;
        const pagadoUSD = r.pagado_usd || false;
        
        // Fully paid if:
        // - No ARS debt OR ARS is paid
        // - AND No USD debt OR USD is paid
        // - AND at least one currency was paid (to exclude unpaid summaries)
        return (!tieneARS || pagadoARS) && (!tieneUSD || pagadoUSD) && (pagadoARS || pagadoUSD);
    };
    const isPartiallyPaid = (r) => r.minimo_pagado === true || r.minimo_pagado === 'true' || r.minimo_pagado === 1;

    // Helper to parse Spanish dates (e.g., "11-Dic-2024")
    const parseSpanishDate = (dateString) => {
        if (!dateString || dateString === '0') return null;
        
        // Clean string
        const cleanStr = dateString.toString().toLowerCase().trim();
        if (cleanStr === 'invalid date') return null;
        
        // Try standard date first
        let date = new Date(dateString);
        if (!isNaN(date.getTime()) && date.getFullYear() > 2000) return date;
        
        // Map Spanish months
        const months = {
            'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
            'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
            'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
        };
        
        // Regex for DD-MMM-YY or DD-MMM-YYYY or DD de MMM de YYYY
        // Also supports DD-MMM without year (assumes current year)
        // Improved regex to handle "26-dic" correctly without requiring trailing space or specific separator
        const match = cleanStr.match(/(\d{1,2})[-/ .]+(?:de )?([a-z]{3,})(?:[-/ .]+(?:de )?(\d{2,4}))?/);
        if (match) {
            const day = parseInt(match[1]);
            const monthStr = match[2];
            let year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
            
            if (year < 100) year += 2000; // Assume 20xx
            
            const month = months[monthStr.substring(0, 3)]; // Use first 3 chars for lookup
            if (month !== undefined) {
                // Heuristic for missing year: if date is more than 6 months in past, assume next year? 
                if (!match[3]) {
                     const now = new Date();
                     // If month is Jan(0) and we are in Dec(11), add 1 year
                     // If month is Dec(11) and we are in Jan(0), subtract 1 year?
                     // BUT: user says "26-dic" is NOT expired (so it's future or very recent).
                     // If today is Dec 20, 26-dic is future.
                     // If today is Jan 2025, 26-dic is past (Dec 2024).
                     
                     // Simple logic: If the date (with current year) is more than 6 months ago, assume it's next year.
                     // E.g. In July 2024, "Dec" is Dec 2024.
                     // In Jan 2025, "Dec" is likely Dec 2024 (past) or Dec 2025 (future).
                     // Bank summaries usually refer to recent past or near future.
                     
                     // Let's assume current year unless it makes the date WAY in the past (e.g. > 11 months ago)
                     // Actually, if we are in Jan, and date is Dec, it's likely previous year.
                     if (now.getMonth() === 0 && month === 11) {
                         // Careful: if current date is Jan 2025, Dec 2025 is 11 months away. Dec 2024 is 1 month ago.
                         // Most likely it refers to the PAST Dec (2024).
                         // BUT, if it is "Vence: 26-dic" and we are in Jan, then it IS overdue.
                         // If we are in Dec, 26-dic is current month.
                         
                         // If we are simply trying to SORT, we need consistent years.
                         year = now.getFullYear() - 1;
                     }
                }

                return new Date(year, month, day);
            }
        }
        
        return null;
    };

    // Helper to extract best vencimiento date
    const getVencimientoDate = (r) => {
        // 1. Try top level properties
        let v = r.vencimiento || r.Vencimiento;
        
        // 2. Try parsing Spanish date from top level
        let date = parseSpanishDate(v);
        if (date) return date;

        // 3. Try cycle_facturacion
        if (r.ciclo_facturacion) {
            try {
                const ciclo = typeof r.ciclo_facturacion === 'string' 
                    ? JSON.parse(r.ciclo_facturacion) 
                    : r.ciclo_facturacion;
                
                v = ciclo.vencimiento_actual || ciclo.vencimiento || ciclo.fecha_vencimiento;
                date = parseSpanishDate(v);
                if (date) return date;
            } catch (e) {
                // ignore
            }
        }
        return null;
    };

    // Helper to check if overdue
    const isOverdue = (r) => {
        if (isFullyPaid(r)) return false;
        
        // Check minimum paid (partial payment)
        // If minimum is paid, it is NOT considered overdue for alert purposes
        if (isPartiallyPaid(r)) return false;
        
        // Manual override from DB
        if (r.vencido === true || r.vencido === 'true') return true;
        if (r.vencido === false || r.vencido === 'false') return false;
        
        const vencimientoDate = getVencimientoDate(r);
        if (!vencimientoDate) return false;
        
        // Check if today is after vencimiento
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        vencimientoDate.setHours(0, 0, 0, 0);

        return today > vencimientoDate;
    };

    // Helper to format date
    const formatDate = (dateInput) => {
        if (!dateInput) return '';
        // If it's already a date object
        if (dateInput instanceof Date) {
             return dateInput.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
        }
        // If string
        const date = parseSpanishDate(dateInput);
        if (!date) return 'Fecha inválida';
        
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    };

    // --- Calculations for Chart & Lists ---
    
    // Group summaries by card (Banco + Tipo) to find the latest one for each
    const summariesByCard = resumenes.reduce((acc, r) => {
        const key = `${r.banco || 'Unknown'}-${r.tipo_tarjeta || 'Unknown'}`.toLowerCase();
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
    }, {});

    // For each card, find the latest summary based on vencimiento or id
    const latestSummaries = [];
    const replacedSummariesIds = new Set();
    const redundantSummariesIds = new Set();

    Object.values(summariesByCard).forEach(group => {
        // Sort by vencimiento descending (newest first)
        group.sort((a, b) => {
            const dateA = getVencimientoDate(a);
            const dateB = getVencimientoDate(b);
            
            // If both dates valid, compare dates (Newer date first)
            if (dateA && dateB) return dateB - dateA;

            // If only one is valid, valid comes first
            // (Assume invalid/missing date is older than valid date)
            if (dateA && !dateB) return -1;
            if (!dateA && dateB) return 1;

            // If neither valid or equal, fall back to ID (Higher ID = Newer)
            const idA = parseInt(a.id || a.Id || 0);
            const idB = parseInt(b.id || b.Id || 0);
            
            // Special case for duplicate dates or missing dates:
            if ((!dateA && !dateB) || (dateA && dateB && dateA.getTime() === dateB.getTime())) {
                 return idB - idA;
            }
            
            return 0;
        });
        
        if (group.length > 0) {
            const latest = group[0];
            latestSummaries.push(latest);
            const latestDate = getVencimientoDate(latest);
            
            // Mark others as replaced
            for (let i = 1; i < group.length; i++) {
                const current = group[i];
                replacedSummariesIds.add(current.id || current.Id);
                
                // Check redundancy (same date as latest)
                const currentDate = getVencimientoDate(current);
                if (latestDate && currentDate && latestDate.getTime() === currentDate.getTime()) {
                    redundantSummariesIds.add(current.id || current.Id);
                }
            }
        }
    });

    // --- Filtering for Table ---
    const filteredResumenes = resumenes.filter(r => {
        const matchesSearch = (r.banco || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.tipo_tarjeta || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Always hide redundant duplicates (same card, same date) to avoid confusion
        if (redundantSummariesIds.has(r.id || r.Id)) return false;

        const isPaid = isFullyPaid(r);
        const isVencido = isOverdue(r);
        
        // Check if it's the latest summary for this card
        const isLatest = !replacedSummariesIds.has(r.id || r.Id);

        // If showPaid is false (Default)
        // Show if:
        // 1. It is NOT fully paid
        // 2. AND (It is the Latest OR It is not Replaced)
        if (!showPaid) {
            // Hide if fully paid
            if (isPaid) return false;
            
            // Allow overdue items if they are not paid
            // (Previously we hid them, but user wants to see all debt)
            // if (isVencido) return false; // REMOVED to show overdue debts

            // Also hide replaced ones to keep list clean (only show latest active)
            // UNLESS it is unpaid and not replaced by a paid one?
            // Actually, if we have multiple unpaid summaries for the same card, we probably want to see them all?
            // Typically bank summaries are monthly. If I didn't pay last month, I have debt.
            // If I didn't pay this month, I have more debt.
            // The "replaced" logic assumes the new summary INCLUDES the old debt.
            // If the bank API returns cumulative debt in the new summary, then hiding the old one is correct.
            // If the bank API returns discrete monthly bills, then we need to see all unpaid ones.
            
            // Assuming cumulative for now (standard credit card behavior), so keep hiding replaced.
            if (!isLatest) return false; 
        }

        return true;
    });

    // Helper to calculate totalBalance correctly excluding duplicates
    const calculateTotalDebt = () => {
        const debtSummaries = resumenes.filter(r => {
            const isPaid = isFullyPaid(r);
            const isLatest = !replacedSummariesIds.has(r.id || r.Id);
            
            // Exclude paid
            if (isPaid) return false;
            // Exclude replaced (duplicates/old)
            if (!isLatest) return false;
            
            return true;
        });

        return debtSummaries.reduce((sum, r) => {
            let amount = 0;
            const totales = typeof r.totales === 'string' ? JSON.parse(r.totales) : (r.totales || {});
            
            // Sumar ARS si no está pagado
            if (!r.pagado_ars) {
                const totalPesos = parseFloat(totales.saldo_actual_pesos || totales.saldo_actual || 0);
                const pagadoPesos = parseFloat(totales.monto_pagado_pesos || 0);
                amount += Math.max(0, totalPesos - pagadoPesos);
            }
            
            // Sumar USD (convertido a ARS) si no está pagado
            if (!r.pagado_usd) {
                const totalUSD = parseFloat(totales.saldo_actual_dolares || 0);
                const pagadoUSD = parseFloat(totales.monto_pagado_dolares || 0);
                const remainingUSD = Math.max(0, totalUSD - pagadoUSD);
                
                if (remainingUSD > 0) {
                    const tipoCambioAprox = 1485; 
                    amount += remainingUSD * tipoCambioAprox;
                }
            }
            
            return sum + amount;
        }, 0);
    };

    const totalBalance = calculateTotalDebt();
    const pendingCount = filteredResumenes.length; // Use filtered length for count to match view

    const formatCurrency = (amount, currency = 'ARS') => {
        return formatAmount(amount, { currency });
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#09090b] text-white pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header - Mobile App Style */}
            <div className="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 pt-safe-top pb-2 px-4">
                <div className="flex items-center justify-between h-14">
                    <button 
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <h1 className="text-lg font-semibold tracking-tight">Resúmenes</h1>
                    <button 
                        onClick={() => setShowPaid(!showPaid)}
                        className={`p-2 -mr-2 rounded-full transition-colors ${showPaid ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <History className="w-5 h-5" />
                    </button>
            </div>

                {/* Total Balance Card - Compact & Modern */}
                <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-4 border border-white/5 shadow-xl mt-2 mb-2">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">Deuda Total</p>
                            <p className="text-2xl font-bold text-white tracking-tight">
                        {formatCurrency(totalBalance)}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                                <span className="text-zinc-400 text-xs font-medium">Pendientes</span>
                            </div>
                            <span className="text-xl font-semibold text-white">{pendingCount}</span>
                        </div>
                </div>
                </div>
            </div>

            {/* List Items */}
            <div className="flex-1 px-4 py-4 space-y-4">
                {filteredResumenes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 font-medium">
                            {showPaid ? 'No hay historial disponible' : '¡Todo al día! No tienes resúmenes pendientes'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredResumenes.map((resumen, idx) => {
                            // Extract totals and calculate remaining balance
                            let totalsObj = resumen.totales || {};
                            if (typeof resumen.totales === 'string') {
                                try {
                                    totalsObj = JSON.parse(resumen.totales);
                                } catch (e) {
                                    totalsObj = {};
                                }
                            }

                            // Calculate Pesos remaining
                            const totalPesos = parseFloat(totalsObj.saldo_actual_pesos || totalsObj.saldo_actual || 0);
                            const pagadoPesos = parseFloat(totalsObj.monto_pagado_pesos || 0);
                            let saldoPesos = Math.max(0, totalPesos - pagadoPesos);

                            // Calculate USD remaining
                            const totalUSD = parseFloat(totalsObj.saldo_actual_dolares || 0);
                            const pagadoUSD = parseFloat(totalsObj.monto_pagado_dolares || 0);
                            let saldoDolares = Math.max(0, totalUSD - pagadoUSD);
                            
                            // If fully paid via flags, force 0
                            if (resumen.pagado_ars) saldoPesos = 0;
                            if (resumen.pagado_usd) saldoDolares = 0;

                            const vencimientoDate = getVencimientoDate(resumen);
                            const isPaid = isFullyPaid(resumen);
                            const isMinPaid = isPartiallyPaid(resumen);
                            const isVencido = isOverdue(resumen);
                            const isReplaced = replacedSummariesIds.has(resumen.id || resumen.Id);
                            const showAsVencido = isVencido;

                            // Determine status color/icon
                            let statusColor = "bg-zinc-800 text-zinc-400";
                            let StatusIcon = Clock;
                            let statusText = "Pendiente";

                            if (isPaid) {
                                statusColor = "bg-green-500/10 text-green-500 border-green-500/20";
                                StatusIcon = CheckCircle;
                                statusText = "Pagado";
                            } else if (isVencido) {
                                statusColor = "bg-red-500/10 text-red-500 border-red-500/20";
                                StatusIcon = AlertCircle;
                                statusText = "Vencido";
                            } else if (isMinPaid) {
                                statusColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
                                StatusIcon = Clock;
                                statusText = "Parcial";
                            } else {
                                statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                            }

                            return (
                                <div 
                                    key={resumen.id || idx}
                                    className={`relative overflow-hidden bg-[#18181b] rounded-2xl p-4 border border-white/5 active:scale-[0.98] transition-all duration-200 shadow-sm ${showAsVencido ? 'opacity-80' : ''}`}
                                    onClick={() => onViewDetails && onViewDetails(resumen)}
                                >
                                    {/* Top Row: Icon + Bank + Status */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-white shadow-inner">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                            <div>
                                                <h3 className={`font-semibold text-base text-white leading-tight ${showAsVencido ? 'line-through text-white/50' : ''}`}>
                                                    {resumen.banco || 'Banco'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                {resumen.tipo_tarjeta && (
                                                        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                                                        {resumen.tipo_tarjeta}
                                                    </span>
                                                )}
                                                    {isReplaced && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                                                            ANT
                                                    </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusColor}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {statusText}
                                                    </span>
                                    </div>

                                    {/* Middle Row: Date */}
                                                {vencimientoDate && (
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5">
                                                <Clock className="w-3 h-3 text-zinc-400" />
                                                <span className={`text-xs font-medium ${showAsVencido ? 'text-red-400' : 'text-zinc-300'}`}>
                                                        Vence: {formatDate(vencimientoDate)}
                                                    </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Details: Show original total, paid, and pending if partial payment */}
                                    {(pagadoPesos > 0 || pagadoUSD > 0) && !isPaid && (
                                        <div className="mb-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div>
                                                    <span className="text-zinc-500 block mb-1 font-medium">Total Original</span>
                                                    <span className="text-zinc-300 font-semibold">{formatCurrency(totalPesos, 'ARS')}</span>
                                                    {totalUSD > 0 && <span className="text-emerald-400 text-[10px] block">+ {formatCurrency(totalUSD, 'USD')}</span>}
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500 block mb-1 font-medium">Pagado</span>
                                                    <span className="text-green-400 font-semibold">{formatCurrency(pagadoPesos, 'ARS')}</span>
                                                    {pagadoUSD > 0 && <span className="text-emerald-400 text-[10px] block">+ {formatCurrency(pagadoUSD, 'USD')}</span>}
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500 block mb-1 font-medium">Pendiente</span>
                                                    <span className="text-yellow-400 font-semibold">{formatCurrency(saldoPesos, 'ARS')}</span>
                                                    {saldoDolares > 0 && <span className="text-emerald-400 text-[10px] block">+ {formatCurrency(saldoDolares, 'USD')}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Row: Amounts + Action */}
                                    <div className="flex items-end justify-between pt-3 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                                                {(pagadoPesos > 0 || pagadoUSD > 0) && !isPaid ? 'Saldo Restante' : 'Total a Pagar'}
                                            </span>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-xl font-bold ${isPaid ? 'text-zinc-500' : 'text-white'}`}>
                                                {formatCurrency(saldoPesos, 'ARS')}
                                            </span>
                                            {saldoDolares > 0 && (
                                                    <span className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-1.5 rounded">
                                                        + {formatCurrency(saldoDolares, 'USD')}
                                                </span>
                                            )}
                                            </div>
                                        </div>
                                        
                                        {!isPaid ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPay && onPay(resumen, 'total');
                                                }}
                                                className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 active:bg-zinc-300 rounded-xl text-sm font-bold shadow-lg shadow-white/5 transition-all flex items-center gap-2"
                                            >
                                                Pagar
                                            </button>
                                        ) : (
                                            (() => {
                                                const totales = resumen.totales || {};
                                                const tieneARS = parseFloat(totales.saldo_actual_pesos || 0) > 0;
                                                const tieneUSD = parseFloat(totales.saldo_actual_dolares || 0) > 0;
                                                const pagadoARS = resumen.pagado_ars || false;
                                                const pagadoUSD = resumen.pagado_usd || false;
                                                
                                                // Es pago parcial si tiene ambas monedas pero solo pagó una
                                                const isPagoParcial = (tieneARS && tieneUSD) && (
                                                    (pagadoARS && !pagadoUSD) || (!pagadoARS && pagadoUSD)
                                                );
                                                
                                                if (isPagoParcial) {
                                                    // Mostrar botones separados para cada moneda pagada
                                                    return (
                                                        <div className="flex gap-2">
                                                            {pagadoARS && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onUndoPayment && onUndoPayment(resumen, 'ARS');
                                                                    }}
                                                                    className="px-3 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 active:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                                                    title="Deshacer pago en ARS"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                    </svg>
                                                                    ARS
                                                                </button>
                                                            )}
                                                            {pagadoUSD && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onUndoPayment && onUndoPayment(resumen, 'USD');
                                                                    }}
                                                                    className="px-3 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                                                    title="Deshacer pago en USD"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                    </svg>
                                                                    USD
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                } else {
                                                    // Pago completo - un solo botón
                                                    return (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onUndoPayment && onUndoPayment(resumen, null);
                                                            }}
                                                            className="px-5 py-2.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 active:bg-amber-500/40 border border-amber-500/30 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                            </svg>
                                                            Deshacer Pago
                                                        </button>
                                                    );
                                                }
                                            })()
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
