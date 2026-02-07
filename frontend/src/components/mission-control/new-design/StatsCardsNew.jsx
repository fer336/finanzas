import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal, DollarSign, Euro, Coins } from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import apiServices from '../../../services/api';

export const StatsCardsNew = ({ data, selectedMonth, debtStats }) => {
  const { formatAmount } = useAmountVisibility();
  const [previousMonthData, setPreviousMonthData] = useState(null);

  // Cargar datos del mes anterior para comparación
  useEffect(() => {
    const loadPreviousMonthData = async () => {
      if (!selectedMonth) return;

      try {
        // Calcular mes anterior
        const [year, month] = selectedMonth.split('-').map(Number);
        const prevDate = new Date(year, month - 2, 1); // month-2 porque los meses en JS son 0-indexed
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1; // +1 para formato YYYY-MM
        
        // Calcular fechas del mes anterior
        const startDate = new Date(prevYear, prevMonth - 1, 1);
        const endDate = new Date(prevYear, prevMonth, 0);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Obtener transacciones del mes anterior
        const prevTransactions = await apiServices.transaccionesApi.getAll(1000, 0, {
          fecha_desde: startDateStr,
          fecha_hasta: endDateStr
        });

        setPreviousMonthData({
          transacciones: prevTransactions?.list || []
        });
      } catch (error) {
        console.error('Error loading previous month data:', error);
        setPreviousMonthData(null);
      }
    };

    loadPreviousMonthData();
  }, [selectedMonth]);

  if (!data) return null;

  // Función auxiliar para calcular estadísticas de un conjunto de transacciones
  const calculateMonthStats = (transactions) => {
    const getTipo = (t) => (t.Tipo || t.tipo || '').toLowerCase();
    const getMonto = (t) => Math.abs(parseFloat(t.Monto || t.monto || 0));
    const esCredito = (t) => t.es_credito === true;
    const getMoneda = (t) => (t.Moneda || t.moneda || 'ARS').toUpperCase();

    // 💰 FILTRAR SOLO TRANSACCIONES EN ARS
    const transaccionesARS = transactions.filter(t => getMoneda(t) === 'ARS');

    const ingresos = transaccionesARS.filter(t => getTipo(t) === 'ingreso');
    
    // 💳 IMPORTANTE: Filtrar gastos EXCLUYENDO los de tarjeta de crédito
    // Los gastos de crédito no afectan el balance hasta que se pagan
    const gastos = transaccionesARS.filter(t => getTipo(t) === 'gasto');
    const gastosEfectivo = gastos.filter(t => !esCredito(t)); // Solo gastos que NO son a crédito

    const income = ingresos.reduce((sum, t) => sum + getMonto(t), 0);
    const expenses = gastosEfectivo.reduce((sum, t) => sum + getMonto(t), 0); // Solo efectivo
    const balance = income - expenses; // Balance real sin créditos

    return { balance, income, expenses };
  };

  // Calcular estadísticas del mes actual
  const calculateStats = () => {
    const currentTransactions = data.transacciones || [];
    const currentStats = calculateMonthStats(currentTransactions);
    
    // Calcular estadísticas del mes anterior (si existen)
    let previousStats = null;
    if (previousMonthData?.transacciones) {
      previousStats = calculateMonthStats(previousMonthData.transacciones);
    }

    // Función para calcular el porcentaje de cambio
    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    // Calcular tendencias
    const balanceTrend = previousStats ? calculateTrend(currentStats.balance, previousStats.balance) : 0;
    const incomeTrend = previousStats ? calculateTrend(currentStats.income, previousStats.income) : 0;
    const expensesTrend = previousStats ? calculateTrend(currentStats.expenses, previousStats.expenses) : 0;

    // Calcular total de deudas pendientes
    let totalPagosPendientes = 0;
    let totalResumenesPendientes = 0;

    if (debtStats) {
        totalPagosPendientes = debtStats.pendingPayments;
        // Use bankSummariesPendingOnly if available (Pending !minPaid), otherwise fallback to bankSummaries (Total Debt)
        // User requested "lo mismo que aparece en resuemens bancarios como pendiente", which is !minPaid
        totalResumenesPendientes = debtStats.bankSummariesPendingOnly !== undefined 
            ? debtStats.bankSummariesPendingOnly 
            : debtStats.bankSummaries; 
    } else {
        // Fallback Logic
    // 1. Pagos pendientes
    const pagosPendientes = (data.pagos || []).filter(p => {
      const estado = (p.Estado || p.estado || '').toString().toLowerCase();
      const isPaid = estado === 'pagado' || estado === 'true' || p.pagada === true;
      return !isPaid;
    });
        totalPagosPendientes = pagosPendientes.reduce((sum, p) =>
      sum + parseFloat(p.Monto || p.monto || 0), 0
    );

    // 2. Resúmenes bancarios pendientes (sin mínimo ni total pagado)
        // Note: This fallback uses raw list, which might be inconsistent with Dashboard logic
    const resumenesPendientes = (data.resumenesBancarios || []).filter(r =>
      !r.total_pagado && !r.minimo_pagado
    );
        totalResumenesPendientes = resumenesPendientes.reduce((sum, r) =>
      sum + parseFloat(r.totales?.saldo_actual_pesos || 0), 0
    );
    }

    // Total de deudas = pagos pendientes + resúmenes bancarios pendientes
    const totalDeudas = totalPagosPendientes + totalResumenesPendientes;

    // Para las deudas, no tiene sentido calcular tendencia mensual ya que son acumulativas
    // En su lugar, mostramos 0% (sin cambio) o podríamos implementar otra métrica
    const deudasTrend = 0;

    return {
      balance: currentStats.balance,
      balanceTrend: parseFloat(balanceTrend.toFixed(1)),
      income: currentStats.income,
      incomeTrend: parseFloat(incomeTrend.toFixed(1)),
      expenses: currentStats.expenses,
      expensesTrend: parseFloat(expensesTrend.toFixed(1)),
      deudas: totalDeudas,
      deudasTrend
    };
  };

  const stats = calculateStats();

  const formatCurrency = (amount) => {
    return formatAmount(amount, { decimals: 2 });
  };

  // 💰 Normalizar código de moneda (corregir errores comunes)
  const normalizeCurrency = (codigo) => {
    if (!codigo) return 'ARS';
    const normalized = codigo.toUpperCase().trim();
    
    // Corrección de códigos incorrectos
    const corrections = {
      'ARG': 'ARS',  // Error común: ARG → ARS
      'PESO': 'ARS',
      'PESOS': 'ARS',
      'DOLLAR': 'USD',
      'DOLLARS': 'USD',
      'DOLAR': 'USD',
      'DOLARES': 'USD'
    };
    
    return corrections[normalized] || normalized;
  };

  // 💰 Calcular estadísticas por moneda
  const currencyStats = useMemo(() => {
    if (!data?.transacciones) return [];

    const currencies = {};

    data.transacciones.forEach(t => {
      const moneda = normalizeCurrency(t.Moneda || t.moneda || 'ARS');
      const tipo = (t.Tipo || t.tipo || '').toLowerCase();
      const monto = Math.abs(parseFloat(t.Monto || t.monto || 0));
      const esCredito = t.es_credito === true;

      if (!currencies[moneda]) {
        currencies[moneda] = {
          codigo: moneda,
          ingresos: 0,
          gastos: 0,
          balance: 0,
          transaccionCount: 0
        };
      }

      currencies[moneda].transaccionCount++;

      if (tipo === 'ingreso') {
        currencies[moneda].ingresos += monto;
      } else if (tipo === 'gasto' && !esCredito) {
        currencies[moneda].gastos += monto;
      }
    });

    // Calcular balance y filtrar monedas sin movimientos REALES
    return Object.values(currencies)
      .map(curr => ({
        ...curr,
        balance: curr.ingresos - curr.gastos
      }))
      .filter(curr => {
        // Solo mostrar si tiene transacciones Y al menos ingresos o gastos > 0
        return curr.transaccionCount > 0 && (curr.ingresos > 0 || curr.gastos > 0);
      })
      .sort((a, b) => b.transaccionCount - a.transaccionCount); // Ordenar por cantidad de transacciones
  }, [data?.transacciones]);

  // Función para obtener el icono de la moneda
  const getCurrencyIcon = (codigo) => {
    const icons = {
      'USD': DollarSign,
      'EUR': Euro,
      'ARS': DollarSign,
      'BRL': DollarSign,
      'GBP': DollarSign
    };
    return icons[codigo] || Coins;
  };

  // Función para obtener el color de la moneda
  const getCurrencyColor = (codigo) => {
    const colors = {
      'USD': 'from-green-500 to-emerald-500',
      'EUR': 'from-purple-500 to-pink-500',
      'ARS': 'from-blue-500 to-cyan-500',
      'BRL': 'from-yellow-500 to-orange-500',
      'GBP': 'from-indigo-500 to-violet-500'
    };
    return colors[codigo] || 'from-gray-500 to-slate-500';
  };

  const StatCard = ({ title, amount, trend, colorClass, isExpense = false }) => {
    const isPositiveTrend = trend >= 0;
    const showTrendPositive = isExpense ? !isPositiveTrend : isPositiveTrend;

    return (
      <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <MoreHorizontal className="w-12 h-12" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{title}</p>
          <div className={`p-2 rounded-full ${isExpense ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
            <MoreHorizontal className={`w-4 h-4 ${isExpense ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
        </div>

        <div className="relative z-10">
          <p className={`tracking-tight text-3xl font-bold leading-tight ${colorClass} drop-shadow-sm`}>
            {formatCurrency(amount)}
          </p>
        </div>

        <div className={`flex items-center gap-1 text-sm font-medium relative z-10 ${showTrendPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
          {showTrendPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(trend)}%</span>
          <span className="text-muted-foreground ml-1 font-normal">vs mes anterior</span>
        </div>
      </div>
    );
  };

  // 💰 Card de Balance Total Multi-Moneda
  const MultiCurrencyBalanceTotalCard = () => {
    // Obtener solo monedas con movimientos
    const currenciesWithBalance = currencyStats.filter(curr => curr.transaccionCount > 0);

    if (currenciesWithBalance.length === 0) {
      return (
        <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Balance Total</p>
          </div>
          <div className="text-center py-8">
            <p className="text-zinc-400 text-sm">Sin transacciones</p>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <MoreHorizontal className="w-12 h-12" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Balance Total</p>
          <div className="p-2 rounded-full bg-blue-500/10">
            <Coins className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        {/* Balances por Moneda */}
        <div className="relative z-10 space-y-3">
          {currenciesWithBalance.map((currency, index) => {
            const Icon = getCurrencyIcon(currency.codigo);
            const gradient = getCurrencyColor(currency.codigo);
            
            return (
              <div 
                key={currency.codigo} 
                className={`flex items-center justify-between ${index !== currenciesWithBalance.length - 1 ? 'pb-3 border-b border-white/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-20`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">{currency.codigo}</p>
                    <p className={`text-2xl font-bold ${currency.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                      {formatCurrency(currency.balance)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">{currency.transaccionCount} tx</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-emerald-400">↗ {formatCurrency(currency.ingresos)}</span>
                    <span className="text-xs text-red-400">↘ {formatCurrency(currency.gastos)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nota informativa */}
        {currenciesWithBalance.length > 1 && (
          <div className="relative z-10 mt-2">
            <p className="text-xs text-zinc-500 text-center">
              {currenciesWithBalance.length} monedas activas este mes
            </p>
          </div>
        )}
      </div>
    );
  };

  // 💰 Card de Moneda Individual
  const CurrencyCard = ({ currency }) => {
    const Icon = getCurrencyIcon(currency.codigo);
    const gradient = getCurrencyColor(currency.codigo);

    return (
      <div className="glass-panel p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
        
        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-20`}>
              <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm sm:text-lg">{currency.codigo}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-zinc-400">{currency.transaccionCount} tx</span>
        </div>

        {/* Balance */}
        <div className="relative z-10">
          <p className="text-[10px] sm:text-xs text-zinc-400 mb-0.5 sm:mb-1">Balance</p>
          <p className={`text-lg sm:text-2xl font-bold ${currency.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(currency.balance)}
          </p>
        </div>

        {/* Ingresos y Gastos */}
        <div className="flex items-center justify-between relative z-10 text-xs sm:text-sm">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-400 font-medium truncate">{formatCurrency(currency.ingresos)}</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 flex-shrink-0" />
            <span className="text-red-400 font-medium truncate">{formatCurrency(currency.gastos)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Cards Principales - Balance Total Multi-Moneda y Deudas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MultiCurrencyBalanceTotalCard />
        <StatCard
          title="Deudas Pendientes"
          amount={stats.deudas}
          trend={stats.deudasTrend}
          colorClass="text-red-400"
          isExpense={true}
        />
      </div>

      {/* 💰 Cards de Monedas Individuales - Solo en Mobile y si hay transacciones con múltiples monedas */}
      {currencyStats.length > 0 && (
        <div className="md:hidden px-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold text-white">Totales por Moneda</h3>
            <span className="text-[10px] sm:text-xs text-zinc-400">{currencyStats.length} {currencyStats.length === 1 ? 'moneda' : 'monedas'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {currencyStats.map(currency => (
              <CurrencyCard key={currency.codigo} currency={currency} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


