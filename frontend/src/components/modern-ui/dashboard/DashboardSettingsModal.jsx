import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  X,
  Sparkles, 
  Calendar,
  Target,
  PieChart,
  CreditCard,
  Building2,
  Wallet,
  Bot,
  DollarSign,
  TrendingUp,
  Coins
} from 'lucide-react';

/**
 * DashboardSettingsModal - Modal para configurar widgets del dashboard
 */
const DashboardSettingsModal = ({ isOpen, onClose, onOpenAIConfig }) => {
  const [settings, setSettings] = useState(() => {
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    localStorage.setItem('modernDashboardSettings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('modernDashboardSettingsChanged', { detail: settings }));
    onClose();
  };

  const handleBalanceModeChange = (mode) => {
    setSettings((prev) => ({ ...prev, balanceMode: mode }));
  };

  const widgets = [
    {
      key: 'showPagosPendientes',
      icon: Calendar,
      title: 'Pagos Pendientes',
      description: 'Muestra los pagos próximos a vencer',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      key: 'showObjetivos',
      icon: Target,
      title: 'Objetivos de Ahorro',
      description: 'Muestra el progreso de tus metas de ahorro',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      key: 'showCategorias',
      icon: PieChart,
      title: 'Gastos por Categoría',
      description: 'Gráfico de dona con distribución de gastos',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      key: 'showDeudaTarjetas',
      icon: CreditCard,
      title: 'Deuda de Tarjetas',
      description: 'Total de deuda en tarjetas de crédito',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      key: 'showPresupuestos',
      icon: DollarSign,
      title: 'Presupuestos',
      description: 'Estado de tus presupuestos mensuales',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      key: 'showResumenes',
      icon: Building2,
      title: 'Resúmenes Bancarios',
      description: 'Resúmenes pendientes de pago',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10'
    },
    {
      key: 'showMetodosPago',
      icon: Wallet,
      title: 'Métodos de Pago',
      description: 'Estadísticas de uso de métodos de pago',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      key: 'showCEDEARs',
      icon: TrendingUp,
      title: 'CEDEARs',
      description: 'Seguimiento de CEDEARs y análisis técnico',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      key: 'showCotizaciones',
      icon: DollarSign,
      title: 'Cotización Dólar',
      description: 'Cotizaciones y calculadora de conversión',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      key: 'showMonedas',
      icon: Coins,
      title: 'Monedas',
      description: 'Gestión de monedas multi-currency',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    },
    {
      key: 'showUsoCostoIA',
      icon: Sparkles,
      title: 'Uso de Lucy',
      description: 'Tokens y costo del agente IA',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const activeCount = widgets.filter((widget) => settings[widget.key]).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm overflow-y-auto p-4">
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="bg-[#18181b] rounded-3xl border border-white/10 w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Configurar Dashboard
            </h2>
            <p className="text-sm text-gray-400">
              Selecciona qué widgets mostrar ({activeCount} activos)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6 p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Modelos de IA del sistema</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Elegi proveedor y modelo para Luna: Gemini, OpenAI, Claude u otros compatibles con OpenRouter.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-gray-300">Gemini</span>
                    <span className="px-2 py-1 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-gray-300">OpenAI</span>
                    <span className="px-2 py-1 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-gray-300">Claude</span>
                    <span className="px-2 py-1 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-gray-300">OpenRouter</span>
                  </div>
                </div>
                <button
                  onClick={() => onOpenAIConfig && onOpenAIConfig()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Configurar IA
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-2xl border border-white/10 bg-[#0a0a0a]">
              <p className="text-sm font-semibold text-white mb-3">Modo de Balance Total</p>
              <p className="text-xs text-gray-400 mb-4">
                Definí si el balance superior muestra solo el mes actual o saldo acumulado histórico.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleBalanceModeChange('monthly')}
                  className={`px-3 py-2 rounded-xl text-sm transition-colors border ${
                    settings.balanceMode !== 'accumulated'
                      ? 'bg-[#10b981] text-black border-[#10b981] font-semibold'
                      : 'bg-[#18181b] text-gray-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => handleBalanceModeChange('accumulated')}
                  className={`px-3 py-2 rounded-xl text-sm transition-colors border ${
                    settings.balanceMode === 'accumulated'
                      ? 'bg-[#10b981] text-black border-[#10b981] font-semibold'
                      : 'bg-[#18181b] text-gray-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  Acumulado
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
            {widgets.map((widget) => {
              const Icon = widget.icon;
              const isActive = settings[widget.key];

              return (
                <div
                  key={widget.key}
                  onClick={() => handleToggle(widget.key)}
                  className={`
                    p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${isActive 
                      ? 'border-[#10b981] bg-[#10b981]/5' 
                      : 'border-white/5 bg-[#0a0a0a] hover:border-white/10'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${widget.bgColor} flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${widget.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-white">
                          {widget.title}
                        </h3>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-[#10b981] text-black text-xs font-bold rounded-full">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {widget.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`
                        w-12 h-6 rounded-full transition-all
                        ${isActive ? 'bg-[#10b981]' : 'bg-gray-600'}
                      `}>
                        <div className={`
                          w-5 h-5 mt-0.5 rounded-full bg-white shadow-lg transition-all
                          ${isActive ? 'ml-6' : 'ml-0.5'}
                        `} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#18181b] flex items-center justify-between p-6 border-t border-white/5">
            <p className="text-sm text-gray-400">
              Los cambios se aplicarán inmediatamente
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#0a0a0a] text-white border border-white/5 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] text-black font-medium hover:shadow-lg hover:shadow-[#10b981]/30 transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenAIConfig: PropTypes.func,
};

export default DashboardSettingsModal;
