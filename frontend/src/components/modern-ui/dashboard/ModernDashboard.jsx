import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIsMobile } from '../../../hooks/use-mobile';
import MobileDashboardHome from './MobileDashboardHome';
// Widgets modulares
import PagosPendientesWidget from './widgets/PagosPendientesWidget';
import DeudaTarjetaWidget from './widgets/DeudaTarjetaWidget';
import ObjetivosWidget from './widgets/ObjetivosWidget';
import GastosCategoriaWidget from './widgets/GastosCategoriaWidget';
import PresupuestosWidget from './widgets/PresupuestosWidget';
import ResumenesBancariosWidget from './widgets/ResumenesBancariosWidget';
import MetodosPagoWidget from './widgets/MetodosPagoWidget';
import EvolucionMensualWidget from './widgets/EvolucionMensualWidget';
import UsoCostoIAWidget from './widgets/UsoCostoIAWidget';

/**
 * ModernDashboard - El card de Transacciones se adapta a la altura de los widgets
 */
const ModernDashboard = ({ 
  user,
  dashboardData,
  dashboardSettings,
  transactions = [],
  pendingPayments = [],
  categories = [],
  objetivos = [],
  presupuestos = [],
  resumenesBancarios = [],
  onNavigate,
  onNewTransaction,
}) => {
  const isMobile = useIsMobile();
  // Renombrar para evitar conflictos con useMemo
  const objetivosRaw = objetivos;
  const presupuestosRaw = presupuestos;
  const widgetsRef = useRef(null);
  const transaccionesRef = useRef(null);

  // Configuración de widgets
  const [widgetSettings, setWidgetSettings] = useState(() => {
    const saved = localStorage.getItem('modernDashboardSettings');
    return saved ? JSON.parse(saved) : {
      showPagosPendientes: true,
      showObjetivos: true,
      showCategorias: true,
      showDeudaTarjetas: false,
      showPresupuestos: false,
      showResumenes: false,
      showMetodosPago: false,
      balanceMode: 'monthly'
    };
  });
  const [chartPeriod, setChartPeriod] = useState('monthly');

  // Debug: Log cuando llegan transacciones
  useEffect(() => {
    console.log('🎨 ModernDashboard recibió transactions:', {
      count: transactions?.length || 0,
      data: transactions?.slice(0, 3)
    });
  }, [transactions]);

  // Escuchar cambios en la configuración
  useEffect(() => {
    const handleSettingsChange = (e) => {
      setWidgetSettings(e.detail);
    };
    window.addEventListener('modernDashboardSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('modernDashboardSettingsChanged', handleSettingsChange);
  }, []);

  useEffect(() => {
    if (dashboardSettings) {
      setWidgetSettings(dashboardSettings);
    }
  }, [dashboardSettings]);

  // ========== HELPERS ==========
  
  const getCategoryIcon = (categoriaId) => {
    const icons = {
      'alimentos': '🛒',
      'alimentación': '🛒',
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
      'mascotas': '🐾'
    };
    return icons[categoriaId?.toLowerCase()] || '💰';
  };

  const getCategoryColor = (tipo) => {
    return tipo === 'ingreso' ? 'bg-green-500' : 'bg-red-500';
  };

  const getObjetivoColor = (porcentaje) => {
    if (porcentaje >= 80) return '#10b981';
    if (porcentaje >= 50) return '#fbbf24';
    return '#3b82f6';
  };

  const getCategoryColorForChart = (categoriaNombre) => {
    const colors = {
      'alimentos': '#f97316',
      'alimentación': '#f97316',
      'transporte': '#3b82f6',
      'entretenimiento': '#a855f7',
      'ocio': '#a855f7',
      'servicios': '#eab308',
      'salud': '#ef4444',
      'vivienda': '#8b5cf6',
      'hogar': '#8b5cf6',
      'educación': '#06b6d4',
      'ropa': '#ec4899',
      'tecnología': '#10b981',
      'otros': '#6b7280'
    };
    return colors[categoriaNombre?.toLowerCase()] || '#6b7280';
  };

  const getMetodoPagoColor = (metodoPago) => {
    const colors = {
      'débito': '#10b981',
      'debito': '#10b981',
      'crédito': '#3b82f6',
      'credito': '#3b82f6',
      'efectivo': '#fbbf24',
      'transferencia': '#a855f7',
      'mercado pago': '#06b6d4',
      'paypal': '#3b82f6',
      'otro': '#6b7280'
    };
    return colors[metodoPago?.toLowerCase()] || '#6b7280';
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return 'Fecha inválida';
      
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);
      
      const fechaSoloFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const ayerSoloFecha = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate());
      
      if (fechaSoloFecha.getTime() === hoySoloFecha.getTime()) {
        return `Hoy, ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      if (fechaSoloFecha.getTime() === ayerSoloFecha.getTime()) {
        return `Ayer, ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    } catch (error) {
      return 'Error fecha';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  // ========== CÁLCULOS DE DATOS ==========

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

  const pagosPendientesData = React.useMemo(() => {
    const pendientes = pendingPayments.filter(p => {
      const isPaid = (p.estado || p.Estado || '').toString().toLowerCase() === 'pagado';
      return !isPaid;
    });

    const total = pendientes.reduce((sum, p) => sum + parseFloat(p.monto || p.Monto || 0), 0);
    const cantidad = pendientes.length;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximosVencimientos = pendientes
      .map(p => {
        const fechaVenc = new Date(p.fecha_vencimiento || p.FechaVencimiento || p.fechavencimiento || p.Fechavencimiento);
        fechaVenc.setHours(0, 0, 0, 0);
        const dias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
        return { ...p, dias };
      })
      .filter(p => p.dias >= 0)
      .sort((a, b) => a.dias - b.dias);

    const proximoVencimiento = proximosVencimientos.length > 0 ? proximosVencimientos[0].dias : 0;

    return { total, cantidad, proximoVencimiento };
  }, [pendingPayments]);

  const objetivosProcessed = React.useMemo(() => {
    console.log('🎯 Calculando objetivosProcessed desde:', objetivosRaw);
    
    const result = objetivos.map(obj => {
      const montoObjetivo = parseFloat(obj.monto_objetivo || obj.MontoObjetivo || 0);
      const montoActual = parseFloat(obj.monto_actual || obj.MontoActual || 0);
      const porcentaje = montoObjetivo > 0 ? Math.round((montoActual / montoObjetivo) * 100) : 0;
      
      const mapped = {
        id: obj.id || obj.Id,
        nombre: obj.nombre || obj.Nombre,
        montoObjetivo,
        montoActual,
        porcentaje,
        color: getObjetivoColor(porcentaje),
        icono: obj.icono || obj.Icono || '🎯'
      };
      
      console.log('🎯 Objetivo mapeado:', {
        nombre: mapped.nombre,
        montoObjetivo: mapped.montoObjetivo,
        montoActual: mapped.montoActual,
        porcentaje: mapped.porcentaje
      });
      
      return mapped;
    });
    
    console.log('🎯 Total objetivos procesados:', result.length);
    return result;
  }, [objetivosRaw]);

  const gastosPorCategoriaData = React.useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const gastosDelMes = transactions.filter(t => {
      const fecha = new Date(t.fecha_transaccion);
      return (
        t.tipo === 'gasto' &&
        !t.es_credito &&
        fecha.getMonth() === currentMonth &&
        fecha.getFullYear() === currentYear
      );
    });

    const grouped = gastosDelMes.reduce((acc, t) => {
      const categoriaId = t.categoria_id || t.categorias_id;
      const categoriaNombre = t.categoria || 'Sin categoría';
      
      if (!acc[categoriaId]) {
        acc[categoriaId] = {
          nombre: categoriaNombre,
          total: 0
        };
      }
      
      acc[categoriaId].total += Math.abs(parseFloat(t.monto_ars || 0));
      return acc;
    }, {});

    const total = Object.values(grouped).reduce((sum, cat) => sum + cat.total, 0);
    
    const categoriasConPorcentaje = Object.values(grouped)
      .map(cat => ({
        name: cat.nombre,
        value: total > 0 ? parseFloat(((cat.total / total) * 100).toFixed(1)) : 0,
        monto: cat.total,
        color: getCategoryColorForChart(cat.nombre)
      }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);

    return { categorias: categoriasConPorcentaje, total };
  }, [transactions]);

  const transaccionesRecientes = transactions && transactions.length > 0 
    ? transactions.slice(0, 8).map(t => ({
        id: t.id,
        descripcion: t.descripcion || 'Sin descripción',
        fecha: formatFecha(t.fecha_transaccion),
        monto: t.tipo === 'ingreso' ? t.monto_ars : -t.monto_ars,
        icono: getCategoryIcon(t.categoria),
        color: getCategoryColor(t.tipo)
      }))
    : [
        { id: 1, descripcion: 'Alimentos & Supermercado', fecha: 'Hoy, 14:30', monto: -12450, icono: '🛒', color: 'bg-orange-500' },
        { id: 2, descripcion: 'Transporte (Uber)', fecha: 'Ayer, 18:20', monto: -4200, icono: '🚗', color: 'bg-blue-500' }
      ];

  // Calcular presupuestos con datos reales (DEBE IR FUERA DEL IF)
  const presupuestosProcessed = React.useMemo(() => {
    if (presupuestosRaw.length === 0) return [];

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return presupuestos.map(p => {
      const categoriaId = p.categoria_id || p.categorias_id;
      
      const gastosCategoria = transactions.filter(t => {
        const fecha = new Date(t.fecha_transaccion);
        return (
          t.tipo === 'gasto' &&
          !t.es_credito &&
          (t.categoria_id === categoriaId || t.categorias_id === categoriaId) &&
          fecha.getMonth() === currentMonth &&
          fecha.getFullYear() === currentYear
        );
      });

      const gastado = gastosCategoria.reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || 0)), 0);
      const limite = parseFloat(p.monto_limite || p.MontoLimite || 0);
      const porcentaje = limite > 0 ? Math.round((gastado / limite) * 100) : 0;

      const categoriaObj = categories.find(c => c.id === categoriaId);
      const categoriaNombre = categoriaObj?.nombre || p.categoria_nombre || 'Sin categoría';

      return {
        id: p.id,
        categoria: categoriaNombre,
        gastado,
        limite,
        porcentaje,
        color: getCategoryColorForChart(categoriaNombre)
      };
    });
  }, [presupuestosRaw, transactions, categories]);

  // ========== WIDGETS ==========
  
  const allWidgets = [];

  if (widgetSettings.showPagosPendientes) {
    allWidgets.push(
      <PagosPendientesWidget 
        key="pagos"
        totalPendiente={pagosPendientesData.total}
        cantidadPagos={pagosPendientesData.cantidad}
        proximoVencimiento={pagosPendientesData.proximoVencimiento}
        onClick={() => onNavigate && onNavigate('pending-payments-full')}
      />
    );
  }

  if (widgetSettings.showObjetivos) {
    allWidgets.push(
      <ObjetivosWidget 
        key="objetivos"
        objetivos={objetivosProcessed}
        onNavigate={onNavigate}
      />
    );
  }

  if (widgetSettings.showCategorias) {
    allWidgets.push(
      <GastosCategoriaWidget 
        key="categorias"
        categorias={gastosPorCategoriaData.categorias}
        total={gastosPorCategoriaData.total}
        onNavigate={onNavigate}
      />
    );
  }

  if (widgetSettings.showDeudaTarjetas) {
    // Calcular deuda total de tarjetas
    const deudaTotal = transactions
      .filter(t => t.es_credito && t.tipo === 'gasto')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.monto_ars || 0)), 0);
    
    const diasVencimiento = 5;
    
    allWidgets.push(
      <DeudaTarjetaWidget 
        key="deuda"
        deuda={deudaTotal}
        diasVencimiento={diasVencimiento}
        onClick={() => onNavigate && onNavigate('tarjetas-full')}
      />
    );
  }

  if (widgetSettings.showPresupuestos) {
    allWidgets.push(
      <PresupuestosWidget 
        key="presupuestos"
        presupuestos={presupuestosProcessed}
        onClick={() => onNavigate && onNavigate('presupuestos-full')}
      />
    );
  }

  if (widgetSettings.showResumenes) {
    // Filtrar solo resúmenes pendientes (no pagados)
    const resumenesPendientes = resumenesBancarios.filter(r => {
      const estado = (r.estado || r.Estado || '').toString().toLowerCase();
      const isPagado = estado === 'pagado' || estado === 'true' || r.pagado === true;
      return !isPagado;
    });

    allWidgets.push(
      <ResumenesBancariosWidget 
        key="resumenes"
        resumenes={resumenesPendientes}
        onClick={() => console.log('Ver resúmenes bancarios')}
      />
    );
  }

  if (widgetSettings.showMetodosPago) {
    // Calcular uso de métodos de pago del mes
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const transDelMes = transactions.filter(t => {
      const fecha = new Date(t.fecha_transaccion);
      return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
    });

    const grouped = transDelMes.reduce((acc, t) => {
      const metodo = t.metodoPago || 'Sin método';
      if (!acc[metodo]) acc[metodo] = 0;
      acc[metodo]++;
      return acc;
    }, {});

    const total = Object.values(grouped).reduce((sum, count) => sum + count, 0);
    
    const metodosPagoData = Object.entries(grouped)
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        color: getMetodoPagoColor(name)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    allWidgets.push(
      <MetodosPagoWidget 
        key="metodos-pago"
        metodosPago={metodosPagoData}
        onClick={() => onNavigate && onNavigate('payment-methods-full')}
      />
    );
  }

  if (widgetSettings.showUsoCostoIA) {
    allWidgets.push(
      <UsoCostoIAWidget 
        key="uso-ia"
        onClick={() => console.log('Ver detalles de uso IA')}
      />
    );
  }

  const widgets = allWidgets;

  // Calcular datos para el gráfico de evolución según período seleccionado
  const evolucionData = React.useMemo(() => {
    if (transactions.length === 0) {
      console.log('⚠️ No hay transacciones para generar gráfico de evolución');
      return [];
    }

    const tx = transactions.filter((transaction) => {
      if (transaction.es_credito) return false;
      return Boolean(getTransactionDate(transaction));
    });

    if (tx.length === 0) return [];

    const mode = widgetSettings.balanceMode === 'accumulated' ? 'accumulated' : 'monthly';

    if (chartPeriod === 'weekly') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const points = [];

      for (let i = 6; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        const y = day.getFullYear();
        const m = day.getMonth();
        const d = day.getDate();

        const dayTransactions = tx.filter((transaction) => {
          const date = getTransactionDate(transaction);
          return date && date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
        });

        const ingresos = dayTransactions
          .filter((transaction) => transaction.tipo === 'ingreso')
          .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.monto_ars || transaction.monto || 0)), 0);

        const gastos = dayTransactions
          .filter((transaction) => transaction.tipo === 'gasto')
          .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.monto_ars || transaction.monto || 0)), 0);

        points.push({
          fecha: day.toLocaleDateString('es-AR', { weekday: 'short' }),
          ingresos,
          gastos,
          balance: ingresos - gastos
        });
      }

      if (mode === 'accumulated') {
        let runningBalance = 0;
        return points.map((point) => {
          runningBalance += point.balance;
          return { ...point, balance: runningBalance };
        });
      }

      return points;
    }

    if (chartPeriod === 'yearly') {
      const currentYear = new Date().getFullYear();
      const points = [];

      for (let year = currentYear - 4; year <= currentYear; year++) {
        const yearTransactions = tx.filter((transaction) => {
          const date = getTransactionDate(transaction);
          return date && date.getFullYear() === year;
        });

        const ingresos = yearTransactions
          .filter((transaction) => transaction.tipo === 'ingreso')
          .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.monto_ars || transaction.monto || 0)), 0);

        const gastos = yearTransactions
          .filter((transaction) => transaction.tipo === 'gasto')
          .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.monto_ars || transaction.monto || 0)), 0);

        points.push({
          fecha: `${year}`,
          ingresos,
          gastos,
          balance: ingresos - gastos
        });
      }

      if (mode === 'accumulated') {
        let runningBalance = 0;
        return points.map((point) => {
          runningBalance += point.balance;
          return { ...point, balance: runningBalance };
        });
      }

      return points;
    }

    const now = new Date();
    const points = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();

      const monthTransactions = tx.filter((transaction) => {
        const date = getTransactionDate(transaction);
        return date && date.getMonth() === month && date.getFullYear() === year;
      });

      const ingresos = monthTransactions
        .filter((transaction) => transaction.tipo === 'ingreso')
        .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.monto_ars || transaction.monto || 0)), 0);

      const gastos = monthTransactions
        .filter((transaction) => transaction.tipo === 'gasto')
        .reduce((sum, transaction) => sum + Math.abs(parseFloat(transaction.monto_ars || transaction.monto || 0)), 0);

      points.push({
        fecha: monthDate.toLocaleDateString('es-AR', { month: 'short' }),
        ingresos,
        gastos,
        balance: ingresos - gastos
      });
    }

    if (mode === 'accumulated') {
      let runningBalance = 0;
      return points.map((point) => {
        runningBalance += point.balance;
        return { ...point, balance: runningBalance };
      });
    }

    return points;
  }, [transactions, chartPeriod, widgetSettings.balanceMode]);

  // Igualar altura del card de Transacciones con la columna de widgets
  useEffect(() => {
    const adjustHeight = () => {
      if (widgetsRef.current && transaccionesRef.current) {
        const widgetsHeight = widgetsRef.current.offsetHeight;
        console.log('📏 Ajustando altura:', {
          widgetsHeight,
          widgetsCount: widgets.length
        });
        transaccionesRef.current.style.height = `${widgetsHeight}px`;
      }
    };

    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    
    // Múltiples timeouts para asegurar que se ajuste después de que los widgets carguen
    const timer1 = setTimeout(adjustHeight, 100);
    const timer2 = setTimeout(adjustHeight, 300);
    const timer3 = setTimeout(adjustHeight, 500);
    const timer4 = setTimeout(adjustHeight, 1000);

    return () => {
      window.removeEventListener('resize', adjustHeight);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [widgets.length, widgetSettings]);

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <MobileDashboardHome
        user={user}
        dashboardData={dashboardData}
        transactions={transactions}
        pendingPayments={pendingPayments}
        presupuestos={presupuestosProcessed}
        objetivos={objetivosProcessed}
        onNavigate={onNavigate}
        onNewTransaction={onNewTransaction}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========== TRANSACCIONES (8/12) ========== */}
        <div className="lg:col-span-8">
          <div 
            ref={transaccionesRef}
            className="bg-[#18181b] rounded-3xl border border-white/5 overflow-hidden flex flex-col"
          >
            {/* Gráfico de Evolución (33% de altura interna) */}
            <div className="border-b border-white/5" style={{ height: '33%', minHeight: '200px' }}>
              <EvolucionMensualWidget 
                data={evolucionData} 
                periodo={chartPeriod}
                onChangePeriodo={setChartPeriod}
                balanceReal={dashboardData}
                allTransactions={transactions}
              />
            </div>
            {/* Transacciones (67% de altura interna) */}
            <div className="flex flex-col" style={{ height: '67%' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
                <h2 className="text-base font-semibold text-white">
                  Transacciones Recientes
                </h2>
                <button 
                  onClick={() => onNavigate && onNavigate('transactions-full')}
                  className="text-sm text-[#10b981] hover:text-[#34d399] transition-colors font-medium"
                >
                  Ver todas
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="p-6 pt-4">
                <div className="grid grid-cols-[1fr_110px_90px] gap-4 py-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
                  <div>CONCEPTO</div>
                  <div className="text-right">FECHA</div>
                  <div className="text-right">MONTO</div>
                </div>

                {transaccionesRecientes.map((trans) => (
                  <div 
                    key={trans.id}
                    className="grid grid-cols-[1fr_110px_90px] gap-4 py-3.5 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${trans.color} flex items-center justify-center text-base flex-shrink-0 shadow-md`}>
                        {trans.icono}
                      </div>
                      <span className="text-sm text-white">
                        {trans.descripcion}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 text-right">
                      {trans.fecha}
                    </div>
                    <div className="text-sm font-medium text-right text-white">
                      {formatCurrency(trans.monto)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* ========== WIDGETS (4/12) ========== */}
        <div className="lg:col-span-4 space-y-5" ref={widgetsRef}>
          {widgets.map(widget => widget)}
        </div>
      </div>
    </div>
  );
};

ModernDashboard.propTypes = {
  user: PropTypes.object,
  dashboardData: PropTypes.object,
  dashboardSettings: PropTypes.object,
  transactions: PropTypes.array,
  pendingPayments: PropTypes.array,
  categories: PropTypes.array,
  objetivos: PropTypes.array,
  presupuestos: PropTypes.array,
  resumenesBancarios: PropTypes.array,
  onNavigate: PropTypes.func,
};

export default ModernDashboard;
