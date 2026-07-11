/**
 * ModernMissionControl - Versión moderna del MissionControlDashboard
 * Integra el diseño de Stitch con la funcionalidad existente
 */

import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '../auth/auth-provider';
import { useTheme } from '../../contexts/ThemeContext';
import { useAmountVisibility } from '../../contexts/AmountVisibilityContext';
import {
  computeDashboardStats,
  useDollarQuotes,
  useCategories,
  usePaymentMethods,
  useTransactions,
  usePendingPayments,
  useObjetivos,
  usePresupuestos,
  useMonedas,
  useResumenes,
  QUERY_KEYS
} from '../../hooks/useFinancialData';
import { useQueryClient } from '@tanstack/react-query';
import apiServices from '../../services/api';
import yfinanceService from '../../services/yfinanceService';

// Modern UI Components
import ModernLayout from './layout/ModernLayout';
import LoadingSpinner from './common/LoadingSpinner';
import ConfirmModal from './common/ConfirmModal';

// ====== LAZY LOADED VIEWS (Code Splitting) ======
const ModernDashboard = lazy(() => import('./dashboard/ModernDashboard'));
const ModernTransactionsView = lazy(() => import('./transactions/ModernTransactionsView'));
const ModernTarjetasView = lazy(() => import('./tarjetas/ModernTarjetasView'));
const ModernObjetivosView = lazy(() => import('./objetivos/ModernObjetivosView'));
const ModernCotizacionesView = lazy(() => import('./cotizaciones/ModernCotizacionesView'));
const ModernPresupuestosView = lazy(() => import('./presupuestos/ModernPresupuestosView'));
const ModernCategoriesView = lazy(() => import('./categories/ModernCategoriesView'));
const ModernPaymentMethodsView = lazy(() => import('./payment-methods/ModernPaymentMethodsView'));
const ModernPendingPaymentsView = lazy(() => import('./pending-payments/ModernPendingPaymentsView'));
const ModernCEDEARsView = lazy(() => import('./cedears/ModernCEDEARsView'));
const ModernMonedasView = lazy(() => import('./monedas/ModernMonedasView'));
const ModernInversionesView = lazy(() => import('./inversiones/ModernInversionesView'));
const ModernResumenesView = lazy(() => import('./resumenes/ModernResumenesView'));
const ModernReportesView = lazy(() => import('./reportes/ModernReportesView'));
const ModernAIUsageView = lazy(() => import('./ai-usage/ModernAIUsageView'));
const ModernAjustesView = lazy(() => import('./ajustes/ModernAjustesView'));

// ====== LAZY LOADED MODALS (Solo se cargan cuando se abren) ======
const DashboardSettingsModal = lazy(() => import('./dashboard/DashboardSettingsModal'));
const ModernTransactionForm = lazy(() => import('../ModernTransactionForm'));
const PendingPaymentPayModal = lazy(() => import('./pending-payments/PendingPaymentPayModal'));
const BulkTransactionUpload = lazy(() => import('../BulkTransactionUpload'));
const BudgetModal = lazy(() => import('../modals/BudgetModal'));
const AsignarDineroModal = lazy(() => import('../modals/AsignarDineroModal'));
const ObjetivoFormModal = lazy(() => import('../mission-control/ObjetivoFormModal'));
const StitchPendingPaymentModal = lazy(() => import('./pending-payments/StitchPendingPaymentModal'));
const CurrencyModal = lazy(() => import('./common/modals/CurrencyModal').then(m => ({ default: m.CurrencyModal })));
const PaymentMethodModal = lazy(() => import('./common/modals/PaymentMethodModal').then(m => ({ default: m.PaymentMethodModal })));
const CategoryModal = lazy(() => import('./common/modals/CategoryModal').then(m => ({ default: m.CategoryModal })));

const {
  transaccionesApi,
  pagosPendientesApi,
  objetivosApi,
  presupuestosApi,
  monedasApi,
  categoriasApi: categoriesApi,
  metodosPagoApi: paymentMethodsApi,
  resumenesBancariosApi
} = apiServices;

const ModernMissionControl = ({ onNavigate, initialView = 'dashboard' }) => {
  // ====== CONTEXTS ======
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAmountVisible: amountsVisible, toggleAmountVisibility } = useAmountVisibility();

  // ====== REACT QUERY (Solo datos globales para header) ======
  const queryClient = useQueryClient();
  const { data: dollarQuotes } = useDollarQuotes();
  const { data: categoriesData } = useCategories(); // Para modales
  const { data: paymentMethodsData } = usePaymentMethods(); // Para modales
  const { data: transactionsData = [], isLoading: loadingTx, error: txError } = useTransactions({ limit: 1000 });
  const { data: pendingPaymentsData = [] } = usePendingPayments();
  const { data: objetivosData = [] } = useObjetivos();
  const { data: presupuestosData = [] } = usePresupuestos();
  const { data: monedasData = [] } = useMonedas();
  const { data: resumenesData = [] } = useResumenes();

  // dashboardStats era antes un query aparte con su propio fetch sin
  // límite (transaccionesApi.getAll() sin argumentos), duplicando esta
  // misma llamada y bloqueando toda la app detrás de esa segunda espera.
  // Ahora es un cómputo puro sobre transactionsData, que ya está acá.
  const dashboardStats = useMemo(() => computeDashboardStats(transactionsData), [transactionsData]);
  const loadingStats = loadingTx;

  // Extraer datos para compatibilidad con código existente
  const dashboardData = dashboardStats || null;
  const categories = categoriesData || [];
  const paymentMethods = paymentMethodsData || [];
  const notifications = []; // TODO: Implementar notificaciones con React Query

  // Estado local sincronizado con React Query para permitir actualizaciones optimistas en modales
  const [cedears, setCedears] = useState([]);

  // Función para refrescar datos (reemplaza loadDashboardData)
  const refreshData = async () => {
    // refetchQueries fuerza el fetch inmediato (no espera staleTime)
    await Promise.all([
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.transactions] }),
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.pendingPayments] }),
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.objetivos] }),
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.presupuestos] }),
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.resumenes] }),
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.monedas] }),
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.categories] }),
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.paymentMethods] }),
    ]);
  };

  // ====== STATE (Solo UI state, NO datos del backend) ======
  const [currentView, setCurrentView] = useState(initialView);
  const [dashboardSettings, setDashboardSettings] = useState(() => {
    const saved = localStorage.getItem('modernDashboardSettings');
    return saved ? JSON.parse(saved) : {
      showPagosPendientes: true,
      showObjetivos: true,
      showCategorias: true,
      showDeudaTarjetas: false,
      showPresupuestos: false,
      showResumenes: false,
      showMetodosPago: false,
      showCEDEARs: true,
      showCotizaciones: true,
      showMonedas: true,
      showUsoCostoIA: true,
      balanceMode: 'monthly'
    };
  });

  // Modals
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDashboardSettings, setShowDashboardSettings] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showObjetivoModal, setShowObjetivoModal] = useState(false);
  const [editingObjetivo, setEditingObjetivo] = useState(null);
  const [showAsignarDineroModal, setShowAsignarDineroModal] = useState(false);
  const [objetivoToFund, setObjetivoToFund] = useState(null);
  const [showPendingPaymentModal, setShowPendingPaymentModal] = useState(false);
  const [editingPendingPayment, setEditingPendingPayment] = useState(null);
  const [showPayPendingPaymentModal, setShowPayPendingPaymentModal] = useState(false);
  const [pendingPaymentToPay, setPendingPaymentToPay] = useState(null);
  const [showDeleteTransactionModal, setShowDeleteTransactionModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const isApplyingHistoryRef = useRef(false);
  const hasInitializedHistoryRef = useRef(false);

  // ====== EFFECTS ======
  // Reaccionar a cambios de initialView (navegación mobile desde App.jsx)
  useEffect(() => {
    if (!initialView || initialView === currentView) return;

    // Modales: no cambian la vista, abren un panel
    if (initialView === 'bulk-upload') {
      setShowBulkUpload(true);
      return;
    }

    setCurrentView(initialView);
  }, [initialView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escuchar cambios en la configuración del dashboard
  useEffect(() => {
    const handleSettingsChange = (e) => {
      console.log('⚙️ Configuración del dashboard cambió:', e.detail);
      setDashboardSettings(e.detail);
    };
    window.addEventListener('modernDashboardSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('modernDashboardSettingsChanged', handleSettingsChange);
  }, []);

  // Actualiza dashboardSettings + localStorage + notifica a otros listeners
  // (mismo contrato que usaba DashboardSettingsModal.handleSave). Ajustes
  // llama esto directo en cada toggle, sin paso de "Guardar" intermedio.
  const handleDashboardSettingsChange = (next) => {
    setDashboardSettings(next);
    try {
      localStorage.setItem('modernDashboardSettings', JSON.stringify(next));
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('modernDashboardSettingsChanged', { detail: next }));
  };

  // Scope del header: sincroniza con la selección de meses de la vista activa
  // { mode: 'monthly', month: 'YYYY-MM' } | { mode: 'accumulated', months: [1..12], year: YYYY }
  const [headerScope, setHeaderScope] = useState(null); // null = usar scope del dashboard settings

  useEffect(() => {
    const handleScopeChange = (e) => setHeaderScope(e.detail);
    window.addEventListener('headerScope:changed', handleScopeChange);
    return () => window.removeEventListener('headerScope:changed', handleScopeChange);
  }, []);

  // Resetear scope del header cuando el usuario cambia de vista
  useEffect(() => {
    setHeaderScope(null);
  }, [currentView]);

  useEffect(() => {
    const buildNavState = () => ({
      appNav: true,
      view: currentView,
      showBulkUpload,
    });

    if (!hasInitializedHistoryRef.current) {
      window.history.replaceState(buildNavState(), '');
      window.history.pushState(buildNavState(), '');
      hasInitializedHistoryRef.current = true;
      return;
    }

    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      return;
    }

    window.history.pushState(buildNavState(), '');
  }, [currentView, showBulkUpload]);

  useEffect(() => {
    const handlePopState = (event) => {
      const navState = event.state;

      if (!navState?.appNav) {
        window.history.pushState(
          {
            appNav: true,
            view: currentView,
            showBulkUpload,
          },
          ''
        );
        return;
      }

      isApplyingHistoryRef.current = true;
      setCurrentView(navState.view || 'dashboard');
      setShowBulkUpload(Boolean(navState.showBulkUpload));
      onNavigate && onNavigate(navState.view || 'dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, onNavigate, showBulkUpload]);

  useEffect(() => {
    const loadCedears = async () => {
      try {
        const data = await yfinanceService.getAllCedears(30);
        setCedears(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('❌ Error cargando CEDEARs:', error);
        setCedears([]);
      }
    };

    loadCedears();
  }, []);

  // ====== HELPERS ======
  const getCategoryIcon = (categoriaNombre) => {
    if (!categoriaNombre) return '💰';
    
    const icons = {
      'alimentos': '🛒',
      'transporte': '🚗',
      'entretenimiento': '🎬',
      'servicios': '💡',
      'salud': '💊',
      'restaurantes': '☕',
      'combustible': '⛽',
      'compras': '📦',
      'educacion': '📚',
      'hogar': '🏠',
      'viajes': '✈️',
      'tecnologia': '💻',
      'ropa': '👕',
      'deporte': '⚽',
      'mascotas': '🐾',
      'salario': '💰',
      'freelance': '💼',
      'inversiones': '📈'
    };
    
    return icons[categoriaNombre.toLowerCase()] || '💰';
  };

  const getCategoryColor = (tipo) => {
    return tipo === 'ingreso' ? 'bg-green-500' : 'bg-red-500';
  };

  // Derivados directamente de React Query — se actualizan en el mismo render, sin useEffect middleman
  const normalizedTransactions = useMemo(() => {
    const mapped = (Array.isArray(transactionsData) ? transactionsData : []).map((transaction) => {
      const categoriaObj = transaction.Categorias || transaction.categorias1 || transaction.categoria || null;
      const categoriaNombre = categoriaObj?.nombre || categoriaObj?.Nombre || transaction.categoria_nombre || 'Sin categoría';
      const metodoPagoObj = transaction.MetodosPago || transaction.metodos_pago1 || transaction.metodo_pago || null;
      const metodoPagoNombre = metodoPagoObj?.nombre || metodoPagoObj?.Nombre || 'Sin método';
      return {
        ...transaction,
        fecha: transaction.fecha_transaccion || transaction.fecha,
        categoria: categoriaNombre,
        metodoPago: metodoPagoNombre,
        icono: getCategoryIcon(categoriaNombre),
        color: getCategoryColor(transaction.tipo)
      };
    });

    return mapped.sort((a, b) => {
      const dateA = new Date(a.fecha_transaccion || a.fecha || a.created_at || 0).getTime();
      const dateB = new Date(b.fecha_transaccion || b.fecha || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [transactionsData]);

  const transactions = useMemo(
    () => normalizedTransactions.filter(t => !t.es_credito),
    [normalizedTransactions]
  );
  const creditCardTransactions = useMemo(
    () => normalizedTransactions.filter(t => t.es_credito),
    [normalizedTransactions]
  );
  const pendingPayments = useMemo(
    () => Array.isArray(pendingPaymentsData) ? pendingPaymentsData : [],
    [pendingPaymentsData]
  );
  // Contador para el badge dorado de "Vencimientos" en ModernTopNav (ver
  // DESIGN.md "Nav pills" — se muestra solo si hay pendientes).
  const pendingPaymentsCount = pendingPayments.filter((p) => {
    const isPaid = p.estado === 'pagado' || p.estado === 'true' || p.pagada === true;
    return !isPaid;
  }).length;
  const objetivos = useMemo(
    () => Array.isArray(objetivosData) ? objetivosData : [],
    [objetivosData]
  );
  const presupuestos = useMemo(
    () => Array.isArray(presupuestosData) ? presupuestosData : [],
    [presupuestosData]
  );
  const resumenesBancarios = useMemo(
    () => Array.isArray(resumenesData) ? resumenesData : [],
    [resumenesData]
  );
  const monedas = useMemo(
    () => Array.isArray(monedasData) ? monedasData : [],
    [monedasData]
  );

  // ====== DATA LOADING ======
  // ====== ELIMINADO: loadDashboardData (Reemplazado por React Query) ======
  // Esta función cargaba TODOS los datos al inicio. Ahora cada vista carga sus propios datos con useQuery.
  /*
  const loadDashboardData = async () => {
    console.log('🔄 ModernMissionControl: Iniciando carga de datos...');
    
    try {
      setLoading(true);

      console.log('🔐 Token en localStorage:', localStorage.getItem('auth_token') ? 'SÍ EXISTE' : '❌ NO EXISTE');

      // Cargar datos en paralelo
      console.log('📡 Iniciando fetches en paralelo...');
      
      const [
        transResponse,
        catsResponse,
        pmsResponse,
        pendingResponse,
        objetivosResponse,
        presupuestosResponse,
        resumenesResponse,
        monedasResponse,
        quotesResponse
      ] = await Promise.all([
        transaccionesApi.getAll()
          .then(res => {
            console.log('✅ Transacciones cargadas:', res);
            return res;
          })
          .catch((err) => {
            console.error('❌ Error cargando transacciones:', err);
            console.error('❌ Error detail:', err.message);
            return { list: [] };
          }),
        categoriesApi.getAll()
          .then(res => {
            console.log('✅ Categorías cargadas:', res);
            return res;
          })
          .catch((err) => {
            console.error('❌ Error cargando categorías:', err);
            return { list: [] };
          }),
        paymentMethodsApi.getAll()
          .then(res => {
            console.log('✅ Métodos de pago cargados:', res);
            return res;
          })
          .catch((err) => {
            console.error('❌ Error cargando métodos de pago:', err);
            return { list: [] };
          }),
        pagosPendientesApi.getAll()
          .then(res => {
            console.log('✅ Pagos pendientes cargados:', res);
            return res;
          })
          .catch((err) => {
            console.error('❌ Error cargando pagos pendientes:', err);
            return { list: [] };
          }),
        objetivosApi.getActive()
          .then(res => {
            console.log('✅ Objetivos cargados:', res);
            return res;
          })
          .catch((err) => {
            console.error('❌ Error cargando objetivos:', err);
            return { list: [] };
          }),
        presupuestosApi.getActive()
          .then(res => {
            console.log('✅ Presupuestos cargados:', res);
            return res;
          })
          .catch((err) => {
            console.error('❌ Error cargando presupuestos:', err);
            return { list: [] };
          }),
        resumenesBancariosApi.getAll()
          .then(res => {
            console.log('✅ Resúmenes bancarios cargados:', res);
            return res;
          })
          .catch((err) => {
            console.error('❌ Error cargando resúmenes bancarios:', err);
            return { list: [] };
          }),
        monedasApi.getAll({ activa: true, orden_by: 'orden' })
          .then(res => {
            console.log('✅ Monedas cargadas:', res);
            return res;
          })
          .catch((err) => {
            console.error('❌ Error cargando monedas:', err);
            return [];
          }),
        fetch('https://dolarapi.com/v1/dolares')
          .then(r => r.json())
          .then(res => {
            console.log('✅ Cotizaciones cargadas:', res);
            return res;
          })
          .catch(() => [])
      ]);

      console.log('✅ Datos cargados:', {
        transacciones: transResponse.list?.length || 0,
        categorias: catsResponse.list?.length || 0,
        metodosPago: pmsResponse.list?.length || 0,
        cotizaciones: quotesResponse.length || 0
      });

      // Debug: Mostrar primeras 3 transacciones con sus fechas
      if (transResponse.list && transResponse.list.length > 0) {
        console.log('🔍 Primeras 3 transacciones (debug fechas):', 
          transResponse.list.slice(0, 3).map(t => ({
            descripcion: t.descripcion,
            fecha_raw: t.fecha_transaccion,
            fecha_parsed: new Date(t.fecha_transaccion).toISOString(),
            monto: t.monto_ars,
            tipo: t.tipo
          }))
        );
      }

      // Transformar transacciones del API al formato esperado por los componentes
      const allTransactions = (transResponse.list || []).map(t => {
        // El backend devuelve "Categorias" (con mayúscula) y "categorias1"
        const categoriaObj = t.Categorias || t.categorias1 || t.categoria || null;
        const categoriaNombre = categoriaObj?.nombre || categoriaObj?.Nombre || 'Sin categoría';
        
        // Idem para métodos de pago
        const metodoPagoObj = t.MetodosPago || t.metodos_pago1 || t.metodo_pago || null;
        const metodoPagoNombre = metodoPagoObj?.nombre || metodoPagoObj?.Nombre || 'Sin método';
        
        return {
          ...t, // Mantener datos originales
          // Agregar campos que esperan los componentes
          fecha: t.fecha_transaccion, // Alias para compatibilidad
          categoria: categoriaNombre,
          metodoPago: metodoPagoNombre,
          icono: getCategoryIcon(categoriaNombre),
          color: getCategoryColor(t.tipo)
        };
      });

      // Filtrar transacciones: EXCLUIR las que son tarjeta de crédito
      const transformedTransactions = allTransactions.filter(t => !t.es_credito);
      
      // Transacciones de tarjeta de crédito (para la vista de Tarjetas)
      const creditCardTransactions = allTransactions.filter(t => t.es_credito);
      
      console.log('💳 Filtrado de transacciones:', {
        total: allTransactions.length,
        transaccionesNormales: transformedTransactions.length,
        tarjetaCredito: creditCardTransactions.length
      });

      console.log('🔄 Transacciones transformadas:', transformedTransactions.slice(0, 3));
      
      // Debug: Verificar categorías
      const sinCategoria = transformedTransactions.filter(t => t.categoria === 'Sin categoría').length;
      if (sinCategoria > 0) {
        console.warn(`⚠️ ${sinCategoria} transacciones sin categoría asignada`);
        console.log('🔍 Muestra de transacción sin categoría:', 
          transResponse.list.find(t => !t.categoria && !t.categoria_nombre)
        );
      }

      // Transformar pagos pendientes
      const transformedPendingPayments = (pendingResponse.list || []).map(p => {
        const categoriaObj = p.Categorias || p.categorias1 || p.categoria || null;
        const categoriaNombre = categoriaObj?.nombre || categoriaObj?.Nombre || 'Sin categoría';
        
        // Calcular días restantes
        const fechaVencimiento = new Date(p.fecha_vencimiento || p.FechaVencimiento);
        const hoy = new Date();
        const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
        
        return {
          ...p,
          nombre: p.nombre || p.Nombre || 'Sin nombre',
          monto: parseFloat(p.monto || p.Monto || 0),
          fechaVencimiento: p.fecha_vencimiento || p.FechaVencimiento,
          diasRestantes,
          estado: p.estado || p.Estado || 'pendiente',
          categoria: categoriaNombre
        };
      });

      console.log('💰 Pagos pendientes transformados:', transformedPendingPayments);

      // Normalizar objetivos
      const objetivosList = objetivosResponse.list || objetivosResponse || [];
      console.log('🎯 Objetivos normalizados:', objetivosList);

      // Normalizar presupuestos
      const presupuestosList = presupuestosResponse.list || presupuestosResponse || [];
      console.log('💰 Presupuestos normalizados:', presupuestosList);

      // Normalizar resúmenes bancarios
      const resumenesList = resumenesResponse.list || resumenesResponse || [];
      console.log('🏦 Resúmenes bancarios normalizados:', resumenesList);

      // Cargar CEDEARs
      let cedearsData = [];
      try {
        console.log('📊 Cargando CEDEARs...');
        cedearsData = await yfinanceService.getAllCedears(30);
        console.log('✅ CEDEARs cargados:', cedearsData.length);
      } catch (error) {
        console.error('❌ Error cargando CEDEARs:', error);
      }

      // Normalizar monedas
      const monedasList = monedasResponse || [];
      console.log('💱 Monedas normalizadas:', monedasList);

      setTransactions(transformedTransactions);
      setCreditCardTransactions(creditCardTransactions);
      setPendingPayments(transformedPendingPayments);
      setObjetivos(objetivosList);
      setPresupuestos(presupuestosList);
      setResumenesBancarios(resumenesList);
      setCedears(cedearsData);
      setMonedas(monedasList);
      setCategories(catsResponse.list || []);
      setPaymentMethods(pmsResponse.list || []);
      setDollarQuotes(quotesResponse || []);

      // Calcular estadísticas del dashboard
      const stats = calculateDashboardStats(transResponse.list || []);
      const currenciesBalance = calculateCurrenciesBalance(allTransactions);
      
      setDashboardData({
        balance: stats,
        currenciesBalance, // ← NUEVO
        dollarQuote: parseDollarQuotes(quotesResponse),
        notifications: [] // TODO: Implementar notificaciones reales
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  */

  const calculateCurrenciesBalance = (transactions) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Agrupar transacciones por moneda
    const byMoneda = {};

    transactions.forEach(t => {
      // Filtrar solo del mes actual y sin tarjetas de crédito
      const tDate = new Date(t.fecha_transaccion);
      if (tDate.getMonth() !== currentMonth || tDate.getFullYear() !== currentYear || t.es_credito) {
        return;
      }

      const moneda = t.moneda || t.Moneda || 'ARS';
      if (!byMoneda[moneda]) {
        byMoneda[moneda] = { ingresos: 0, gastos: 0 };
      }

      const monto = Math.abs(parseFloat(t.monto_ars || t.monto || 0));
      if (t.tipo === 'ingreso') {
        byMoneda[moneda].ingresos += monto;
      } else if (t.tipo === 'gasto') {
        byMoneda[moneda].gastos += monto;
      }
    });

    // Convertir a array
    const result = Object.entries(byMoneda).map(([code, data]) => ({
      code,
      symbol: code === 'ARS' || code === 'USD' ? '$' : (code === 'EUR' ? '€' : code),
      ingresos: data.ingresos,
      gastos: data.gastos,
      equivalent: { currency: code === 'ARS' ? 'USD' : 'ARS' },
      ingresosVariation: '+0%',
      gastosVariation: '-0%'
    }));

    console.log('💱 Balance por moneda calculado:', result);
    return result;
  };

  const calculateDashboardStats = (transactions) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    console.log('📅 Filtrando transacciones del mes:', {
      mesActual: currentMonth + 1, // +1 porque getMonth() es 0-indexed
      añoActual: currentYear,
      totalTransacciones: transactions.length
    });

    const monthTransactions = transactions.filter(t => {
      // ❌ EXCLUIR transacciones de tarjeta de crédito
      if (t.es_credito) {
        return false;
      }

      if (!t.fecha_transaccion) {
        console.warn('⚠️ Transacción sin fecha:', t);
        return false;
      }

      const tDate = new Date(t.fecha_transaccion);
      
      // Verificar si la fecha es válida
      if (isNaN(tDate.getTime())) {
        console.warn('⚠️ Fecha inválida en transacción:', t.fecha_transaccion, t);
        return false;
      }

      const isCurrentMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      
      if (isCurrentMonth) {
        console.log('✅ Transacción del mes actual:', {
          descripcion: t.descripcion,
          fecha: t.fecha_transaccion,
          mes: tDate.getMonth() + 1,
          año: tDate.getFullYear(),
          monto: t.monto_ars,
          tipo: t.tipo,
          esCredito: t.es_credito
        });
      }

      return isCurrentMonth;
    });

    const ingresos = monthTransactions
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || 0)), 0);

    const gastos = monthTransactions
      .filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || 0)), 0);

    const stats = {
      totalARS: ingresos - gastos,
      totalUSD: (ingresos - gastos) / 1270, // Estimación con dólar blue
      ingresosMes: ingresos,
      gastosMes: gastos,
      balance: ingresos - gastos,
      transacciones: monthTransactions.length
    };

    console.log('📊 Stats calculados:', {
      transaccionesDelMes: monthTransactions.length,
      ingresos: ingresos.toFixed(2),
      gastos: gastos.toFixed(2),
      balance: stats.balance.toFixed(2)
    });

    return stats;
  };

  const parseDollarQuotes = (quotes) => {
    const blue = quotes.find(q => q.casa === 'blue') || { venta: 0, variacion: 0 };
    const oficial = quotes.find(q => q.casa === 'oficial') || { venta: 0, variacion: 0 };
    
    return {
      blue: { venta: blue.venta, variacion: parseFloat(blue.variacion || 0) },
      oficial: { venta: oficial.venta, variacion: parseFloat(oficial.variacion || 0) }
    };
  };

  // ====== HANDLERS ======
  const handleNavigate = (view) => {
    console.log('🎯 ModernMissionControl.handleNavigate:', view);

    // Vistas que abren modales en lugar de cambiar ruta
    if (view === 'bulk-upload') {
      setShowBulkUpload(true);
      return;
    }

    if (showBulkUpload) {
      setShowBulkUpload(false);
    }

    setCurrentView(view);
    onNavigate && onNavigate(view);
  };

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction || null);
    setShowDeleteTransactionModal(true);
  };

  const confirmDeleteTransaction = async () => {
    const id = transactionToDelete?.id || transactionToDelete?.Id;
    if (!id) {
      setShowDeleteTransactionModal(false);
      setTransactionToDelete(null);
      return;
    }
    try {
      await transaccionesApi.delete(id);
      await refreshData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error al eliminar la transacción');
    } finally {
      setShowDeleteTransactionModal(false);
      setTransactionToDelete(null);
    }
  };

  const handleMarkAsPaid = async (transaction) => {
    console.log('💳 Marcar como pagado:', transaction);
    
    if (!window.confirm(`¿Marcar como pagado: ${transaction.descripcion}?\n\nMonto: $${Math.abs(transaction.monto_ars).toLocaleString()}`)) {
      return;
    }

    try {
      // Actualizar la transacción para marcarla como pagada
      // Podemos cambiar es_credito a false o agregar un campo fecha_pago_real
      await transaccionesApi.update(transaction.id, {
        es_credito: false, // Ahora ya no es deuda de tarjeta
        fecha_pago_real: new Date().toISOString().split('T')[0], // Fecha de pago
        notas: (transaction.notas || '') + `\n[Pagado el ${new Date().toLocaleDateString('es-AR')}]`
      });
      
      console.log('✅ Transacción marcada como pagada');
      await refreshData(); // Recargar datos
    } catch (error) {
      console.error('❌ Error marcando como pagado:', error);
      alert('Error al marcar como pagado: ' + error.message);
    }
  };

  const handleMarkPendingPaymentAsPaid = async (pago) => {
    setPendingPaymentToPay(pago);
    setShowPayPendingPaymentModal(true);
  };

  const handleConfirmPendingPayment = async (paymentPayload) => {
    try {
      await apiServices.pagosApi.registrarPago({
        item_id: paymentPayload.item_id,
        item_type: 'pending_payment',
        monto: paymentPayload.monto,
        moneda: paymentPayload.moneda || 'ARS',
        fecha_pago: paymentPayload.fecha_pago,
        categoria_id: paymentPayload.categoria_id,
        metodo_pago_id: paymentPayload.metodo_pago_id,
        notas: paymentPayload.notas,
        comprobante: paymentPayload.comprobante
      });

      await refreshData();
      setShowPayPendingPaymentModal(false);
      setPendingPaymentToPay(null);
      console.log('✅ Pago pendiente registrado correctamente');
    } catch (error) {
      console.error('❌ Error registrando pago pendiente:', error);
      throw error;
    }
  };

  const handleBulkUpload = () => {
    setShowBulkUpload(true);
  };

  const handleExportCSV = () => {
    // TODO: Implementar exportación CSV
    console.log('Exportando CSV...');
  };

  const handleSearch = (query) => {
    // TODO: Implementar búsqueda global
    console.log('Buscando:', query);
  };

  const getTransactionDate = (transaction) => {
    const rawDate =
      transaction.fecha_transaccion ||
      transaction.fecha ||
      transaction.FechaTransaccion ||
      transaction.Fecha ||
      transaction.created_at ||
      transaction.fecha_creacion;

    if (!rawDate) return null;

    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const balanceMode = dashboardSettings.balanceMode === 'accumulated' ? 'accumulated' : 'monthly';

  const isTransactionInScope = (transactionDate) => {
    if (!transactionDate) return false;

    // Si hay un scope activo desde Transacciones o el gráfico, usarlo
    if (headerScope) {
      if (headerScope.mode === 'monthly') {
        const [yr, mo] = headerScope.month.split('-').map(Number);
        return (
          transactionDate.getFullYear() === yr &&
          transactionDate.getMonth() + 1 === mo
        );
      }
      if (headerScope.mode === 'accumulated') {
        return (
          transactionDate.getFullYear() === headerScope.year &&
          headerScope.months.includes(transactionDate.getMonth() + 1)
        );
      }
    }

    // Scope por defecto: dashboard settings
    if (balanceMode === 'accumulated') return true;
    const now = new Date();
    return (
      transactionDate.getMonth() === now.getMonth() &&
      transactionDate.getFullYear() === now.getFullYear()
    );
  };

  const headerBalanceData = React.useMemo(() => {
    const scopedTransactions = transactions.filter((transaction) => {
      if (transaction.es_credito) return false;
      return isTransactionInScope(getTransactionDate(transaction));
    });

    const ingresos = scopedTransactions
      .filter((transaction) => transaction.tipo === 'ingreso')
      .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.monto_ars || transaction.monto || 0)), 0);

    const gastos = scopedTransactions
      .filter((transaction) => transaction.tipo === 'gasto')
      .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.monto_ars || transaction.monto || 0)), 0);

    const balance = ingresos - gastos;

    return {
      totalARS: balance,
      totalUSD: balance / 1270,
      ingresosMes: ingresos,
      gastosMes: gastos,
      balance,
      transacciones: scopedTransactions.length,
      scopeMode: balanceMode
    };
  }, [transactions, balanceMode, headerScope]);

  const headerCurrenciesBalance = React.useMemo(() => {
    const byCurrency = {};

    transactions.forEach((transaction) => {
      if (transaction.es_credito) return;
      if (!isTransactionInScope(getTransactionDate(transaction))) return;

      const currencyCode = transaction.moneda || transaction.Moneda || 'ARS';
      if (!byCurrency[currencyCode]) {
        byCurrency[currencyCode] = { ingresos: 0, gastos: 0 };
      }

      const amount = Math.abs(parseFloat(transaction.monto_ars || transaction.monto || 0));
      if (transaction.tipo === 'ingreso') {
        byCurrency[currencyCode].ingresos += amount;
      } else if (transaction.tipo === 'gasto') {
        byCurrency[currencyCode].gastos += amount;
      }
    });

    return Object.entries(byCurrency).map(([code, data]) => ({
      code,
      symbol: code === 'EUR' ? 'EUR ' : '$',
      ingresos: data.ingresos,
      gastos: data.gastos,
      equivalent: { currency: code === 'ARS' ? 'USD' : 'ARS' },
      ingresosVariation: '+0%',
      gastosVariation: '-0%'
    }));
  }, [transactions, balanceMode, headerScope]);

  const effectiveDashboardData = React.useMemo(() => {
    return {
      ...(dashboardData || {}),
      balance: headerBalanceData
    };
  }, [dashboardData, headerBalanceData]);

  const handleTransactionSaved = async () => {
    // El form ya llama onClose internamente al guardar — acá solo refrescamos los datos
    await refreshData();
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const handleBulkUploadComplete = async () => {
    setShowBulkUpload(false);
    await refreshData();
  };

  const handleBudgetSaved = async () => {
    await refreshData();
    setShowBudgetModal(false);
    setEditingBudget(null);
  };

  const handleAsignarDineroSuccess = async () => {
    await refreshData();
    setShowAsignarDineroModal(false);
    setObjetivoToFund(null);
  };

  const handleLogout = async () => {
    await logout();
  };

  // ====== RENDER VIEWS ======
  const renderView = () => {
    console.log('🎨 renderView called - currentView:', currentView);
    
    // Si NO está autenticado, mostrar mensaje
    if (!user && !loadingStats) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Sesión Expirada</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Tu sesión ha expirado o no has iniciado sesión. Por favor, recargá la página e iniciá sesión nuevamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[var(--accent-green)] text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <ModernDashboard
            user={user}
            transactions={transactions}
            pendingPayments={pendingPayments}
            dollarQuotes={dollarQuotes}
            loading={loadingTx}
            onNavigate={handleNavigate}
            onNewTransaction={handleNewTransaction}
          />
        );

      case 'transactions':
      case 'transactions-full':
        return (
          <ModernTransactionsView
            transactions={transactions}
            categories={categories}
            paymentMethods={paymentMethods}
            onNewTransaction={handleNewTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onBulkUpload={handleBulkUpload}
            onExportCSV={handleExportCSV}
            loading={loadingStats}
          />
        );

      

      case 'tarjetas-full':
        return (
          <ModernTarjetasView
            transactions={creditCardTransactions}
            categories={categories}
            paymentMethods={paymentMethods}
            onPagarTarjeta={(tarjeta) => console.log('Pagar:', tarjeta)}
            onUploadResumen={() => console.log('Upload resumen')}
            onNewTarjeta={handleNewTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onMarkAsPaid={handleMarkAsPaid}
          />
        );

      case 'objetivos-full':
        return (
          <ModernObjetivosView
            objetivos={objetivos}
            onNewObjetivo={() => {
              setEditingObjetivo(null);
              setShowObjetivoModal(true);
            }}
            onEditObjetivo={(obj) => {
              setEditingObjetivo(obj || null);
              setShowObjetivoModal(true);
            }}
            onDeleteObjetivo={async (id) => {
              if (!id) return;
              try {
                await objetivosApi.delete(id);
                await refreshData();
              } catch (error) {
                console.error('Error deleting objetivo:', error);
                alert('Error al eliminar el objetivo');
              }
            }}
            onAportar={(obj) => {
              setObjetivoToFund(obj || null);
              setShowAsignarDineroModal(true);
            }}
          />
        );

      case 'budgets':
      case 'presupuestos-full':
        return (
          <ModernPresupuestosView
            presupuestos={presupuestos}
            transactions={transactions}
            categories={categories}
            onNewPresupuesto={() => {
              setEditingBudget(null);
              setShowBudgetModal(true);
            }}
            onEditPresupuesto={(budget) => {
              setEditingBudget(budget || null);
              setShowBudgetModal(true);
            }}
            onDeletePresupuesto={async (id) => {
              try {
                await presupuestosApi.delete(id);
                await refreshData();
              } catch (error) {
                console.error('Error eliminando presupuesto:', error);
                alert('Error al eliminar presupuesto: ' + error.message);
              }
            }}
            onAnalyzePurchase={() => console.log('Analizar compra')}
          />
        );

      case 'categories':
      case 'categories-full':
        // Deviation: ModernCategoriesView ya no trae su propio fondo de
        // página (ahora vive embebida en Ajustes, ver ModernAjustesView).
        // Estos ids viejos siguen alcanzables desde el menú móvil
        // (MobileBottomNav), así que se les da acá el mismo contenedor de
        // página que usan el resto de las vistas Papel.
        return (
          <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-[34px] sm:py-[28px]">
              <h1 className="mb-4 font-serif text-[26px] font-bold leading-none text-foreground sm:mb-5 sm:text-[42px]">
                Categorías
              </h1>
              <ModernCategoriesView
                onNewCategory={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
                onEditCategory={(cat) => {
                  setEditingCategory(cat || null);
                  setShowCategoryModal(true);
                }}
                onDeleteCategory={async (id) => {
                  try {
                    await categoriesApi.delete(id);
                    await refreshData();
                  } catch (error) {
                    console.error('Error eliminando categoría:', error);
                    alert('Error al eliminar categoría: ' + error.message);
                  }
                }}
              />
            </div>
          </div>
        );

      case 'payment-methods':
      case 'payment-methods-full':
        // Deviation: idem 'categories-full' — ModernPaymentMethodsView ya
        // no trae su propio fondo de página (vive embebida en Ajustes).
        return (
          <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-[34px] sm:py-[28px]">
              <h1 className="mb-4 font-serif text-[26px] font-bold leading-none text-foreground sm:mb-5 sm:text-[42px]">
                Métodos de Pago
              </h1>
              <ModernPaymentMethodsView
                paymentMethods={paymentMethods}
                onNewPaymentMethod={() => {
                  setEditingPaymentMethod(null);
                  setShowPaymentMethodModal(true);
                }}
                onEditPaymentMethod={(pm) => {
                  setEditingPaymentMethod(pm);
                  setShowPaymentMethodModal(true);
                }}
                onDeletePaymentMethod={async (id) => {
                  try {
                    await paymentMethodsApi.delete(id);
                    await refreshData();
                  } catch (error) {
                    console.error('Error eliminando método de pago:', error);
                    alert('Error al eliminar método de pago: ' + error.message);
                  }
                }}
              />
            </div>
          </div>
        );

      case 'pending-payments':
      case 'pending-payments-full':
        return (
          <ModernPendingPaymentsView
            pagos={pendingPayments}
            onNewPago={() => {
              setEditingPendingPayment(null);
              setShowPendingPaymentModal(true);
            }}
            onEditPago={(p) => {
              console.log('✏️ Editando pago pendiente:', p);
              setEditingPendingPayment(p);
              setShowPendingPaymentModal(true);
            }}
            onDeletePago={async (id) => {
              try {
                await pagosPendientesApi.delete(id);
                await refreshData();
              } catch (error) {
                console.error('Error:', error);
                alert('Error: ' + error.message);
              }
            }}
            onMarcarPagado={handleMarkPendingPaymentAsPaid}
          />
        );

      case 'monedas-full':
        return (
          <ModernMonedasView
            monedas={monedas}
            onNewMoneda={() => {
              setEditingCurrency(null);
              setShowCurrencyModal(true);
            }}
            onEditMoneda={(m) => {
              console.log('✏️ Editando moneda:', m);
              setEditingCurrency(m);
              setShowCurrencyModal(true);
            }}
            onDeleteMoneda={async (id) => {
              try {
                await monedasApi.delete(id);
                await refreshData();
                console.log('✅ Moneda eliminada');
              } catch (error) {
                console.error('❌ Error eliminando moneda:', error);
                alert('Error al eliminar moneda: ' + error.message);
              }
            }}
            onToggleActive={async (id) => {
              try {
                await monedasApi.toggleActive(id);
                await refreshData();
                console.log('✅ Moneda activada/desactivada');
              } catch (error) {
                console.error('❌ Error cambiando estado:', error);
              }
            }}
            onReorder={(newOrder) => console.log('Reorder:', newOrder)}
            onInitializeDefault={async () => {
              console.log('🔧 Inicializando monedas predeterminadas...');
              try {
                await monedasApi.initializeDefault();
                await refreshData();
                console.log('✅ Monedas inicializadas');
              } catch (error) {
                console.error('❌ Error inicializando monedas:', error);
                alert('Error: ' + error.message);
              }
            }}
          />
        );

      case 'ai-usage':
      case 'ai-usage-full':
        // Deviation: idem 'categories-full' — ModernAIUsageView ya no trae
        // fondo de página propio (vive embebida en Ajustes).
        return (
          <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-[34px] sm:py-[28px]">
              <h1 className="mb-4 font-serif text-[26px] font-bold leading-none text-foreground sm:mb-5 sm:text-[42px]">
                Uso de Lucy
              </h1>
              <ModernAIUsageView />
            </div>
          </div>
        );

      case 'resumen-bancario':
      case 'bank-summaries-full':
        return (
          <ModernResumenesView
            resumenes={resumenesBancarios}
            onUploadResumen={() => console.log('Upload resumen pendiente implementar')}
          />
        );

      case 'inversiones':
        return (
          <ModernInversionesView
            cedears={cedears}
            onRefreshCedears={async () => {
              try {
                const data = await yfinanceService.getAllCedears(30);
                setCedears(data);
              } catch (error) {
                console.error('❌ Error actualizando CEDEARs:', error);
              }
            }}
            onViewCedearDetails={(c) => console.log('Ver detalles:', c)}
            cotizaciones={dollarQuotes}
            onRefreshCotizaciones={refreshData}
            monedas={monedas}
            onNewMoneda={() => {
              setEditingCurrency(null);
              setShowCurrencyModal(true);
            }}
            onEditMoneda={(m) => {
              setEditingCurrency(m);
              setShowCurrencyModal(true);
            }}
            onDeleteMoneda={async (id) => {
              try {
                await monedasApi.delete(id);
                await refreshData();
              } catch (error) {
                console.error('❌ Error eliminando moneda:', error);
                alert('Error al eliminar moneda: ' + error.message);
              }
            }}
            onToggleActiveMoneda={async (id) => {
              try {
                await monedasApi.toggleActive(id);
                await refreshData();
              } catch (error) {
                console.error('❌ Error cambiando estado:', error);
              }
            }}
            onInitializeDefaultMonedas={async () => {
              try {
                await monedasApi.initializeDefault();
                await refreshData();
              } catch (error) {
                console.error('❌ Error inicializando monedas:', error);
                alert('Error: ' + error.message);
              }
            }}
          />
        );

      case 'dollar':
        return (
          <ModernCotizacionesView
            cotizaciones={dollarQuotes}
            onRefresh={refreshData}
          />
        );

      case 'cedears':
        return (
          <ModernCEDEARsView
            cedears={cedears}
            onSearch={(query) => console.log('Buscar:', query)}
            onRefresh={async () => {
              console.log('🔄 Refrescando CEDEARs...');
              try {
                const data = await yfinanceService.getAllCedears(30);
                setCedears(data);
                console.log('✅ CEDEARs actualizados');
              } catch (error) {
                console.error('❌ Error actualizando CEDEARs:', error);
              }
            }}
            onViewDetails={(c) => console.log('Ver detalles:', c)}
          />
        );

      case 'currency-management':
        return (
          <ModernMonedasView
            monedas={[]} // TODO: Cargar del API
            onNewMoneda={() => console.log('Nueva moneda')}
            onEditMoneda={(m) => console.log('Editar:', m)}
            onDeleteMoneda={(id) => console.log('Eliminar:', id)}
            onToggleActive={(id) => console.log('Toggle:', id)}
            onReorder={(order) => console.log('Reorder:', order)}
            onRefreshRates={() => console.log('Refresh rates')}
          />
        );

      case 'reportes':
        return (
          <ModernReportesView
            onGenerateReport={(tipo, periodo) => console.log('Generar:', tipo, periodo)}
            onExportPDF={() => console.log('Export PDF')}
          />
        );

      case 'ajustes':
        return (
          <ModernAjustesView
            dashboardSettings={dashboardSettings}
            onDashboardSettingsChange={handleDashboardSettingsChange}
            onNewCategory={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
            onEditCategory={(cat) => {
              setEditingCategory(cat || null);
              setShowCategoryModal(true);
            }}
            onDeleteCategory={async (id) => {
              try {
                await categoriesApi.delete(id);
                await refreshData();
              } catch (error) {
                console.error('Error eliminando categoría:', error);
                alert('Error al eliminar categoría: ' + error.message);
              }
            }}
            paymentMethods={paymentMethods}
            onNewPaymentMethod={() => {
              setEditingPaymentMethod(null);
              setShowPaymentMethodModal(true);
            }}
            onEditPaymentMethod={(pm) => {
              setEditingPaymentMethod(pm);
              setShowPaymentMethodModal(true);
            }}
            onDeletePaymentMethod={async (id) => {
              try {
                await paymentMethodsApi.delete(id);
                await refreshData();
              } catch (error) {
                console.error('Error eliminando método de pago:', error);
                alert('Error al eliminar método de pago: ' + error.message);
              }
            }}
          />
        );

      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
              Configuración
            </h1>
            <p className="text-[var(--text-secondary)]">
              Vista de configuración (Por implementar)
            </p>
          </div>
        );

      default:
        console.warn('⚠️ Vista no encontrada, mostrando dashboard. currentView:', currentView);
        return (
          <ModernDashboard
            user={user}
            transactions={transactions}
            pendingPayments={pendingPayments}
            dollarQuotes={dollarQuotes}
            loading={loadingTx}
            onNavigate={handleNavigate}
            onNewTransaction={handleNewTransaction}
          />
        );
    }
  };

  // ====== MAIN RENDER ======
  return (
    <>
      <ModernLayout
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        pendingPaymentsCount={pendingPaymentsCount}
        onNewTransaction={handleNewTransaction}
        onSearch={handleSearch}
        onLogout={handleLogout}
        amountsVisible={amountsVisible}
        onToggleAmountVisibility={toggleAmountVisibility}
      >
        <Suspense fallback={<LoadingSpinner message="Cargando vista..." />}>
          {renderView()}
        </Suspense>
      </ModernLayout>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <Suspense fallback={null}>
          <ModernTransactionForm
            isOpen={showTransactionModal}
            onClose={() => {
              setShowTransactionModal(false);
              setEditingTransaction(null);
            }}
            onSuccess={handleTransactionSaved}
            editingTransaction={editingTransaction}
          />
        </Suspense>
      )}

      {showObjetivoModal && (
        <Suspense fallback={null}>
          <ObjetivoFormModal
            isOpen={showObjetivoModal}
            onClose={() => {
              setShowObjetivoModal(false);
              setEditingObjetivo(null);
            }}
            onSuccess={async () => {
              await refreshData();
              setShowObjetivoModal(false);
              setEditingObjetivo(null);
            }}
            objetivo={editingObjetivo}
            categorias={categories}
          />
        </Suspense>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <Suspense fallback={null}>
          <BulkTransactionUpload
            isOpen={showBulkUpload}
            onClose={() => setShowBulkUpload(false)}
            onSuccess={handleBulkUploadComplete}
          />
        </Suspense>
      )}

      {showBudgetModal && (
        <Suspense fallback={null}>
          <BudgetModal
            isOpen={showBudgetModal}
            onClose={() => {
              setShowBudgetModal(false);
              setEditingBudget(null);
            }}
            onSuccess={handleBudgetSaved}
            editingBudget={editingBudget}
          />
        </Suspense>
      )}

      {showAsignarDineroModal && objetivoToFund && (
        <Suspense fallback={null}>
          <AsignarDineroModal
            isOpen={showAsignarDineroModal}
            onClose={() => {
              setShowAsignarDineroModal(false);
              setObjetivoToFund(null);
            }}
            objetivo={objetivoToFund}
            onSuccess={handleAsignarDineroSuccess}
            balanceDisponible={headerBalanceData?.total || 0}
            balancePorMoneda={headerCurrenciesBalance || {}}
          />
        </Suspense>
      )}

      {/* Dashboard Settings Modal */}
      <Suspense fallback={null}>
        <DashboardSettingsModal
          isOpen={showDashboardSettings}
          onClose={() => setShowDashboardSettings(false)}
        />
      </Suspense>

      {/* Currency Modal */}
      {showCurrencyModal && (
        <Suspense fallback={null}>
          <CurrencyModal
            isOpen={showCurrencyModal}
            onClose={() => {
              setShowCurrencyModal(false);
              setEditingCurrency(null);
            }}
            onSave={async (currencyData) => {
              console.log('💱 Guardando moneda:', currencyData);
              try {
                if (editingCurrency) {
                  await monedasApi.update(editingCurrency.id, currencyData);
                  console.log('✅ Moneda actualizada');
                } else {
                  await monedasApi.create(currencyData);
                  console.log('✅ Moneda creada');
                }
                await refreshData();
                setShowCurrencyModal(false);
                setEditingCurrency(null);
              } catch (error) {
                console.error('❌ Error guardando moneda:', error);
                alert('Error: ' + error.message);
                throw error;
              }
            }}
            currency={editingCurrency}
          />
        </Suspense>
      )}

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <Suspense fallback={null}>
          <PaymentMethodModal
            isOpen={showPaymentMethodModal}
            onClose={() => {
              setShowPaymentMethodModal(false);
              setEditingPaymentMethod(null);
            }}
            onSave={async (paymentMethodData) => {
              console.log('💳 Guardando método de pago:', paymentMethodData);
              try {
                if (editingPaymentMethod) {
                  await paymentMethodsApi.update(editingPaymentMethod.id, paymentMethodData);
                  console.log('✅ Método de pago actualizado');
                } else {
                  await paymentMethodsApi.create(paymentMethodData);
                  console.log('✅ Método de pago creado');
                }
                await refreshData();
                setShowPaymentMethodModal(false);
                setEditingPaymentMethod(null);
              } catch (error) {
                console.error('❌ Error guardando método:', error);
                alert('Error: ' + error.message);
                throw error;
              }
            }}
            paymentMethod={editingPaymentMethod}
          />
        </Suspense>
      )}

      {showCategoryModal && (
        <Suspense fallback={null}>
          <CategoryModal
            isOpen={showCategoryModal}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
            onSave={async (categoryData) => {
              try {
                if (editingCategory) {
                  await categoriesApi.update(editingCategory.id, categoryData);
                } else {
                  await categoriesApi.create(categoryData);
                }

                await refreshData();
                setShowCategoryModal(false);
                setEditingCategory(null);
              } catch (error) {
                console.error('❌ Error guardando categoría:', error);
                alert('Error: ' + error.message);
                throw error;
              }
            }}
            category={editingCategory}
          />
        </Suspense>
      )}
      {/* Pending Payment Form Modal */}
      {showPendingPaymentModal && (
        <Suspense fallback={null}>
          <StitchPendingPaymentModal
            isOpen={showPendingPaymentModal}
            onClose={() => {
              setShowPendingPaymentModal(false);
              setEditingPendingPayment(null);
            }}
            onSave={async (paymentData) => {
              try {
                const normalizedPaymentData = {
                  nombre: paymentData.Nombre ?? paymentData.nombre ?? '',
                  descripcion: paymentData.Descripcion ?? paymentData.descripcion ?? '',
                  monto: parseFloat(paymentData.Monto ?? paymentData.monto ?? 0) || 0,
                  moneda: paymentData.Moneda ?? paymentData.moneda ?? 'ARS',
                  fechavencimiento: paymentData.Fechavencimiento ?? paymentData.fechavencimiento ?? paymentData.fecha_vencimiento ?? null,
                  fecha_emision: paymentData.fecha_emision ?? null,
                  estado: (paymentData.Estado ?? paymentData.estado ?? 'pendiente').toString().toLowerCase(),
                  tipo: paymentData.Tipo ?? paymentData.tipo ?? 'factura',
                  prioridad: paymentData.Prioridad ?? paymentData.prioridad ?? 'media',
                  recurrente: paymentData.Recurrente ?? paymentData.recurrente ?? false,
                  frecuenciarecurrencia: paymentData.FrecuenciaRecurrencia ?? paymentData.frecuenciarecurrencia ?? paymentData.frecuencia_recurrencia ?? null,
                  num_factura: paymentData.num_factura ?? null,
                  url_pdf: paymentData.url_pdf ?? null,
                  comprobante: paymentData.comprobante ?? paymentData.Comprobante ?? null,
                  categorias_id: paymentData.categorias_id ?? paymentData.categoria_id ?? null,
                  metodos_pago_id: paymentData.metodos_pago_id ?? paymentData.metodo_pago_id ?? null,
                  notas: paymentData.Notas ?? paymentData.notas ?? '',
                  interes: parseFloat(paymentData.interes ?? 0) || 0,
                  recargo: parseFloat(paymentData.recargo ?? 0) || 0
                };

                if (editingPendingPayment) {
                  const paymentId = editingPendingPayment.id || editingPendingPayment.Id;
                  await pagosPendientesApi.update(paymentId, normalizedPaymentData);
                  console.log('✅ Pago actualizado');
                } else {
                  await pagosPendientesApi.create(normalizedPaymentData);
                  console.log('✅ Pago creado');
                }
                
                await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.pendingPayments] });
                await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.dashboardStats] });
                setShowPendingPaymentModal(false);
                setEditingPendingPayment(null);
              } catch (error) {
                console.error('❌ Error:', error);
                alert('Error: ' + error.message);
                throw error;
              }
            }}
            payment={editingPendingPayment}
            categories={categories}
            paymentMethods={paymentMethods}
          />
        </Suspense>
      )}

      {showPayPendingPaymentModal && (
        <Suspense fallback={null}>
          <PendingPaymentPayModal
            isOpen={showPayPendingPaymentModal}
            payment={pendingPaymentToPay}
            categories={categories}
            paymentMethods={paymentMethods}
            onClose={() => {
              setShowPayPendingPaymentModal(false);
              setPendingPaymentToPay(null);
            }}
            onConfirm={handleConfirmPendingPayment}
          />
        </Suspense>
      )}

      <ConfirmModal
        isOpen={showDeleteTransactionModal}
        onClose={() => {
          setShowDeleteTransactionModal(false);
          setTransactionToDelete(null);
        }}
        onConfirm={confirmDeleteTransaction}
        title="Eliminar transacción"
        message={`Vas a eliminar ${transactionToDelete?.descripcion || transactionToDelete?.Descripcion || 'esta transacción'}. Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />


      

    </>
  );
};

export default ModernMissionControl;
