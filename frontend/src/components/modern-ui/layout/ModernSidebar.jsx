import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Sparkles,
  ArrowLeftRight,
  Target,
  CreditCard,
  PieChart,
  FileText,
  TrendingUp,
  DollarSign,
  Tag,
  Wallet,
  Calendar,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Coins,
  Bug,
  Building2
} from 'lucide-react';
import GlassCard from '../common/GlassCard';

/**
 * ModernSidebar - Sidebar con diseño de Stitch
 */
const ModernSidebar = ({ 
  currentView, 
  onNavigate, 
  user,
  collapsed = false,
  onToggleCollapse,
  onLogout,
  dashboardSettings = {} // ← NUEVO
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapse && onToggleCollapse(!isCollapsed);
  };

  const menuItems = [
    {
      id: 'transactions',
      label: 'Transacciones',
      icon: ArrowLeftRight,
      view: 'transactions-full',
      alwaysShow: true // Siempre visible
    },
    {
      id: 'objetivos',
      label: 'Objetivos',
      icon: Target,
      view: 'objetivos-full',
      settingKey: 'showObjetivos' // ← Conectado a configuración
    },
    {
      id: 'tarjetas',
      label: 'Tarjetas de Crédito',
      icon: CreditCard,
      view: 'tarjetas-full',
      settingKey: 'showDeudaTarjetas' // ← Conectado
    },
    {
      id: 'presupuestos',
      label: 'Presupuestos',
      icon: PieChart,
      view: 'presupuestos-full',
      settingKey: 'showPresupuestos' // ← Conectado
    },
    {
      id: 'cedears',
      label: 'CEDEARs',
      icon: TrendingUp,
      view: 'cedears',
      settingKey: 'showCEDEARs' // ← Conectado
    },
    {
      id: 'cotizaciones',
      label: 'Cotización Dólar',
      icon: DollarSign,
      view: 'dollar',
      settingKey: 'showCotizaciones' // ← Conectado
    },
    {
      id: 'categories',
      label: 'Categorías',
      icon: Tag,
      view: 'categories-full',
      settingKey: 'showCategorias' // ← Conectado
    },
    {
      id: 'payment-methods',
      label: 'Métodos de Pago',
      icon: Wallet,
      view: 'payment-methods-full',
      settingKey: 'showMetodosPago' // ← Conectado
    },
    {
      id: 'pending-payments',
      label: 'Pagos Pendientes',
      icon: Calendar,
      view: 'pending-payments-full',
      settingKey: 'showPagosPendientes' // ← Conectado
    },
    {
      id: 'resumenes-bancarios',
      label: 'Resúmenes Bancarios',
      icon: Building2,
      view: 'resumen-bancario',
      settingKey: 'showResumenes' // ← Conectado a configuración
    },
    {
      id: 'uso-ia',
      label: 'Uso de Lucy',
      icon: Sparkles,
      view: 'ai-usage-full',
      settingKey: 'showUsoCostoIA' // ← Conectado a configuración
    },
    {
      id: 'monedas',
      label: 'Monedas',
      icon: Coins,
      view: 'monedas-full',
      settingKey: 'showMonedas' // ← Conectado a configuración
    },
    {
      id: 'reportes-bugs',
      label: 'Reportar / Bugs',
      icon: Bug,
      view: 'reportes-bugs-full',
      alwaysShow: true // Siempre visible para todos los usuarios
    }
  ];

  const handleNavigate = (view) => {
    console.log('🔄 Navegando a:', view);
    onNavigate && onNavigate(view);
  };

  return (
    <div 
      className={`
        fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-white/5
        transition-all duration-300 z-[100]
        ${isCollapsed ? 'w-20' : 'w-56'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo / Header - Pulpo */}
        <div className="py-4 px-2 border-b border-white/5">
          <div className="flex items-center justify-center">
              <img 
                src="/octopus.svg" 
                alt="Octopus Logo" 
                className="w-full h-auto object-contain px-2"
              />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {menuItems.map((item) => {
            if (item.type === 'separator') {
              return (
                <div 
                  key={item.id} 
                  className="h-px bg-[var(--border)] my-4"
                />
              );
            }

            // Verificar si el item debe mostrarse según configuración del dashboard
            if (item.settingKey && dashboardSettings[item.settingKey] === false) {
              console.log(`🚫 Ocultando "${item.label}" porque ${item.settingKey} = false`);
              return null; // Ocultar este item
            }

            const Icon = item.icon;
            const isActive = currentView === item.view;
            const isHighlight = item.highlight;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.view)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group text-sm
                  ${isActive 
                    ? 'bg-[#10b981] text-black font-medium' 
                    : isHighlight
                    ? 'bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-black' : ''}`} />
                {!isCollapsed && (
                  <span className="font-medium truncate">
                    {item.label}
                  </span>
                )}
                {!isCollapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />
                )}
              </button>
            );
          })}
        </nav>


      </div>
    </div>
  );
};

ModernSidebar.propTypes = {
  currentView: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  user: PropTypes.object,
  collapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
  onLogout: PropTypes.func,
  dashboardSettings: PropTypes.object,
};

export default ModernSidebar;
