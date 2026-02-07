import React from 'react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

export const BankSummariesSection = ({ data, onBankSummaryClick, onViewDetails }) => {
  const { formatAmount } = useAmountVisibility();

  if (!data) return null;

  // Helper to parse Spanish dates (e.g., "11-Dic-2024")
  const parseSpanishDate = (dateString) => {
    if (!dateString || dateString === '0') return null;
    const cleanStr = dateString.toString().toLowerCase().trim();
    if (cleanStr === 'invalid date') return null;
    let date = new Date(dateString);
    if (!isNaN(date.getTime()) && date.getFullYear() > 2000) return date;
    const months = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };
    // Improved regex to match FullView logic (optional year)
    const match = cleanStr.match(/(\d{1,2})[-/ .]+(?:de )?([a-z]{3,})(?:[-/ .]+(?:de )?(\d{2,4}))?/);
    if (match) {
        const day = parseInt(match[1]);
        const monthStr = match[2];
        let year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
        if (year < 100) year += 2000;
        const month = months[monthStr.substring(0, 3)];
        if (month !== undefined) {
             if (!match[3]) {
                 const now = new Date();
                 // Heuristic: If current month is Jan and date month is Dec, it's likely previous year
                 if (now.getMonth() === 0 && month === 11) year = now.getFullYear() - 1;
             }
            return new Date(year, month, day);
        }
    }
    return null;
  };

      const getVencimientoDate = (item) => {
          let v = item.vencimiento || item.Vencimiento;
          let date = parseSpanishDate(v);
          if (date) return date;
          if (item.ciclo_facturacion) {
              try {
                  const ciclo = typeof item.ciclo_facturacion === 'string' ? JSON.parse(item.ciclo_facturacion) : item.ciclo_facturacion;
                  v = ciclo.vencimiento_actual || ciclo.vencimiento || ciclo.fecha_vencimiento;
                  date = parseSpanishDate(v);
                  if (date) return date;
              } catch (e) {}
          }
          return null;
      };

  const isOverdue = (r) => {
      const isPaid = r.total_pagado === true || r.total_pagado === 'true' || r.total_pagado === 1;
      if (isPaid) return false;
      // Manual override
      if (r.vencido === true || r.vencido === 'true') return true;
      if (r.vencido === false || r.vencido === 'false') return false;

      const vencimientoDate = getVencimientoDate(r);
      if (!vencimientoDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      vencimientoDate.setHours(0, 0, 0, 0);
      return today > vencimientoDate;
  };

  // Filtrar resúmenes: Active only (Latest & Not Overdue & Not Paid)
  // Use same logic as FullView to determine active
  
  // 1. Group by card
  const summariesByCard = (data.resumenesBancarios || []).reduce((acc, r) => {
      const key = `${r.banco || 'Unknown'}-${r.tipo_tarjeta || 'Unknown'}`.toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
  }, {});

  const activeSummaries = [];
  
  Object.values(summariesByCard).forEach(group => {
      group.sort((a, b) => {
          const dateA = getVencimientoDate(a);
          const dateB = getVencimientoDate(b);
          // Standard date sort
          if (dateA && dateB) return dateB - dateA;
          if (dateA && !dateB) return -1;
          if (!dateA && dateB) return 1;
          // ID Fallback
          const idA = parseInt(a.id || a.Id || 0);
          const idB = parseInt(b.id || b.Id || 0);
          if ((!dateA && !dateB) || (dateA && dateB && dateA.getTime() === dateB.getTime())) {
               return idB - idA;
          }
          return 0;
      });

      // Check latest
      if (group.length > 0) {
          const latest = group[0];
          // Check if it's active: Not Fully Paid
          const isPaid = latest.total_pagado === true || latest.total_pagado === 'true' || latest.total_pagado === 1;
          
          // Include ALL unpaid summaries (including overdue and partial payments)
          if (!isPaid) {
              activeSummaries.push(latest);
          }
      }
  });

  // Calcular balance total (DEUDA TOTAL) - suma de todos los resúmenes ACTIVOS
  // Restar los pagos parciales realizados
  const totalBalance = activeSummaries.reduce((sum, r) => {
      let amount = parseFloat(r.totales?.saldo_actual_pesos || 0);
      const paid = parseFloat(r.totales?.monto_pagado_pesos || 0);
      if (amount === 0 && r.totales) {
           try {
              const totalesObj = typeof r.totales === 'string' ? JSON.parse(r.totales) : r.totales;
              amount = parseFloat(totalesObj.saldo_actual_pesos || totalesObj.saldo_actual || 0);
          } catch (e) {}
      }
      return sum + (amount - paid);
  }, 0);

  // Calcular balance total en DÓLARES (DEUDA TOTAL USD)
  const totalBalanceUSD = activeSummaries.reduce((sum, r) => {
      let amount = parseFloat(r.totales?.saldo_actual_dolares || 0);
      const paid = parseFloat(r.totales?.monto_pagado_dolares || 0);
      if (amount === 0 && r.totales) {
           try {
              const totalesObj = typeof r.totales === 'string' ? JSON.parse(r.totales) : r.totales;
              amount = parseFloat(totalesObj.saldo_actual_dolares || totalesObj.saldo_actual_usd || 0);
          } catch (e) {}
      }
      return sum + (amount - paid);
  }, 0);

  // For visualization, we use activeSummaries
  const resumenes = activeSummaries; // Replace raw list with processed list for UI mapping

  // Calcular resúmenes vencidos
  const vencidos = resumenes.filter(r => isOverdue(r));
  
  // Calcular resúmenes próximos a vencer (en los próximos 7 días)
  const proximosAVencer = resumenes.filter(r => {
    if (isOverdue(r)) return false; // No incluir los ya vencidos
    const vencimientoDate = getVencimientoDate(r);
    if (!vencimientoDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    return vencimientoDate >= today && vencimientoDate <= sevenDaysFromNow;
  });

  // Calcular límite total (para tarjetas de crédito) de las tarjetas mostradas
  const totalLimit = resumenes.reduce((sum, r) => {
    const limite = parseFloat(r.limites?.compras || r.limite_credito || r.LimiteCredito || 0);
    return sum + limite;
  }, 0);

  // Calcular porcentaje usado (para el círculo de progreso)
  const percentageUsed = totalLimit > 0 ? ((totalBalance / totalLimit) * 100) : 0;

  // Calcular stroke-dashoffset para el círculo
  const circumference = 2 * Math.PI * 40; // radio = 40
  const strokeDashoffset = circumference - (Math.min(percentageUsed, 100) / 100) * circumference;

  const formatCurrency = (amount, currency = 'ARS') => {
    return formatAmount(amount, { decimals: 2, currency });
  };

  return (
    <div className="glass-panel flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
          <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
          Resúmenes Bancarios {resumenes.length > 0 && <span className="text-muted-foreground text-sm font-normal">({resumenes.length})</span>}
        </h3>
        <button
          onClick={onViewDetails}
          className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors cursor-pointer"
        >
          Ver detalles
        </button>
      </div>
      <div className="flex flex-col p-6 gap-4">
        {/* Gráfico circular de progreso */}
        <div className="relative w-full h-40">
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
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Deuda Total</p>
            <p className="text-xl font-bold text-white tracking-tight leading-none">{formatCurrency(totalBalance)}</p>
            {totalBalanceUSD > 0 && (
                <p className="text-sm font-bold text-green-400 tracking-tight leading-none mt-1">{formatCurrency(totalBalanceUSD, 'USD')}</p>
            )}
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-xs text-red-400 mb-1">Vencidos</p>
            <p className="text-2xl font-bold text-white">
              {vencidos.length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatCurrency(
                vencidos.reduce((sum, r) => {
                  const amount = parseFloat(r.totales?.saldo_actual_pesos || 0);
                  const paid = parseFloat(r.totales?.monto_pagado_pesos || 0);
                  return sum + (amount - paid);
                }, 0)
              )}
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-400 mb-1">Próximos a Vencer</p>
            <p className="text-2xl font-bold text-white">
              {proximosAVencer.length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatCurrency(
                proximosAVencer.reduce((sum, r) => {
                  const amount = parseFloat(r.totales?.saldo_actual_pesos || 0);
                  const paid = parseFloat(r.totales?.monto_pagado_pesos || 0);
                  return sum + (amount - paid);
                }, 0)
              )}
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-400 mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-white">
              {resumenes.filter(r => !r.minimo_pagado && !isOverdue(r)).length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatCurrency(
                resumenes
                  .filter(r => !r.minimo_pagado && !isOverdue(r))
                  .reduce((sum, r) => {
                    const amount = parseFloat(r.totales?.saldo_actual_pesos || 0);
                    const paid = parseFloat(r.totales?.monto_pagado_pesos || 0);
                    return sum + (amount - paid);
                  }, 0)
              )}
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-xs text-green-400 mb-1">Pago Parcial</p>
            <p className="text-2xl font-bold text-white">
              {resumenes.filter(r => r.minimo_pagado && !r.total_pagado).length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatCurrency(
                resumenes
                  .filter(r => r.minimo_pagado && !r.total_pagado)
                  .reduce((sum, r) => {
                    const amount = parseFloat(r.totales?.saldo_actual_pesos || 0);
                    const paid = parseFloat(r.totales?.monto_pagado_pesos || 0);
                    return sum + (amount - paid);
                  }, 0)
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};