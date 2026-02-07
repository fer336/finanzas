import React, { useState } from 'react';
import { Plus, Bell, ArrowLeft, List, ArrowRight, TrendingUp, TrendingDown, Bot, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './auth/auth-provider';
import { UserMenu } from './auth/user-menu';
import { useIsMobile } from '../hooks/use-mobile';
import { useAmountVisibility } from '../contexts/AmountVisibilityContext';

// API Services
import apiServices from '../services/api';

// New Dashboard Design Components
import { StatsCardsNew } from './mission-control/new-design/StatsCardsNew';
import { MultiCurrencyBalanceWidget } from './mission-control/new-design/MultiCurrencyBalanceWidget';
import { RecentTransactionsSection } from './mission-control/new-design/RecentTransactionsSection';
import { BankSummariesSection } from './mission-control/new-design/BankSummariesSection';
import { CategoriesSection } from './mission-control/new-design/CategoriesSection';
import { PaymentMethodsSection } from './mission-control/new-design/PaymentMethodsSection';
import ModernTransactionForm from './ModernTransactionForm';
import BulkTransactionUpload from './BulkTransactionUpload';
import { TransactionFormView } from './mission-control/TransactionFormView';
import PendingPaymentFormView from './mission-control/PendingPaymentFormView';
import TransactionsFullView from './mission-control/new-design/TransactionsFullView';
import FinancialAgentChat from './FinancialAgentChat';

import { DollarQuoteWidget } from './mission-control/DollarQuoteWidget';
import { CategoryModal } from './mission-control/modals/CategoryModal';
import { PaymentMethodModal } from './mission-control/modals/PaymentMethodModal';
import { BankSummaryModal } from './mission-control/modals/BankSummaryModal';
import { PaymentModal } from './modals/PaymentModal';
import PendingPaymentsFullView from './mission-control/new-design/PendingPaymentsFullView';
import { BankSummariesFullView } from './mission-control/new-design/BankSummariesFullView';
import { PendingPaymentsChart } from './mission-control/new-design/PendingPaymentsChart';
import { TransactionsChart } from './mission-control/new-design/TransactionsChart';
import { DollarQuotesChart } from './mission-control/new-design/DollarQuotesChart';
import { CategoriesFullView } from './mission-control/new-design/CategoriesFullView';
import { PaymentMethodsFullView } from './mission-control/new-design/PaymentMethodsFullView';
import CurrencyManagementView from './mission-control/CurrencyManagementView';
import { AIUsageWidget } from './mission-control/AIUsageWidget';

// Navigation views
import { DollarView } from './dollar-view';
import { CedearsView } from './CedearsView';
import { ResumenGeneralView } from './resumen-general-view';
import { BankSummariesWidget } from './mission-control/new-design/BankSummariesWidget';
import { CategoriesWidget } from './mission-control/new-design/CategoriesWidget';
import { PaymentMethodsWidget } from './mission-control/new-design/PaymentMethodsWidget';
import { BudgetWidget } from './mission-control/BudgetWidget';
import { BudgetsFullView } from './mission-control/new-design/BudgetsFullView';
import { AIUsageFullView } from './mission-control/new-design/AIUsageFullView';
import { DeudaTarjetasWidget } from './mission-control/DeudaTarjetasWidget';
import PagarResumenModal from './mission-control/PagarResumenModal';
import TarjetasFullView from './mission-control/new-design/TarjetasFullView';
import ObjetivosWidget from './mission-control/ObjetivosWidget';
import ObjetivosFullView from './mission-control/new-design/ObjetivosFullView';
import ObjetivoFormModal from './mission-control/ObjetivoFormModal';
import PurchaseAnalyzerModal from './modals/PurchaseAnalyzerModal';
// Destructure API services
const {
  transaccionesApi, 
  pagosPendientesApi, 
  categoriesApi, 
  paymentMethodsApi, 
  resumenesBancariosApi
  // pagosApi // Added this as it was used in handleSavePayment but destructured from apiServices directly in code. 
  // actually in code: apiServices.pagosApi.registrarPago. 
  // The destructuring block is just for convenience but the code uses apiServices.X often.
} = apiServices;

const MissionControlDashboard = ({ onNavigate, initialView = 'dashboard' }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [currentView, setCurrentView] = useState(initialView); // 'dashboard', 'agent', 'transactions-full', 'add-transaction', 'pending-payments-full', 'settings', etc.

  // Update currentView when initialView prop changes
  React.useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
      
      // ✅ Abrir modal de carga masiva si es la vista inicial
      if (initialView === 'bulk-upload') {
        setShowBulkUpload(true);
      }
    }
  }, [initialView]);

  const [dollarQuotes, setDollarQuotes] = useState([]);
  // const [cedears, setCedears] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showPurchaseAnalyzer, setShowPurchaseAnalyzer] = useState(false);
  const [showObjetivoModal, setShowObjetivoModal] = useState(false);
  const [editingObjetivo, setEditingObjetivo] = useState(null);
  const [transactionModalKey, setTransactionModalKey] = useState(0);
  const [pendingPaymentToSettle, setPendingPaymentToSettle] = useState(null);
  const [chartTab, setChartTab] = useState('todo'); // 'todo', 'gasto', 'ingreso'

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showBankSummaryModal, setShowBankSummaryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [editingBankSummary, setEditingBankSummary] = useState(null);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentItem, setPaymentItem] = useState(null);
  
  // 💳 Tarjetas de Crédito
  const [showPagarResumenModal, setShowPagarResumenModal] = useState(false);
  const [deudaDataForModal, setDeudaDataForModal] = useState(null);
  const [paymentType, setPaymentType] = useState('pending_payment'); // 'pending_payment' or 'bank_summary'
  const [paymentAmount, setPaymentAmount] = useState('total'); // 'total' or 'minimo'
  
  // Date filter state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, add 1
    const monthStr = String(month).padStart(2, '0');
    const result = `${year}-${monthStr}`;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗓️  INITIALIZING CURRENT MONTH:');
    console.log('   Current Date:', now.toISOString());
    console.log('   Year:', year);
    console.log('   Month (getMonth()):', now.getMonth(), '(0-11)');
    console.log('   Month + 1:', month);
    console.log('   Formatted Month:', monthStr);
    console.log('   Result (selectedMonth):', result);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return result;
  });

  const [showDebtDetails, setShowDebtDetails] = useState(false);
  const [showMoneyDetails, setShowMoneyDetails] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingSuccessModal, setPendingSuccessModal] = useState(false);
  const [renderPriority, setRenderPriority] = useState(0);
  
  // 👁️ Control visibilidad de montos (Context)
  const { isAmountVisible, toggleAmountVisibility, formatAmount: formatAmountContext } = useAmountVisibility();
  
  // Helper para formatear montos con opción de formato corto (K)
  const formatAmount = (amount, options = {}) => {
    if (!isAmountVisible) return '••••••';
    
    const { short = false, decimals = 0 } = options;
    
    if (short && Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    
    return `$${amount.toLocaleString('es-AR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })}`;
  };

  // Progressive rendering effect
  React.useEffect(() => {
    if (!loading) {
      setRenderPriority(0);
      const timers = [
        setTimeout(() => setRenderPriority(prev => Math.max(prev, 1)), 100), // Top cards
        setTimeout(() => setRenderPriority(prev => Math.max(prev, 2)), 300), // Middle section
        setTimeout(() => setRenderPriority(prev => Math.max(prev, 3)), 600), // Charts
        setTimeout(() => setRenderPriority(prev => Math.max(prev, 4)), 900)  // Bottom section
      ];
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [loading]);

  // Show pending success modal when returning to dashboard
  React.useEffect(() => {
    if (currentView === 'dashboard' && pendingSuccessModal) {
      setShowSuccessModal(true);
      setPendingSuccessModal(false);
    }
  }, [currentView, pendingSuccessModal]);

  // Calculate total debt (Pending Payments + Bank Summaries)
  const totalDeuda = React.useMemo(() => {
    if (!dashboardData) return { total: 0, pendingPayments: 0, bankSummaries: 0, pendingCount: 0, summariesCount: 0 };

    let pendingCount = 0;
    const pendingPaymentsTotal = (dashboardData.pagos || []).reduce((sum, p) => {
      const isPaid = (p.Estado || p.estado || '').toString().toLowerCase() === 'pagado' || p.pagada === true;
      if (!isPaid) {
        pendingCount++;
        return sum + parseFloat(p.Monto || p.monto || 0);
      }
      return sum;
    }, 0);

    // --- Advanced Bank Summary Calculation (Matching Views) ---
    // Helper to parse Spanish dates (e.g., "11-Dic-2024") - Copied from Views
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

        // Check minimum paid (partial payment)
        const isMinPaid = r.minimo_pagado === true || r.minimo_pagado === 'true' || r.minimo_pagado === 1;
        if (isMinPaid) return false;

        // Manual override from DB
        if (r.vencido === true || r.vencido === 'true') return true;
        if (r.vencido === false || r.vencido === 'false') return false;

        const vencimientoDate = getVencimientoDate(r);
        if (!vencimientoDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        vencimientoDate.setHours(0, 0, 0, 0);
        return today > vencimientoDate;
    };

    // Group logic
    const summariesByCard = (dashboardData.resumenesBancarios || []).reduce((acc, r) => {
        const key = `${r.banco || 'Unknown'}-${r.tipo_tarjeta || 'Unknown'}`.toLowerCase();
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
    }, {});

    let bankSummariesTotal = 0;
    let bankSummariesPendingOnly = 0;
    let summariesCount = 0;
    let summariesPendingCount = 0;

    Object.values(summariesByCard).forEach(group => {
        // Same robust sort logic as in views
        group.sort((a, b) => {
            const dateA = getVencimientoDate(a);
            const dateB = getVencimientoDate(b);
            if (dateA && dateB) return dateB - dateA;
            if (dateA && !dateB) return -1;
            if (!dateA && dateB) return 1;
            const idA = parseInt(a.id || a.Id || 0);
            const idB = parseInt(b.id || b.Id || 0);
            if ((!dateA && !dateB) || (dateA && dateB && dateA.getTime() === dateB.getTime())) return idB - idA;
            return 0;
        });

        if (group.length > 0) {
            const latest = group[0];
            const isPaid = latest.total_pagado === true || latest.total_pagado === 'true' || latest.total_pagado === 1;
            
            // Reusing overdue logic (includes manual override check if prop exists, but mainly date)
            const overdue = isOverdue(latest);
            
            // Only sum if NOT paid AND NOT overdue (matching Full View logic)
            // User requirement: "vencido no se suma... solo pendientes"
            if (!isPaid && !overdue) {
                summariesCount++;
                let amount = parseFloat(latest.totales?.saldo_actual_pesos || 0);
                if (amount === 0 && latest.totales) {
                     try {
                        const totalesObj = typeof latest.totales === 'string' ? JSON.parse(latest.totales) : latest.totales;
                        amount = parseFloat(totalesObj.saldo_actual_pesos || totalesObj.saldo_actual || 0);
                    } catch (e) {}
                }
                bankSummariesTotal += amount;

                // Calculate Pending Only (Not Min Paid)
                const isMinPaid = latest.minimo_pagado === true || latest.minimo_pagado === 'true' || latest.minimo_pagado === 1;
                if (!isMinPaid) {
                    bankSummariesPendingOnly += amount;
                    summariesPendingCount++;
                }
            }
        }
    });

    return {
      total: pendingPaymentsTotal + bankSummariesPendingOnly,
      pendingPayments: pendingPaymentsTotal,
      bankSummaries: bankSummariesTotal,
      bankSummariesPendingOnly,
      pendingCount,
      summariesCount,
      summariesPendingCount
    };
  }, [dashboardData]);

  // 💳 Calculate total credit card debt
  const totalDeudaTarjetas = React.useMemo(() => {
    if (!dashboardData?.transacciones) return 0;
    
    return dashboardData.transacciones
      .filter(t => t.es_credito === true && !t.fecha_pago_real) // Solo crédito pendiente
      .reduce((sum, t) => sum + Math.abs(t.monto || 0), 0);
  }, [dashboardData?.transacciones]);

  // 💰 Función para normalizar códigos de moneda
  const normalizeCurrency = React.useCallback((codigo) => {
    if (!codigo) return 'ARS';
    const normalized = codigo.toUpperCase().trim();
    const corrections = {
      'ARG': 'ARS',
      'PESO': 'ARS',
      'PESOS': 'ARS',
      'DOLLAR': 'USD',
      'DOLLARS': 'USD',
      'DOLAR': 'USD',
      'DOLARES': 'USD'
    };
    return corrections[normalized] || normalized;
  }, []);

  // Calculate monthly stats BY CURRENCY (no mezclar monedas)
  const monthlyStatsByCurrency = React.useMemo(() => {
    if (!dashboardData?.transacciones) return {};

    const currentTransactions = dashboardData.transacciones;
    const getTipo = (t) => (t.Tipo || t.tipo || '').toLowerCase();
    const getMonto = (t) => Math.abs(parseFloat(t.Monto || t.monto || 0));
    const getMoneda = (t) => normalizeCurrency(t.Moneda || t.moneda || 'ARS');
    const esCredito = (t) => t.es_credito === true;

    const statsByCurrency = {};

    currentTransactions.forEach(t => {
      const moneda = getMoneda(t);
      const tipo = getTipo(t);
      const monto = getMonto(t);
      const credito = esCredito(t);

      if (!statsByCurrency[moneda]) {
        statsByCurrency[moneda] = { income: 0, expenses: 0, balance: 0 };
      }

      if (tipo === 'ingreso') {
        statsByCurrency[moneda].income += monto;
      } else if (tipo === 'gasto' && !credito) {
        // Solo contar gastos que NO son a crédito
        statsByCurrency[moneda].expenses += monto;
      }
    });

    // Calcular balance por moneda
    Object.keys(statsByCurrency).forEach(moneda => {
      statsByCurrency[moneda].balance = statsByCurrency[moneda].income - statsByCurrency[moneda].expenses;
    });

    return statsByCurrency;
  }, [dashboardData, normalizeCurrency]);

  // Monthly stats LEGACY (solo para compatibilidad - usa ARS)
  const monthlyStats = React.useMemo(() => {
    const arsStats = monthlyStatsByCurrency['ARS'] || { balance: 0, income: 0, expenses: 0 };
    return arsStats;
  }, [monthlyStatsByCurrency]);


  // Load dashboard data when month changes (moved to line 389)

  const loadDashboardData = async (showLoading = true) => {
    const startTime = performance.now(); // ⏱️ Performance monitoring

    try {
      if (showLoading) setLoading(true);
      
      console.log('🚀 INICIANDO CARGA DE DASHBOARD...');

      // Calculate start and end dates for selected month
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 CARGA PROGRESIVA - FASE 1: DATOS CRÍTICOS');
      console.log('   Selected Month:', selectedMonth);
      console.log('   Period:', startDateStr, 'to', endDateStr);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 🎯 FASE 1: DATOS CRÍTICOS (mostrar inmediatamente)
      const criticalResults = await Promise.allSettled([
        apiServices.transaccionesApi.getAll(1000, 0, {
          fecha_desde: startDateStr,
          fecha_hasta: endDateStr
        }),
        apiServices.pagosPendientesApi.getAll(100, 0),
        apiServices.resumenesBancariosApi.getAll(100, 0)
      ]);

      const transacciones = criticalResults[0].status === 'fulfilled'
        ? criticalResults[0].value
        : { list: [], pageInfo: { totalRows: 0 } };

      const pagos = criticalResults[1].status === 'fulfilled'
        ? criticalResults[1].value
        : { list: [] };

      const resumenesBancarios = criticalResults[2].status === 'fulfilled'
        ? criticalResults[2].value
        : { list: [] };

      // ✅ MOSTRAR DATOS CRÍTICOS INMEDIATAMENTE (2-3 segundos)
      const phase1Time = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`⚡ FASE 1 COMPLETADA EN ${phase1Time}s`);
      console.log('   📊 Transactions:', transacciones?.list?.length || 0);
      console.log('   💸 Pending Payments:', pagos?.list?.length || 0);
      console.log('   🏦 Bank Summaries:', resumenesBancarios?.list?.length || 0);

      setDashboardData({
        transacciones: transacciones?.list || [],
        pagos: pagos?.list || [],
        resumenesBancarios: resumenesBancarios?.list || [],
        categorias: [],
        metodosPago: [],
        presupuestos: [],
        estadisticas: {
          total_ingresos: 0,
          total_gastos: 0,
          balance_neto: 0,
          numero_transacciones: 0
        }
      });

      setLoading(false); // ✅ Usuario ya ve el dashboard!

      // 🎯 FASE 2: DATOS SECUNDARIOS (en background)
      console.log('🔄 FASE 2: CARGANDO DATOS SECUNDARIOS...');

      const secondaryResults = await Promise.allSettled([
        apiServices.transaccionesApi.getEstadisticas(startDateStr, endDateStr),
        apiServices.categoriasApi.getAll(100, 0),
        apiServices.metodosPagoApi.getAll(100, 0),
        apiServices.presupuestosApi.getAll(100, 0)
      ]);

      const estadisticas = secondaryResults[0].status === 'fulfilled'
        ? secondaryResults[0].value
        : { total_ingresos: 0, total_gastos: 0, balance_neto: 0, numero_transacciones: 0 };

      const categorias = secondaryResults[1].status === 'fulfilled'
        ? secondaryResults[1].value
        : { list: [] };

      const metodosPago = secondaryResults[2].status === 'fulfilled'
        ? secondaryResults[2].value
        : { list: [] };

      const presupuestos = secondaryResults[3].status === 'fulfilled'
        ? secondaryResults[3].value
        : { list: [] };

      // ✅ ACTUALIZAR CON DATOS SECUNDARIOS
      setDashboardData(prev => ({
        ...prev,
        estadisticas: estadisticas,
        categorias: categorias?.list || [],
        metodosPago: metodosPago?.list || [],
        presupuestos: presupuestos?.list || []
      }));

      // Performance monitoring
      const endTime = performance.now();
      const totalTime = ((endTime - startTime) / 1000).toFixed(2);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ DASHBOARD COMPLETADO:`);
      console.log(`   ⚡ Fase 1 (crítico): ${phase1Time}s`);
      console.log(`   🔄 Fase 2 (secundario): ${(totalTime - parseFloat(phase1Time)).toFixed(2)}s`);
      console.log(`   ⏱️  TOTAL: ${totalTime}s`);
      console.log(`   📊 Transacciones: ${transacciones?.list?.length || 0}`);
      console.log(`   💸 Pagos: ${pagos?.list?.length || 0}`);
      console.log(`   🏷️  Categorías: ${categorias?.list?.length || 0}`);
      console.log(`   💳 Métodos: ${metodosPago?.list?.length || 0}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Log warnings for failed requests
      [criticalResults, secondaryResults].flat().forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpoints = [
            'transacciones', 'pagos', 'resumenes',
            'estadisticas', 'categorias', 'metodosPago', 'presupuestos'
          ];
          console.warn(`⚠️ ${endpoints[index]} failed:`, result.reason?.message || result.reason);
        }
      });
    } catch (error) {
      const endTime = performance.now();
      const loadTime = ((endTime - startTime) / 1000).toFixed(2);
      console.error(`❌ ERROR LOADING DASHBOARD (${loadTime}s):`, error);
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
      alert(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load dollar quotes
  const loadDollarQuotes = async () => {
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares');
      const data = await response.json();
      
      const quotesData = {
        oficial: data.find(d => d.casa === 'oficial') || {},
        blue: data.find(d => d.casa === 'blue') || {},
        tarjeta: data.find(d => d.casa === 'tarjeta') || {},
        mayorista: data.find(d => d.casa === 'mayorista') || {},
        mep: data.find(d => d.casa === 'bolsa') || {},
        ccl: data.find(d => d.casa === 'contadoconliqui') || {},
        cripto: data.find(d => d.casa === 'cripto') || {}
      };

      setDollarQuotes([
        { title: 'Oficial', data: quotesData.oficial, color: '#3b82f6' },
        { title: 'Blue', data: quotesData.blue, color: '#10b981' },
        { title: 'Tarjeta', data: quotesData.tarjeta, color: '#ef4444' },
        { title: 'Mayorista', data: quotesData.mayorista, color: '#f59e0b' },
        { title: 'MEP', data: quotesData.mep, color: '#8b5cf6' },
        { title: 'CCL', data: quotesData.ccl, color: '#ec4899' },
        { title: 'Cripto', data: quotesData.cripto, color: '#06b6d4' }
      ]);
    } catch (error) {
      console.error('❌ Error loading dollar quotes:', error);
    }
  };

  // Load CEDEARs (you can implement this with your backend later)
  const loadCedears = async () => {
    try {
      // TODO: Implement CEDEARs API endpoint
      // For now, set empty array
      // setCedears([]);
    } catch (error) {
      console.error('❌ Error loading CEDEARs:', error);
    }
  };

  /* eslint-disable no-unused-vars */
  // Funciones de recarga individuales para cada sección
  const refreshPendingPayments = async () => {
    try {
      const pagos = await pagosPendientesApi.getAll({ limit: 100 });
      setDashboardData(prev => ({
        ...prev,
        pagos: pagos?.list || []
      }));
    } catch (error) {
      console.error('❌ Error refreshing pending payments:', error);
    }
  };

  const refreshTransactions = async () => {
    try {
      const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
      const firstDay = new Date(selectedYear, selectedMonthNum - 1, 1);
      const lastDay = new Date(selectedYear, selectedMonthNum, 0);
      
      const params = {
        limit: 1000,
        fecha_desde: firstDay.toISOString().split('T')[0],
        fecha_hasta: lastDay.toISOString().split('T')[0]
      };
      
      const [transacciones, estadisticas] = await Promise.all([
        transaccionesApi.getAll(params),
        transaccionesApi.getEstadisticas(params)
      ]);
      
      setDashboardData(prev => ({
        ...prev,
        transacciones: transacciones?.list || [],
        estadisticas: estadisticas
      }));
    } catch (error) {
      console.error('❌ Error refreshing transactions:', error);
    }
  };

  const refreshBankSummaries = async () => {
    try {
      const resumenes = await resumenesBancariosApi.getAll({ limit: 100 });
      setDashboardData(prev => ({
        ...prev,
        resumenesBancarios: resumenes?.list || []
      }));
    } catch (error) {
      console.error('❌ Error refreshing bank summaries:', error);
    }
  };

  const refreshDollarQuotes = async () => {
    await loadDollarQuotes();
  };

  const refreshCategories = async () => {
    try {
      const categorias = await categoriesApi.getAll({ limit: 100 });
      setDashboardData(prev => ({
        ...prev,
        categorias: categorias?.list || []
      }));
    } catch (error) {
      console.error('❌ Error refreshing categories:', error);
    }
  };

  const refreshPaymentMethods = async () => {
    try {
      const metodosPago = await paymentMethodsApi.getAll({ limit: 100 });
      setDashboardData(prev => ({
        ...prev,
        metodosPago: metodosPago?.list || []
      }));
    } catch (error) {
      console.error('❌ Error refreshing payment methods:', error);
    }
  };

  const refreshCedears = async () => {
    await loadCedears();
  };
  /* eslint-enable no-unused-vars */

  // Load data on mount and when month changes
  React.useEffect(() => {
    console.log('🔄 useEffect EJECUTADO - Cargando datos del dashboard...');
    console.log('   selectedMonth:', selectedMonth);
    loadDashboardData();
    loadDollarQuotes();
    loadCedears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Refresh quotes every 5 minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadDollarQuotes();
      loadCedears();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Modal handlers
  const openModal = (modalType, item = null) => {
    console.log('🔓 Opening modal:', modalType);
    console.log('📝 Item to edit:', item);
    setActiveModal(modalType);
    setEditingItem(item);
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingItem(null);
  };

  // Quick action handlers
  const handleQuickAction = (action) => {
    if (action === 'transaction') {
      handleOpenAddTransaction();
    } else if (action === 'bulk_upload') {
      setShowBulkUpload(true);
    } else if (action === 'category') {
      setCurrentView('categories-full');
    } else if (action === 'budget') {
      // TODO: Implement budgets view
      alert('Budgets view in development');
    } else if (action === 'goal') {
      // TODO: Implement goals view
      alert('Goals view in development');
    } else if (action === 'agent') {
      setCurrentView('agent');
    } else {
      openModal(action);
    }
  };

  // Handler for when transaction is successfully saved by the modal
  const handleTransactionSuccess = async (savedData) => {
    console.log('✅ Transaction saved by modal, reloading dashboard...');
    await loadDashboardData();
    setShowTransactionModal(false);
    setEditingItem(null);
    setShowSuccessModal(true);
  };

  // Handler to save transaction (Legacy/Direct use)
  const handleSaveTransaction = async (transactionData) => {
    try {
      console.log('💾 Saving transaction:', transactionData);
      console.log('📝 Editing item:', editingItem);
      
      if (editingItem && (editingItem.id || editingItem.Id) && !pendingPaymentToSettle) {
        // Support both ID formats
        const transactionId = editingItem.Id || editingItem.id;
        console.log('✏️ Updating transaction ID:', transactionId);
        await apiServices.transaccionesApi.update(transactionId, transactionData);
        console.log('✅ Transaction updated successfully');
      } else {
        console.log('➕ Creating new transaction');
        await apiServices.transaccionesApi.create(transactionData);
        console.log('✅ Transaction created successfully');
      }
      
      // If we are settling a pending payment, update its status
      if (pendingPaymentToSettle) {
        const paymentId = pendingPaymentToSettle.id || pendingPaymentToSettle.Id;
        console.log('✅ Marking pending payment as paid:', paymentId);
        
        // We can use pagosApi.registrarPago if we want to be consistent with other payment flows,
        // OR just update status if we already created the transaction manually above.
        // Since we manually created the transaction via transaccionesApi.create,
        // we should probably just update the status to avoid double transaction creation
        // if registrarPago does that.
        // Let's check what handleSavePayment did... it called registrarPago THEN create transaction.
        
        // Ideally, we should just update the status here.
        await apiServices.pagosPendientesApi.update(paymentId, { Estado: 'pagado', estado: 'pagado' });
        setPendingPaymentToSettle(null);
      }

      // Handle post-save actions
      if (editingItem) {
        // If editing, close modal and cleanup
      setShowTransactionModal(false);
      setEditingItem(null);
        if (currentView !== 'transactions-full') {
      setCurrentView('dashboard');
        }
      } else {
        // If creating new transaction, reset form but keep modal open
        // We rely on the form component to reset its state if passed a success callback or if we manage state here.
        // Since TransactionFormView manages its own state, we need to signal it to reset.
        // However, MissionControlDashboard controls the modal open state.
        // If we simply don't close the modal, the form state persists.
        // To reset the form, we can either:
        // 1. Pass a key to the form component that we change on successful save (forcing re-mount/reset)
        // 2. Pass a reset callback to the form
        
        // Let's try forcing a re-mount of the modal content by toggling a key or similar.
        // Or simpler: We can momentarily close and reopen, but that flashes.
        
        // Ideally, TransactionFormView should have a prop `resetOnSuccess` or similar.
        // But we are calling `onSave` from the form. 
        
        // Let's alert success and let user know they can add another.
        // And we need to clear the form.
        // Since we cannot easily access the child component's state from here without ref,
        // We can change how we render TransactionModal.
        // But first, let's just keep it open. The user asked to clear fields.
        
        // We can use a "key" on the TransactionModal to force re-render
        setTransactionModalKey(prev => prev + 1);
        setShowSuccessModal(true);
      }

      // Reload data in background (after showing success modal)
      loadDashboardData(false); // Pass false to avoid showing full screen loader
    } catch (error) {
      console.error('❌ Error saving transaction:', error);
      alert('Error saving transaction: ' + error.message);
    }
  };

  // Handler to open transaction form (MODAL version)
  const handleOpenAddTransaction = (transaction = null) => {
    setEditingItem(transaction);
    setShowTransactionModal(true);
    // Don't switch view, stay on dashboard or full view
  };

  // Handler to cancel transaction
  const handleCancelTransaction = () => {
    setEditingItem(null);
    setCurrentView('dashboard');
  };

  const handleDeleteTransaction = async (transactionOrId) => {
    try {
      // Acepta tanto un objeto {id} como un string ID directo
      const transactionId = typeof transactionOrId === 'string'
        ? transactionOrId
        : (transactionOrId?.id || transactionOrId?.Id);
      
      if (!transactionId) {
        console.error('❌ No se encontró ID de transacción:', transactionOrId);
        return false;
      }
      await apiServices.transaccionesApi.delete(transactionId);
      console.log('✅ Transaction deleted successfully');
      await loadDashboardData(false); // Silent refresh
      return true;
    } catch (error) {
      console.error('❌ Error deleting transaction:', error);
      alert('Error al eliminar la transacción: ' + error.message);
      return false;
    }
  };



  // Handler to save pending payment
  const handleSavePendingPayment = async (paymentData) => {
    try {
      console.log('💾 Saving pending payment:', paymentData);
      console.log('📝 Editing item:', editingItem);
      
      const isUpdating = !!editingItem;
      const isPayingNow = editingItem && editingItem._isPayingNow; // Check special flag
      const isNowPaid = paymentData.Estado === 'pagado' || paymentData.estado === 'pagado' || paymentData.status === 'pagado';
      
      // Determine if we need to create a transaction
      // - When coming from "Pagar" button (_isPayingNow flag)
      // - OR when manually changing status from unpaid to paid
      const wasAlreadyPaid = editingItem && !isPayingNow && (
        editingItem.Estado === 'pagado' || 
        editingItem.estado === 'pagado' || 
        editingItem.Estado === true || 
        editingItem.estado === true
      );
      const shouldCreateTransaction = isNowPaid && (isPayingNow || !wasAlreadyPaid);
      
      console.log('💡 Creating transaction?', shouldCreateTransaction, '(isPayingNow:', isPayingNow, ', isNowPaid:', isNowPaid, ')');
      
      if (isUpdating) {
        // Update existing payment
        const paymentId = editingItem.Id || editingItem.id;
        console.log('✏️ Updating payment ID:', paymentId);
        
        // If marking as paid for first time, create transaction automatically
        if (shouldCreateTransaction) {
          console.log('💰 Creating automatic expense transaction for paid pending payment...');
          
          // Get current date in local timezone (avoid UTC offset issues)
          const today = new Date();
          const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
            .toISOString()
            .split('T')[0];
          
          const expenseTransaction = {
            tipo: 'gasto',
            descripcion: paymentData.Descripcion || paymentData.descripcion || paymentData.Nombre || paymentData.nombre,
            monto: parseFloat(paymentData.Monto || paymentData.monto || 0),
            moneda: paymentData.Moneda || paymentData.moneda || 'ARS',
            fecha_transaccion: localDate,
            categoria_id: paymentData.categorias_id || paymentData.categoria_id || null,
            metodo_pago_id: paymentData.metodos_pago_id || paymentData.metodo_pago_id || null,
            notas: `Pago de: ${paymentData.Nombre || paymentData.nombre}\nID Pago Pendiente: ${paymentId}`,
            comprobante: paymentData.comprobante || paymentData.Comprobante || ''
          };
          
          await apiServices.transaccionesApi.create(expenseTransaction);
          console.log('✅ Expense transaction created');
        }
        
        await apiServices.pagosPendientesApi.update(paymentId, paymentData);
        console.log('✅ Payment updated successfully');
      } else {
        // Create new payment
        console.log('➕ Creating new payment');
        await apiServices.pagosPendientesApi.create(paymentData);
        console.log('✅ Payment created successfully');
      }
      
      // Reload data
      await loadDashboardData();
      closeModal();
      
    } catch (error) {
      console.error('❌ Error saving pending payment:', error);
      throw error; // Propagate error so form handles it
    }
  };

  // Handler to cancel pending payment form
  const handleCancelPendingPayment = () => {
    closeModal();
    // Don't force redirect, let it return to underlying view
  };



  const handleDeletePendingPayment = async (payment) => {
    const paymentName = payment.Nombre || payment.nombre || 'este pago';
    const confirmMessage = `¿Estás seguro de que deseas eliminar el pago pendiente "${paymentName}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      const paymentId = payment.id || payment.Id;
      console.log('🗑️ Deleting pending payment ID:', paymentId);
      await apiServices.pagosPendientesApi.delete(paymentId);
      console.log('✅ Pending payment deleted successfully');
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Error deleting pending payment:', error);
      alert('Error al eliminar el pago pendiente: ' + error.message);
    }
  };

  // Handler to close agent
  const handleCloseAgent = () => {
    setCurrentView('dashboard');
  };

  // Handler to change month
  const handleMonthChange = (direction) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  // Handlers for Categories
  const handleSaveCategory = async (categoryData) => {
    try {
      console.log('💾 Saving category:', categoryData);
      
      if (editingCategory) {
        const categoryId = editingCategory.Id || editingCategory.id;
        console.log('✏️ Updating category ID:', categoryId);
        await apiServices.categoriasApi.update(categoryId, categoryData);
        console.log('✅ Category updated successfully');
      } else {
        console.log('➕ Creating new category');
        await apiServices.categoriasApi.create(categoryData);
        console.log('✅ Category created successfully');
      }
      
      await loadDashboardData();
      setShowCategoryModal(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('❌ Error saving category:', error);
      throw error;
    }
  };



  // Handlers for Payment Methods
  const handleSavePaymentMethod = async (paymentMethodData) => {
    try {
      console.log('💾 Saving payment method:', paymentMethodData);
      
      if (editingPaymentMethod) {
        const methodId = editingPaymentMethod.Id || editingPaymentMethod.id;
        console.log('✏️ Updating payment method ID:', methodId);
        await apiServices.metodosPagoApi.update(methodId, paymentMethodData);
        console.log('✅ Payment method updated successfully');
      } else {
        console.log('➕ Creating new payment method');
        await apiServices.metodosPagoApi.create(paymentMethodData);
        console.log('✅ Payment method created successfully');
      }
      
      await loadDashboardData();
      setShowPaymentMethodModal(false);
      setEditingPaymentMethod(null);
    } catch (error) {
      console.error('❌ Error saving payment method:', error);
      throw error;
    }
  };



  // Handlers for Bank Summaries
  const handleSaveBankSummary = async (bankSummaryData) => {
    try {
      console.log('💾 Saving bank summary:', bankSummaryData);
      
      if (editingBankSummary) {
        const summaryId = editingBankSummary.id;
        console.log('✏️ Updating bank summary ID:', summaryId);
        await apiServices.resumenesBancariosApi.update(summaryId, bankSummaryData);
        console.log('✅ Bank summary updated successfully');
      } else {
        console.log('➕ Creating new bank summary');
        await apiServices.resumenesBancariosApi.create(bankSummaryData);
        console.log('✅ Bank summary created successfully');
      }
      
      await loadDashboardData();
      setShowBankSummaryModal(false);
      setEditingBankSummary(null);
    } catch (error) {
      console.error('❌ Error saving bank summary:', error);
      throw error;
    }
  };

  const handleDeleteBankSummary = async (bankSummary) => {
    try {
      const summaryId = bankSummary.id;
      console.log('🗑️ Deleting bank summary ID:', summaryId);
      
      await apiServices.resumenesBancariosApi.delete(summaryId);
      console.log('✅ Bank summary deleted successfully');
      
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Error deleting bank summary:', error);
      alert('Error al eliminar el resumen bancario. Por favor, inténtalo de nuevo.');
    }
  };

  /* eslint-disable no-unused-vars */
  const handlePayPendingPayment = (payment) => {
    console.log('💳 Opening edit form to pay pending payment:', payment);
    
    // Open the edit form with the payment pre-filled and status set to "pagado"
    // Add a special flag to indicate this is a "pay action"
    const paymentToPay = {
      ...payment,
      Estado: 'pagado', // Pre-set status to paid
      _isPayingNow: true // Special flag to trigger transaction creation
    };
    
    openModal('pendingPayment', paymentToPay);
  };

  const handlePayBankSummary = (summary, paymentAmount) => {
    console.log('💳 Opening payment modal for bank summary:', summary, 'Amount type:', paymentAmount);
    setPaymentItem(summary);
    setPaymentType('bank_summary');
    setPaymentAmount(paymentAmount); // 'total' or 'minimo'
    setShowPaymentModal(true);
  };
  /* eslint-enable no-unused-vars */

  const handleSavePayment = async (formData) => {
    try {
      console.log('💾 Saving payment:', formData);
      
      // Detect payment type based on amounts
      let calculatedPaymentType = paymentAmount; // default to what was selected
      
      if (paymentType === 'bank_summary' && paymentItem) {
          let totales = paymentItem.totales;
          if (typeof totales === 'string') {
              try {
                  totales = JSON.parse(totales);
              } catch(e) {
                  totales = {};
              }
          }
          totales = totales || {};
          
          const debtARS = parseFloat(totales.saldo_actual_pesos || 0);
          const debtUSD = parseFloat(totales.saldo_actual_dolares || 0);
          
          const payARS = parseFloat(formData.monto || 0);
          const payUSD = parseFloat(formData.montoUSD || 0);
          
          // Check if total debt is covered (with tolerance)
          // A currency is covered if debt is <= 0 OR payment >= debt - tolerance
          const coversTotalARS = debtARS <= 0 || (payARS >= debtARS - 10); // $10 tolerance
          const coversTotalUSD = debtUSD <= 0 || (payUSD >= debtUSD - 1); // u$d 1 tolerance
          
          // Only send 'total' if BOTH currencies are fully covered
          if (coversTotalARS && coversTotalUSD) {
              calculatedPaymentType = 'total';
          } else {
              // If not fully covering total, treat as partial
              // (Backend will check if it covers minimum and set flags accordingly)
              calculatedPaymentType = 'parcial';
          }
          console.log(`💰 Payment Type Calculation:
             Debt: ARS ${debtARS}, USD ${debtUSD}
             Pay:  ARS ${payARS}, USD ${payUSD}
             Covers: ARS ${coversTotalARS}, USD ${coversTotalUSD}
             Result: ${calculatedPaymentType} (Initial: ${paymentAmount})`);
      }
      
      // Prepare payment data for backend
      // We send ARS amount as primary 'monto' for compatibility, but could enhance backend to support dual currency
      // For now, we mainly use the frontend-side transaction creation to handle the dual records.
      // If we are paying a bank summary, the backend 'registrarPago' might update status.
      // We will assume paying ANY amount counts as a payment interaction.
      const pagoData = {
        item_id: paymentItem.id,
        item_type: paymentType,
        payment_type: calculatedPaymentType, // 'total', 'minimo' or 'parcial'
        monto: formData.monto || 0, // Primary amount (ARS) - ensure number
        monto_usd: formData.montoUSD || 0, // USD amount - ensure number
        tipo_cambio: formData.tipo_cambio || null, // Exchange rate - empty string causes 422
        pesos_para_usd: formData.pesos_para_usd || 0, // Pesos used to pay USD
        tipo_dolar: formData.tipo_dolar, // Type of dollar (oficial, blue, etc.)
        descontar_pesos_por_usd: formData.descontar_pesos_por_usd !== undefined ? formData.descontar_pesos_por_usd : true, // Deduct pesos when paying in USD
        moneda: 'ARS', // Default primary currency
        fecha_pago: formData.fecha_pago,
        metodo_pago_id: formData.metodo_pago_id,
        categoria_id: formData.categoria_id,
        notas: formData.notas,
        comprobante: formData.comprobante
      };
      
      console.log('📤 Sending payment data to backend:', pagoData);
      
      // Call backend to register payment
      const result = await apiServices.pagosApi.registrarPago(pagoData);
      
      console.log('✅ Payment registered successfully:', result);

      // Create expense transaction automatically
      const createTransaction = async (amount, currency) => {
          if (!amount || amount <= 0) return;
          
      const expenseTransaction = {
            monto: parseFloat(amount),
            moneda: currency,
        descripcion: formData.notas || `Pago de ${paymentType === 'pending_payment' ? 'pago pendiente' : 'resumen bancario'}`,
        fecha_transaccion: formData.fecha_pago,
        tipo: 'gasto',
        categoria_id: formData.categoria_id,
        metodo_pago_id: formData.metodo_pago_id,
        notas: `Generado automáticamente por pago de ${paymentType === 'pending_payment' ? 'pago pendiente' : 'resumen bancario'} ID: ${paymentItem.id}`,
        comprobante: formData.comprobante
      };

          console.log(`➕ Creating automatic expense transaction (${currency}):`, expenseTransaction);
          await apiServices.transaccionesApi.create(expenseTransaction);
      };

      // Backend now creates transactions automatically, so we don't need to create them here
      // Check if backend created transactions
      const backendCreatedTransactions = 
          (result.transaccion_ids && result.transaccion_ids.length > 0) ||
          result.payment_details?.total_transactions_created > 0;
      
      if (backendCreatedTransactions) {
          const count = result.transaccion_ids?.length || result.payment_details?.total_transactions_created || 1;
          console.log(`✅ Backend created ${count} transaction(s) automatically, skipping frontend creation.`);
      } else {
          // Fallback: Create transactions if backend didn't (for backwards compatibility)
          console.log('⚠️ Backend did not create transactions, creating them manually...');
          
          // Create ARS transaction if amount exists
          if (formData.monto > 0) {
              await createTransaction(formData.monto, 'ARS');
          }
          // Create USD transaction if amount exists
          if (formData.montoUSD > 0) {
              await createTransaction(formData.montoUSD, 'USD');
          }
          
          console.log('✅ Manual expense transaction(s) created');
      }
      
      // Reload dashboard data
      await loadDashboardData();
      
      // Close modal
      setShowPaymentModal(false);
      setPaymentItem(null);
      
      // Show success modal (deferred if not on dashboard)
      if (currentView === 'dashboard') {
        setShowSuccessModal(true);
      } else {
        setPendingSuccessModal(true);
      }

      // alert('Pago registrado exitosamente! Se creó una transacción de tipo gasto.');
    } catch (error) {
      console.error('❌ Error saving payment:', error);
      throw error;
    }
  };

  // Handler to undo a payment
  const handleUndoPayment = async (item, moneda = null) => {
    try {
      const monedaMsg = moneda ? `en ${moneda}` : 'completo';
      console.log(`⏮️ Undoing payment ${monedaMsg} for:`, item);
      
      const itemType = item.banco ? 'bank_summary' : 'pending_payment';
      const itemId = item.id || item.Id;
      
      // Confirmación
      if (!window.confirm(`¿Deshacer el pago ${monedaMsg}?`)) {
        return;
      }
      
      // Call API to undo payment with specific currency
      const result = await apiServices.pagosApi.deshacerPago(
        itemId,
        itemType,
        true,  // eliminar_transacciones: true
        [],  // transaccion_ids: dejar vacío para que el backend maneje
        moneda  // 'ARS', 'USD', o null para todo
      );
      
      console.log('✅ Payment undone successfully:', result);
      
      // Reload dashboard data
      await loadDashboardData();
      
      // Show success notification
      if (result.total_transacciones_eliminadas > 0) {
        alert(`✅ Pago ${monedaMsg} deshecho exitosamente!\n\n${result.total_transacciones_eliminadas} transacción(es) eliminada(s).`);
      } else {
        alert(`✅ Pago ${monedaMsg} deshecho exitosamente!\n\nEl estado del resumen fue restaurado.`);
      }
      
    } catch (error) {
      console.error('❌ Error undoing payment:', error);
      alert(`❌ Error al deshacer el pago: ${error.message || 'Error desconocido'}`);
    }
  };

  // Handler to view all pending payments
  const handleViewAllPendingPayments = () => {
    setCurrentView('pending-payments-full');
    // Notify parent about navigation change to update URL/state if needed
    // This is optional but good practice if parent tracks state
    // But since we are inside MissionControlDashboard, updating local state is enough for rendering
  };

  // Handler to view all transactions
  const handleViewAllTransactions = () => {
    setCurrentView('transactions-full');
  };

  // ====== END HELPER FUNCTIONS ======

  // ====== RENDER MODALS (BEFORE CONDITIONAL RETURNS) ======
  const renderModals = () => (
    <>
      {/* Objetivo Form Modal */}
      <ObjetivoFormModal
        isOpen={showObjetivoModal}
        onClose={() => {
          console.log('🎯 Closing objetivo modal');
          setShowObjetivoModal(false);
          setEditingObjetivo(null);
        }}
        onSuccess={() => {
          console.log('🎯 Objetivo saved successfully');
          loadDashboardData();
        }}
        objetivo={editingObjetivo}
        categorias={dashboardData?.categorias || []}
      />
      
      {/* 💳 Pagar Resumen Modal */}
      <PagarResumenModal
        isOpen={showPagarResumenModal}
        onClose={() => {
          setShowPagarResumenModal(false);
          setDeudaDataForModal(null);
        }}
        deudaData={deudaDataForModal}
        onSuccess={() => {
          loadDashboardData();
          setShowPagarResumenModal(false);
          setDeudaDataForModal(null);
        }}
      />
    </>
  );

  if (loading) {
    return (
      <>
        {renderModals()}
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-white text-lg">Cargando Centro de Control...</div>
        </div>
      </>
    );
  }

  // If in agent view, show full screen chat
  if (currentView === 'agent') {
    return (
      <>
        {renderModals()}
        <FinancialAgentChat
          onClose={handleCloseAgent}
          categories={dashboardData?.categorias || []}
          paymentMethods={dashboardData?.metodosPago || []}
          userData={user || {}}
          financialData={{
              monthlyStats,
              totalDeuda,
              pendingPayments: dashboardData?.pagos || [],
              bankSummaries: dashboardData?.resumenesBancarios || [],
              recentTransactions: dashboardData?.transacciones?.slice(0, 15) || []
          }}
        />
      </>
    );
  }

  // Settings view
  if (currentView === 'settings') {
    return (
      <>
        {renderModals()}
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[1800px] flex-1">
              
              {/* Header */}
              <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-4 sm:px-6 py-3 mb-6">
                <div className="flex items-center gap-4 text-white">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Back"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <h2 className="text-white text-2xl font-bold leading-tight tracking-[-0.015em]">
                    Settings & Management
                  </h2>
                </div>
              </header>

              {/* Content Grid */}
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-6 gap-6">
                
                {/* Left Column - Categories (2 cols) */}
                <div className="lg:col-span-2">
                  <CategoriesWidget
                    transactions={dashboardData?.transacciones || []}
                    onViewDetails={() => setCurrentView('categories-full')}
                  />
                </div>

                {/* Middle Left - Payment Methods (2 cols) */}
                <div className="lg:col-span-2">
                  <PaymentMethodsWidget
                    transactions={dashboardData?.transacciones || []}
                    onViewDetails={() => setCurrentView('payment-methods-full')}
                  />
                </div>

                {/* Right Column - Bank Summaries (2 cols) */}
                <div className="lg:col-span-2">
                  <BankSummariesWidget
                    data={dashboardData}
                    onViewDetails={() => setCurrentView('bank-summaries-full')}
                  />
                </div>

                {/* Second Row - Dollar Quote (3 cols) + CEDEARs (3 cols) */}
                <div className="lg:col-span-3">
                  <DollarQuoteWidget />
                </div>

                <div className="lg:col-span-3">
                  <div className="rounded-xl border border-[#306957] p-6 bg-white/5 backdrop-blur-sm flex flex-col gap-4">
                    <h3 className="text-white text-lg font-bold">CEDEARs</h3>
                    <p className="text-white/60 text-sm">Coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showCategoryModal && (
          <CategoryModal
            isOpen={showCategoryModal}
            category={editingCategory}
            onSave={handleSaveCategory}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
          />
        )}

        {showPaymentMethodModal && (
          <PaymentMethodModal
            isOpen={showPaymentMethodModal}
            paymentMethod={editingPaymentMethod}
            onSave={handleSavePaymentMethod}
            onClose={() => {
              setShowPaymentMethodModal(false);
              setEditingPaymentMethod(null);
            }}
          />
        )}

        {showBankSummaryModal && (
          <BankSummaryModal
            isOpen={showBankSummaryModal}
            bankSummary={editingBankSummary}
            onSave={handleSaveBankSummary}
            onDelete={handleDeleteBankSummary}
            onPay={(summary, type) => handlePayBankSummary(summary, type)}
            onClose={() => {
              setShowBankSummaryModal(false);
              setEditingBankSummary(null);
            }}
          />
        )}
      </div>
      </>
    );
  }

  // Full view for adding/editing transactions
  if (currentView === 'add-transaction') {
    return (
      <>
        {renderModals()}
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[900px] flex-1">
              
              {/* Header */}
              <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-4 sm:px-6 py-3 mb-6">
                <div className="flex items-center gap-4 text-white">
                  <button
                    onClick={handleCancelTransaction}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Back"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <h2 className="text-white text-2xl font-bold leading-tight tracking-[-0.015em]">
                    {editingItem ? 'Editar Transacción' : 'Nueva Transacción'}
                  </h2>
                </div>
              </header>

              {/* Transaction Form */}
              <div className="p-4 sm:p-6">
                <TransactionFormView
                  transaction={editingItem}
                  categories={dashboardData?.categorias || []}
                  paymentMethods={dashboardData?.metodosPago || []}
                  onSave={handleSaveTransaction}
                  onCancel={handleCancelTransaction}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Full view for adding/editing pending payment
  if (activeModal === 'pendingPayment') {
    return (
      <>
        {renderModals()}
        <PendingPaymentFormView
        payment={editingItem}
        categories={dashboardData?.categorias || []}
        paymentMethods={dashboardData?.metodosPago || []}
        onSave={handleSavePendingPayment}
        onCancel={handleCancelPendingPayment}
      />
      </>
    );
  }

  // Full transactions view
  if (currentView === 'transactions-full') {
    return (
      <>
        {renderModals()}
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[1800px] flex-1">
              <TransactionsFullView
                onBack={() => setCurrentView('dashboard')}
                onEdit={handleOpenAddTransaction}
                onDelete={handleDeleteTransaction}
              />
                    </div>
                  </div>
                </div>
        {/* Transaction Modal (Replaced with ModernTransactionForm) */}
        <ModernTransactionForm
          key={transactionModalKey}
          isOpen={showTransactionModal}
          onClose={() => {
            setShowTransactionModal(false);
            setEditingItem(null);
          }}
          onSuccess={handleTransactionSuccess}
          editingTransaction={editingItem}
        />
      </div>
      </>
    );
  }

  // Full pending payments view
  if (currentView === 'pending-payments-full') {
    return (
      <>
        {renderModals()}
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[1800px] flex-1">
              <PendingPaymentsFullView
                payments={dashboardData?.pagos || []}
                onBack={() => setCurrentView('dashboard')}
                onPay={(payment) => {
                  handlePayPendingPayment(payment);
                }}
                onEdit={(payment) => openModal('pendingPayment', payment)}
                onDelete={handleDeletePendingPayment}
                onAdd={() => openModal('pendingPayment', null)}
              />
                  </div>
                </div>
                  </div>
        {/* Transaction Modal for Paying (Replaced with ModernTransactionForm) */}
        <ModernTransactionForm
          key={transactionModalKey}
          isOpen={showTransactionModal}
          onClose={() => {
            setShowTransactionModal(false);
            setEditingItem(null);
          }}
          onSuccess={handleTransactionSuccess}
          editingTransaction={editingItem}
        />
                          </div>
      </>
    );
  }

  // Full budgets view
  if (currentView === 'budgets-full') {
    return (
      <>
        {renderModals()}
        <BudgetsFullView onBack={() => setCurrentView('dashboard')} />
      </>
    );
  }

  // Full objetivos view
  if (currentView === 'objetivos-full') {
    return (
      <>
        {renderModals()}
        <ObjetivosFullView 
        onBack={() => setCurrentView('dashboard')}
        onEdit={(objetivo) => {
          console.log('🎯 Opening objetivo modal:', objetivo ? 'EDIT' : 'NEW');
          setEditingObjetivo(objetivo || null);
          setShowObjetivoModal(true);
        }}
        onDelete={(objetivo) => {
          console.log('Delete objetivo:', objetivo);
        }}
      />
      </>
    );
  }

  // 💳 Tarjetas de Crédito Full View
  if (currentView === 'tarjetas-full') {
    return (
      <>
        {renderModals()}
        <TarjetasFullView
          onBack={() => setCurrentView('dashboard')}
          onPagarResumen={(deudaData) => {
            setDeudaDataForModal(deudaData);
            setShowPagarResumenModal(true);
          }}
          onEdit={(transaccion) => {
            setEditingItem(transaccion);
            setShowTransactionModal(true);
          }}
          onDelete={(transaccionId) => {
            if (!transaccionId) return;
            handleDeleteTransaction(transaccionId);
          }}
        />
      </>
    );
  }

  // AI Usage Full View
  if (currentView === 'ai-usage') {
    return (
      <>
        {renderModals()}
        <AIUsageFullView onBack={() => setCurrentView('dashboard')} />
      </>
    );
  }

  // Dollar View
  if (currentView === 'dolar') {
    return (
      <>
        {renderModals()}
        <DollarView onBack={() => setCurrentView('dashboard')} />
      </>
    );
  }

  // CEDEARs View
  if (currentView === 'cedears') {
    return (
      <>
        {renderModals()}
        <CedearsView onBack={() => setCurrentView('dashboard')} />
      </>
    );
  }

  // General Summary View
  if (currentView === 'resumen-general') {
    return (
      <>
        {renderModals()}
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
        <style>{`
          .bg-black { background-color: transparent !important; }
          .bg-retro-dark, .card-retro, .bg-zinc-900 { background-color: rgba(255, 255, 255, 0.05) !important; backdrop-filter: blur(10px) !important; border-color: #306957 !important; border-width: 1px !important; }
          .card-retro:hover, .hover\\:border-zinc-700:hover { border-color: #3b82f6 !important; }
          .border-retro { border-color: #306957 !important; }
          .text-zinc-400 { color: rgba(255, 255, 255, 0.7) !important; }
          .text-zinc-300 { color: rgba(255, 255, 255, 0.9) !important; }
          .border-2 { border-width: 1px !important; }
        `}</style>
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[1800px] flex-1">
              
              {/* Header */}
              <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-4 sm:px-6 py-3 mb-6">
                <div className="flex items-center gap-4 text-white">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Back"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                    General Summary
                  </h2>
                </div>
              </header>

              {/* ResumenGeneralView Content */}
              <div className="p-4">
                <ResumenGeneralView />
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Full Categories View
  if (currentView === 'categories-full') {
    return (
      <>
        {renderModals()}
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[1800px] flex-1">
              <CategoriesFullView
                data={dashboardData}
                onBack={() => setCurrentView('dashboard')}
                onCategoryClick={(category) => {
                  setEditingCategory(category);
                  setShowCategoryModal(true);
                }}
                onAddCategory={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
                onDeleteCategory={async (categoryId) => {
                  try {
                    await apiServices.categoriasApi.delete(categoryId);
                    // Update local state without full reload
                    setDashboardData(prev => ({
                      ...prev,
                      categorias: prev.categorias.filter(c => (c.id || c.Id) !== categoryId)
                    }));
                  } catch (error) {
                    console.error('Error deleting category:', error);
                    alert('Error al eliminar la categoría: ' + error.message);
                  }
                }}
              />
                </div>
              </div>
            </div>
        {showCategoryModal && (
          <CategoryModal
            isOpen={showCategoryModal}
            category={editingCategory}
            onSave={handleSaveCategory}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
          />
        )}
      </div>
      </>
    );
  }

  // Full Payment Methods View
  if (currentView === 'payment-methods-full') {
    return (
      <>
        {renderModals()}
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[1800px] flex-1">
              <PaymentMethodsFullView
                data={dashboardData}
                onBack={() => setCurrentView('dashboard')}
                onPaymentMethodClick={(method) => {
                  setEditingPaymentMethod(method);
                  setShowPaymentMethodModal(true);
                }}
                onAddPaymentMethod={() => {
                  setEditingPaymentMethod(null);
                  setShowPaymentMethodModal(true);
                }}
                onDeletePaymentMethod={async (methodId) => {
                  try {
                    await apiServices.metodosPagoApi.delete(methodId);
                    // Update local state without full reload
                    setDashboardData(prev => ({
                      ...prev,
                      metodosPago: prev.metodosPago.filter(m => (m.id || m.Id) !== methodId)
                    }));
                  } catch (error) {
                    console.error('Error deleting payment method:', error);
                    alert('Error al eliminar el método de pago: ' + error.message);
                  }
                }}
              />
                </div>
              </div>
            </div>
        {showPaymentMethodModal && (
          <PaymentMethodModal
            isOpen={showPaymentMethodModal}
            paymentMethod={editingPaymentMethod}
            onSave={handleSavePaymentMethod}
            onClose={() => {
              setShowPaymentMethodModal(false);
              setEditingPaymentMethod(null);
            }}
          />
        )}
      </div>
      </>
    );
  }

  // Currency Management View
  if (currentView === 'currency-management') {
    return (
      <>
        {renderModals()}
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
          <div className="layout-container flex h-full grow flex-col">
            <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
              <div className="layout-content-container flex flex-col w-full max-w-[1800px] flex-1">
                <CurrencyManagementView
                  onBack={() => setCurrentView('dashboard')}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Full Bank Summaries View
  if (currentView === 'bank-summaries-full') {
    return (
      <>
        {renderModals()}
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[1800px] flex-1">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors w-fit"
                  >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Dashboard</span>
                  </button>
              <BankSummariesFullView
                data={dashboardData}
                onBack={() => setCurrentView('dashboard')}
                onViewDetails={(summary) => {
                  setEditingBankSummary(summary);
                  setShowBankSummaryModal(true);
                }}
                onPay={(summary, type) => handlePayBankSummary(summary, type)}
                onUndoPayment={(summary, moneda) => handleUndoPayment(summary, moneda)}
              />
                </div>
          </div>
          {showBankSummaryModal && (
            <BankSummaryModal
              isOpen={showBankSummaryModal}
              bankSummary={editingBankSummary}
              onSave={handleSaveBankSummary}
              onDelete={handleDeleteBankSummary}
              onPay={(summary, type) => handlePayBankSummary(summary, type)}
              onClose={() => {
                setShowBankSummaryModal(false);
                setEditingBankSummary(null);
              }}
            />
          )}

          {/* Payment Modal - Required for paying from Bank Summaries Full View */}
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setPaymentItem(null);
            }}
            onSave={handleSavePayment}
            paymentItem={paymentItem}
            paymentMethods={dashboardData?.metodosPago || []}
            categories={dashboardData?.categorias || []}
            type={paymentType}
            initialAmountType={paymentAmount}
          />
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {renderModals()}
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-[1800px] flex-1">
            
            {/* Header */}
            {!isMobile && (
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-4 sm:px-6 py-3">
              <div className="flex items-center gap-4 text-white">
                <div className="size-6 text-primary">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                  Centro de Control
                </h2>
              </div>
              
              <div className="flex flex-1 justify-end items-center gap-4 sm:gap-6">
                <div className="flex gap-2 items-center">
                  {/* Asistente IA Button */}
                  <button
                    onClick={() => handleQuickAction('agent')}
                    className="flex items-center justify-center h-10 w-10 bg-[#059467] hover:bg-[#059467]/90 text-white rounded-lg transition-colors shadow-lg"
                    title="Asistente IA"
                  >
                    <Bot className="w-5 h-5" />
                  </button>

                  {/* Carga Masiva Button */}
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="flex items-center justify-center h-10 w-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-colors shadow-lg"
                    title="Carga Masiva de Transacciones"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </button>

                  {/* Nueva Transacción Button */}
                  <button 
                    onClick={() => handleOpenAddTransaction()}
                    className="flex items-center justify-center h-10 w-10 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
                    title="Nueva Transacción"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* Month Selector */}
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-[#306957] rounded-lg p-1">
                    <button
                      onClick={() => handleMonthChange('prev')}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors"
                      aria-label="Previous month"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="px-3 text-white font-semibold text-sm min-w-[120px] text-center">
                      {(() => {
                        const [year, month] = selectedMonth.split('-').map(Number);
                        const date = new Date(year, month - 1, 15);
                        return date.toLocaleDateString('es-ES', {
                          month: 'long',
                          year: 'numeric'
                        });
                      })()}
                    </div>

                    <button
                      onClick={() => handleMonthChange('next')}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors"
                      aria-label="Next month"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* 👁️ Toggle visibilidad montos */}
                    <button 
                      onClick={toggleAmountVisibility}
                      className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-white/10 text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-white/20 transition-colors"
                      title={isAmountVisible ? 'Ocultar montos' : 'Mostrar montos'}
                    >
                      {isAmountVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    
                    <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-white/10 text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-white/20 transition-colors">
                      <Bell className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Avatar con Menú de Usuario */}
                <UserMenu />
              </div>
            </header>
            )}

            {/* Main Content */}
            <main className={`flex flex-col gap-6 p-4 sm:p-6 md:p-8 ${isMobile ? 'pb-24' : ''}`}>
              {currentView === 'transactions-full' ? (
                <TransactionsFullView
                  onBack={() => setCurrentView('dashboard')}
                  onEdit={handleOpenAddTransaction}
                  onDelete={handleDeleteTransaction}
                />
              ) : isMobile && currentView === 'dashboard' ? (
                // Mobile Layout
                <>
                <div className="flex flex-col gap-6">
                   {/* Hola User */}
                   <div className={`flex justify-between items-start transition-all duration-500 ${renderPriority >= 0 ? 'opacity-100' : 'opacity-0'}`}>
                     <h1 className="text-3xl font-bold text-white">Hola <br/> <span className="text-cyan-400">{user?.name || user?.first_name || user?.full_name || 'Usuario'}</span></h1>
                   </div>

                   {/* Top Cards Grid - 3 columnas */}
                   <div className={`grid grid-cols-3 gap-3 transition-all duration-500 delay-100 ${renderPriority >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      {/* Banco Card - Multi-Currency */}
                      <button 
                         onClick={() => setShowMoneyDetails(true)}
                         className="bg-[#0f151a] border border-cyan-500/50 rounded-3xl p-4 flex flex-col justify-between h-32 relative overflow-hidden group text-left transition-transform active:scale-95"
                      >
                         <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                         <div>
                           <h3 className="text-white font-bold text-sm">Dinero</h3>
                           <div className="mt-1 space-y-0.5">
                             {Object.entries(monthlyStatsByCurrency)
                               .filter(([_, stats]) => stats.income > 0 || stats.expenses > 0)
                               .slice(0, 2) // Mostrar máximo 2 monedas
                               .map(([moneda, stats]) => {
                                 const getCurrencySymbol = (code) => {
                                   const symbols = { 'ARS': '$', 'USD': 'U$D', 'EUR': '€', 'BRL': 'R$', 'GBP': '£' };
                                   return symbols[code] || code;
                                 };
                                 return (
                                   <p key={moneda} className={`text-sm font-bold ${stats.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                     {getCurrencySymbol(moneda)}{Math.round(stats.balance).toLocaleString()} {moneda}
                                   </p>
                                 );
                               })}
                             {Object.keys(monthlyStatsByCurrency).filter(([_, stats]) => stats.income > 0 || stats.expenses > 0).length > 2 && (
                               <p className="text-gray-500 text-[10px]">+{Object.keys(monthlyStatsByCurrency).length - 2} más</p>
                             )}
                           </div>
                         </div>
                         <p className="text-gray-500 text-[10px] leading-tight">
                           Toca para ver detalles
                         </p>
                      </button>

                      {/* 💳 Tarjetas Card */}
                      <button 
                         onClick={() => setCurrentView('tarjetas-full')}
                         className="bg-[#0f151a] border border-orange-500/30 rounded-3xl p-4 flex flex-col justify-between h-32 relative overflow-hidden group text-left transition-transform active:scale-95"
                      >
                         <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                         <div className="w-full">
                           <h3 className="text-white font-bold text-sm">Tarjetas</h3>
                           <p className="text-orange-400 font-bold mt-1 text-lg">
                             {formatAmount(totalDeudaTarjetas, { short: true })}
                           </p>
                         </div>
                         <p className="text-gray-500 text-[10px]">Crédito</p>
                      </button>

                      {/* Deuda Total Card */}
                      <button 
                         onClick={() => setShowDebtDetails(true)}
                         className="bg-[#0f151a] border border-red-500/30 rounded-3xl p-4 flex flex-col justify-between h-32 relative overflow-hidden group text-left transition-transform active:scale-95"
                      >
                         <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                         <div className="w-full">
                           <h3 className="text-white font-bold text-sm">Deuda</h3>
                           <p className="text-red-400 font-bold mt-1 text-lg">
                             {formatAmount(totalDeuda.total, { short: true })}
                           </p>
                         </div>
                         <p className="text-gray-500 text-[10px]">Resúmenes</p>
                      </button>
                </div>
                
                   {/* Pagos Pendientes Card (Formerly Presupuesto) */}
                   {renderPriority >= 1 && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button
                      onClick={() => setCurrentView('pending-payments-full')}
                      className="w-full bg-[#0f151a] border border-white/10 rounded-3xl h-48 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors group relative overflow-hidden"
                   >
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center group-hover:border-cyan-500/50 group-hover:scale-110 transition-all">
                         <List className="w-8 h-8 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <span className="text-gray-500 font-medium text-lg group-hover:text-white transition-colors">Pagos Pendientes</span>
                  </button>
                   </div>
                   )}

                   {/* Chart Section */}
                   {renderPriority >= 2 && (
                   <div className="bg-[#0f151a] rounded-3xl p-6 border border-white/5 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="w-full -ml-2 mb-4">
                         <TransactionsChart 
                            transactions={dashboardData?.transacciones || []} 
                            onViewAll={() => setCurrentView('transactions-full')} 
                            isMobileSimple={true}
                            filter={chartTab}
                         />
                      </div>
                      
                      {/* Tabs */}
                      <div className="flex p-1 bg-[#162028] rounded-full mt-auto">
                         <button 
                            onClick={() => setChartTab('todo')}
                            className={`flex-1 py-3 text-sm font-medium rounded-full transition-colors ${chartTab === 'todo' ? 'text-black bg-cyan-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                         >
                            Todo
                         </button>
                         <button 
                            onClick={() => setChartTab('gasto')}
                            className={`flex-1 py-3 text-sm font-medium rounded-full transition-colors ${chartTab === 'gasto' ? 'text-black bg-cyan-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                         >
                            Gasto
                         </button>
                         <button 
                            onClick={() => setChartTab('ingreso')}
                            className={`flex-1 py-3 text-sm font-medium rounded-full transition-colors ${chartTab === 'ingreso' ? 'text-black bg-cyan-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                         >
                            Ingreso
                         </button>
                  </div>
                  
                  <button
                        onClick={handleViewAllTransactions} 
                        className="w-full text-center text-gray-500 text-sm font-medium mt-4 hover:text-white flex items-center justify-center gap-2 bg-[#162028] py-3 rounded-xl border border-white/5"
                  >
                         Ver todas las transacciones
                         <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                   )}

                   {/* Presupuestos Section (Mobile) */}
                   {renderPriority >= 3 && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <BudgetWidget 
                        onViewDetails={() => setCurrentView('budgets-full')}
                        onAnalyzePurchase={() => setShowPurchaseAnalyzer(true)}
                      />
                   </div>
                   )}

                   {/* Objetivos Section (Mobile) */}
                   {renderPriority >= 3 && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <ObjetivosWidget 
                        onViewDetails={() => setCurrentView('objetivos-full')}
                        onCreateNew={() => {
                          setEditingObjetivo(null);
                          setShowObjetivoModal(true);
                        }}
                      />
                   </div>
                   )}
              </div>

                {/* Floating Action Button (Mobile Only) - Moved to main container to ensure visibility */}
                <div className="fixed bottom-24 right-4 z-50 md:hidden">
                    <button
                        onClick={() => handleOpenAddTransaction()}
                        className="w-14 h-14 bg-[#a8c5da] hover:bg-[#90b0c5] text-black rounded-2xl shadow-lg flex items-center justify-center transition-transform active:scale-95"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
              </>
              ) : (
                <>
                  {/* Stats Cards - Nuevo Diseño */}
                  <div className={`transition-all duration-500 ${renderPriority >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <StatsCardsNew 
                      data={dashboardData} 
                  selectedMonth={selectedMonth} 
                      debtStats={totalDeuda}
                />
              </div>

                  {/* Multi-Currency Balance Widget - v1.1 */}
                  <div className={`transition-all duration-500 mt-6 ${renderPriority >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <MultiCurrencyBalanceWidget 
                      data={dashboardData} 
                      onManageCurrencies={() => setCurrentView('currency-management')}
                    />
                  </div>

                  {/* Top Section: Transactions, Deuda Tarjetas & Bank Summaries */}
                  {renderPriority >= 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Transacciones Recientes - 2 columnas */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      <RecentTransactionsSection
                        data={dashboardData}
                        selectedMonth={selectedMonth}
                        onViewAll={handleViewAllTransactions}
                        onTransactionClick={(transaction) => handleOpenAddTransaction(transaction)}
                      />
                    </div>
                    
                    {/* 💳 Deuda de Tarjetas - 1 columna */}
                    <div className="lg:col-span-1">
                      <DeudaTarjetasWidget
                        onViewDetails={() => setCurrentView('tarjetas-full')}
                        onPagarResumen={(deudaData) => {
                          setDeudaDataForModal(deudaData);
                          setShowPagarResumenModal(true);
                        }}
                      />
                    </div>
                    
                    {/* Resúmenes Bancarios - 1 columna */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                      <BankSummariesSection
                        data={dashboardData}
                        onBankSummaryClick={(summary) => {
                          setEditingBankSummary(summary);
                          setShowBankSummaryModal(true);
                        }}
                        onViewDetails={() => {
                          setCurrentView('bank-summaries-full');
                        }}
                      />
                    </div>
                  </div>
                  )}

                  {/* Charts Section - Reorganized */}
                  {renderPriority >= 2 && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Estado de Pagos */}
                    <div className="lg:col-span-1">
                      <PendingPaymentsChart
                        payments={dashboardData?.pagos || []}
                        onViewAll={handleViewAllPendingPayments}
                      />
                    </div>

                    {/* Métodos de Pago */}
                    <div className="lg:col-span-1">
                      <PaymentMethodsWidget
                        transactions={dashboardData?.transacciones || []}
                        onViewDetails={() => setCurrentView('payment-methods-full')}
                      />
                    </div>

                    {/* Cotizaciones del Dólar */}
                    <DollarQuotesChart quotes={dollarQuotes} />
                  </div>
                  )}

                  {/* Bottom Section: AI, Budgets, Objetivos, Categories */}
                  {renderPriority >= 3 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-1">
                        <AIUsageWidget onViewDetails={() => setCurrentView('ai-usage')} />
                    </div>
                    <div className="lg:col-span-1">
                      <BudgetWidget 
                        onViewDetails={() => setCurrentView('budgets-full')}
                        onAnalyzePurchase={() => setShowPurchaseAnalyzer(true)}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <ObjetivosWidget 
                        onViewDetails={() => setCurrentView('objetivos-full')}
                        onCreateNew={() => {
                          setEditingObjetivo(null);
                          setShowObjetivoModal(true);
                        }}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <CategoriesSection
                        data={dashboardData}
                        onViewDetails={() => setCurrentView('categories-full')}
                      />
                    </div>
                  </div>
                  )}

                  {/* Stocks & CEDEARs Section */}
                  {renderPriority >= 4 && (
                  <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CedearsView />
                  </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>


      {/* Transaction Modal (Replaced with ModernTransactionForm) */}
      <ModernTransactionForm
        key={transactionModalKey}
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingItem(null);
        }}
        onSuccess={handleTransactionSuccess}
        editingTransaction={editingItem}
      />

      {/* Bulk Transaction Upload Modal */}
      <BulkTransactionUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={() => {
          setShowBulkUpload(false);
          loadDashboardData();
        }}
      />

      {/* Purchase Analyzer Modal */}
      <PurchaseAnalyzerModal
        isOpen={showPurchaseAnalyzer}
        onClose={() => setShowPurchaseAnalyzer(false)}
      />

      {/* Objetivo Form Modal */}
      <ObjetivoFormModal
        isOpen={showObjetivoModal}
        onClose={() => {
          setShowObjetivoModal(false);
          setEditingObjetivo(null);
        }}
        onSuccess={() => {
          loadDashboardData();
        }}
        objetivo={editingObjetivo}
        categorias={dashboardData?.categorias || []}
      />

      {/* Payment Modal (for registering payments from pending payments & bank summaries) */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentItem(null);
        }}
        onSave={handleSavePayment}
        paymentItem={paymentItem}
        paymentMethods={dashboardData?.metodosPago || []}
        categories={dashboardData?.categorias || []}
        type={paymentType}
        initialAmountType={paymentAmount}
      />

      {/* Bank Summary Modal */}
      {showBankSummaryModal && (
        <BankSummaryModal
          isOpen={showBankSummaryModal}
          bankSummary={editingBankSummary}
          onSave={handleSaveBankSummary}
          onDelete={handleDeleteBankSummary}
          onPay={(summary, type) => handlePayBankSummary(summary, type)}
          onClose={() => {
            setShowBankSummaryModal(false);
            setEditingBankSummary(null);
          }}
        />
      )}

      {/* Debt Details Modal (Mobile) */}
      {showDebtDetails && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDebtDetails(false)}>
            <div 
                className="w-[90%] max-w-sm bg-[#161616] rounded-3xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Detalle de Deuda</h3>
                    <button 
                        onClick={() => setShowDebtDetails(false)}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-[#0f151a] rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400 text-sm">Pagos Pendientes</span>
                            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">{totalDeuda.pendingCount}</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                            ${totalDeuda.pendingPayments.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                    </div>

                    <div className="bg-[#0f151a] rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400 text-sm">Resúmenes Bancarios</span>
                            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">{totalDeuda.summariesPendingCount}</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                            ${totalDeuda.bankSummariesPendingOnly.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-between items-center mt-2">
                        <span className="text-white font-medium">Total</span>
                        <span className="text-2xl font-bold text-red-400">
                            -${totalDeuda.total.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Money Details Modal (Mobile) - Multi-Currency */}
      {showMoneyDetails && (() => {
        // 💰 Función para normalizar códigos de moneda
        const normalizeCurrency = (codigo) => {
            if (!codigo) return 'ARS';
            const normalized = codigo.toUpperCase().trim();
            const corrections = {
                'ARG': 'ARS',
                'PESO': 'ARS',
                'PESOS': 'ARS',
                'DOLLAR': 'USD',
                'DOLLARS': 'USD',
                'DOLAR': 'USD',
                'DOLARES': 'USD'
            };
            return corrections[normalized] || normalized;
        };

        // 💰 Función para obtener símbolo de moneda
        const getCurrencySymbol = (code) => {
            const symbols = {
                'ARS': '$',
                'USD': 'U$D',
                'EUR': '€',
                'BRL': 'R$',
                'GBP': '£'
            };
            return symbols[code] || code;
        };

        // 💰 Calcular totales por moneda (INCLUIR TODOS LOS GASTOS)
        const currencyTotals = {};
        dashboardData?.transacciones?.forEach(t => {
            const moneda = normalizeCurrency(t.Moneda || t.moneda || 'ARS');
            const tipo = (t.Tipo || t.tipo || '').toLowerCase();
            const monto = Math.abs(parseFloat(t.Monto || t.monto || 0));

            if (!currencyTotals[moneda]) {
                currencyTotals[moneda] = { ingresos: 0, gastos: 0, balance: 0 };
            }

            if (tipo === 'ingreso') {
                currencyTotals[moneda].ingresos += monto;
            } else if (tipo === 'gasto') {
                // Incluir TODOS los gastos (incluso crédito) para mostrar en el detalle
                currencyTotals[moneda].gastos += monto;
            }
        });

        // Calcular balance y filtrar solo monedas con movimientos
        Object.keys(currencyTotals).forEach(moneda => {
            currencyTotals[moneda].balance = currencyTotals[moneda].ingresos - currencyTotals[moneda].gastos;
        });

        // Filtrar solo monedas con ingresos o gastos reales
        const activeCurrencies = Object.entries(currencyTotals).filter(([_, totals]) => 
            totals.ingresos > 0 || totals.gastos > 0
        );

        return (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowMoneyDetails(false)}>
                <div 
                    className="w-[90%] max-w-sm bg-[#161616] rounded-3xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <h3 className="text-xl font-bold text-white">Detalle de Dinero</h3>
                        <button 
                            onClick={() => setShowMoneyDetails(false)}
                            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                        {activeCurrencies.length > 0 ? (
                            activeCurrencies.map(([moneda, totals]) => (
                                <div key={moneda} className="bg-[#0f151a] rounded-2xl p-4 border border-white/5">
                                    {/* Header con moneda */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-white font-bold text-lg">{getCurrencySymbol(moneda)} {moneda}</span>
                                        <span className={`text-lg font-bold ${totals.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {getCurrencySymbol(moneda)} {Math.round(totals.balance).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Ingresos */}
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 rounded-full bg-emerald-500/10">
                                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            <span className="text-emerald-400 text-sm font-medium">Ingresos</span>
                                        </div>
                                        <span className="text-emerald-400 font-bold text-sm">
                                            +{getCurrencySymbol(moneda)} {Math.round(totals.ingresos).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Gastos */}
                                    <div className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 rounded-full bg-red-500/10">
                                                <TrendingDown className="w-3 h-3 text-red-400" />
                                            </div>
                                            <span className="text-red-400 text-sm font-medium">Gastos</span>
                                        </div>
                                        <span className="text-red-400 font-bold text-sm">
                                            -{getCurrencySymbol(moneda)} {Math.round(totals.gastos).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm italic">No hay transacciones este mes</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-between items-center mt-2 shrink-0">
                        <span className="text-white font-medium">Balance Total</span>
                        <div className="flex flex-col items-end gap-1">
                            {activeCurrencies.map(([moneda, totals]) => (
                                <span key={moneda} className={`text-lg font-bold ${totals.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                    {getCurrencySymbol(moneda)} {Math.round(totals.balance).toLocaleString()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
      })()}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSuccessModal(false)}>
            <div 
                className="w-[90%] max-w-sm bg-[#161616] rounded-3xl p-8 border border-green-500/30 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center relative overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/20 rounded-full blur-[50px] pointer-events-none"></div>

                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">¡Transacción Guardada!</h3>
                <p className="text-gray-400 text-sm mb-6">Tu transacción se ha registrado correctamente.</p>

                <button 
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-2xl transition-all shadow-lg shadow-green-500/20"
                >
                    Continuar
                </button>
            </div>
        </div>
      )}

    </div>
    </>
  );
};

export default MissionControlDashboard;
