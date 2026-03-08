import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Bell,
  Search,
  Sun,
  Moon,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  Home,
  Sparkles,
  LogOut,
  User
} from 'lucide-react';

/**
 * ModernHeader - Header con carousel de monedas
 */
const ModernHeader = ({
  balanceData,
  dollarQuote,
  notifications = [],
  isDarkMode = true,
  onToggleTheme,
  onToggleAmountVisibility,
  amountsVisible = true,
  user,
  onOpenSettings,
  onNavigateHome,
  onOpenAgent,
  onLogout,
  currenciesBalance = []
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Cerrar el menú de usuario si se hace click afuera
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) onLogout();
  };

  // Monedas disponibles con ingresos y gastos - USAR DATOS REALES DEL API
  const currenciesData = useMemo(() => {
    // Si tenemos currenciesBalance del padre (calculado de transacciones reales), usarlo
    if (currenciesBalance && currenciesBalance.length > 0) {
      console.log('💰 ModernHeader usando currenciesBalance real:', currenciesBalance);
      return currenciesBalance;
    }

    // Si tenemos balanceData (solo ARS), usarlo
    if (balanceData) {
      console.log('💰 ModernHeader usando balanceData real:', balanceData);
      
      return [
        { 
          code: 'ARS', 
          symbol: '$',
          ingresos: balanceData.ingresosMes || 0,
          gastos: balanceData.gastosMes || 0,
          equivalent: { currency: 'USD' },
          ingresosVariation: '+0%',
          gastosVariation: '-0%'
        }
      ];
    }
    
    // Fallback a datos mock si no hay balanceData
    console.warn('⚠️ ModernHeader: No hay balanceData, usando mock');
    return [
      { 
        code: 'ARS', 
        symbol: '$',
        ingresos: 800000,
        gastos: 545000,
        equivalent: { currency: 'USD' },
        ingresosVariation: '+5.2%',
        gastosVariation: '-3.1%'
      }
    ];
  }, [balanceData, currenciesBalance]);

  // Calcular balance y datos derivados
  const currencies = currenciesData.map(curr => {
    const balance = curr.ingresos - curr.gastos;
    const trend = balance >= 0 ? 'up' : 'down';
    const variationNum = curr.ingresos > 0 ? ((balance / curr.ingresos) * 100).toFixed(1) : '0.0';
    const variation = balance >= 0 ? `+${variationNum}%` : `${variationNum}%`;
    
    // Calcular equivalente (mock - reemplazar con tasa real)
    const tasas = { ARS: 1, USD: 1270, EUR: 1380 };
    const equivalentAmount = curr.code === 'ARS' 
      ? balance / tasas.USD 
      : balance * tasas[curr.code];
    const normalizedEquivalentAmount = Number.isFinite(equivalentAmount) ? equivalentAmount : 0;

    return {
      ...curr,
      balance,
      variation,
      trend,
      equivalent: {
        amount: normalizedEquivalentAmount,
        currency: curr.code === 'ARS' ? 'USD' : 'ARS'
      }
    };
  });

  const currentCurrency = currencies[currentCurrencyIndex] || {
    code: 'ARS',
    symbol: '$',
    ingresos: 0,
    gastos: 0,
    balance: 0,
    variation: '+0.0%',
    trend: 'up',
    equivalent: { amount: 0, currency: 'USD' },
    ingresosVariation: '+0%',
    gastosVariation: '-0%'
  };

  // Auto-rotate cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCurrencyIndex((prev) => (prev + 1) % currencies.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [currencies.length]);

  const handlePrevCurrency = () => {
    setCurrentCurrencyIndex((prev) => 
      prev === 0 ? currencies.length - 1 : prev - 1
    );
  };

  const handleNextCurrency = () => {
    setCurrentCurrencyIndex((prev) => 
      (prev + 1) % currencies.length
    );
  };

  const formatCurrency = (amount, currency = 'ARS') => {
    if (!amountsVisible) return '****';
    if (!Number.isFinite(amount)) return '0';
    
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(absAmount);

    return isNegative ? `-${formatted}` : formatted;
  };

  const dolar = dollarQuote || {
    blue: { venta: 1270, variacion: -1.2 },
    oficial: { venta: 990, variacion: 0.5 }
  };

  return (
    <header className="sticky top-0 z-[90] bg-[#0a0a0a] px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Section - Balance con carousel + Ingresos + Gastos */}
        <div className="flex items-center gap-2.5">
          
          {/* Balance Total - Carousel automático (DOBLE DE ANCHO) */}
          <div className="bg-[#18181b] rounded-xl px-4 py-2 border border-white/5 w-80 h-[72px] flex flex-col justify-center">
            <p className="text-xs text-gray-500 mb-1">BALANCE TOTAL</p>
            
            <div className="flex items-center gap-2">
              {/* Flecha Izquierda */}
              {currencies.length > 1 && (
                <button
                  onClick={handlePrevCurrency}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                  title="Moneda anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              )}

              {/* Contenido con animación */}
              <div className="flex-1 overflow-hidden min-w-0">
                <div 
                  key={currentCurrencyIndex}
                  style={{
                    animation: 'slideInSmooth 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-white truncate">
                      {currentCurrency.code} {currentCurrency.symbol}{formatCurrency(currentCurrency.balance)}
                    </p>
                    <div className={`flex items-center gap-0.5 text-xs font-medium flex-shrink-0 ${
                      currentCurrency.trend === 'up' ? 'text-[#10b981]' : 'text-[#ec4899]'
                    }`}>
                      {currentCurrency.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{currentCurrency.variation}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    ≈ {currentCurrency.equivalent.currency} {currentCurrency.symbol}{formatCurrency(currentCurrency.equivalent.amount)}
                  </p>
                </div>
              </div>

              {/* Flecha Derecha */}
              {currencies.length > 1 && (
                <button
                  onClick={handleNextCurrency}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                  title="Siguiente moneda"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              )}

              {/* Toggle visibilidad */}
              <button
                onClick={onToggleAmountVisibility}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
              >
                {amountsVisible ? (
                  <Eye className="w-4 h-4 text-gray-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>

            {/* Indicadores (solo si hay más de 1 moneda) */}
            {currencies.length > 1 && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {currencies.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentCurrencyIndex 
                        ? 'bg-[#10b981] w-3' 
                        : 'bg-gray-600 w-1'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Ingresos de la moneda actual */}
          <div 
            key={`ingresos-${currentCurrencyIndex}`}
            className="bg-[#18181b] rounded-xl px-3.5 py-2 border border-white/5 w-[161px] h-[72px] flex flex-col justify-center"
            style={{
              animation: 'slideInSmooth 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <p className="text-xs text-gray-500 mb-1">INGRESOS</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold text-[#10b981] truncate">
                {currentCurrency.symbol}{formatCurrency(currentCurrency.ingresos)}
              </p>
              <div className="flex items-center gap-0.5 text-xs font-medium text-[#10b981] flex-shrink-0">
                <TrendingUp className="w-3 h-3" />
                <span>{currentCurrency.ingresosVariation}</span>
              </div>
            </div>
          </div>

          {/* Gastos de la moneda actual */}
          <div 
            key={`gastos-${currentCurrencyIndex}`}
            className="bg-[#18181b] rounded-xl px-3.5 py-2 border border-white/5 w-[161px] h-[72px] flex flex-col justify-center"
            style={{
              animation: 'slideInSmooth 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <p className="text-xs text-gray-500 mb-1">GASTOS</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold text-[#ec4899] truncate">
                {currentCurrency.symbol}{formatCurrency(currentCurrency.gastos)}
              </p>
              <div className="flex items-center gap-0.5 text-xs font-medium text-[#ec4899] flex-shrink-0">
                <TrendingDown className="w-3 h-3" />
                <span>{currentCurrency.gastosVariation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2.5">
          
          {/* Search - Grande */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar..."
              className="
                w-full pl-11 pr-4 py-2.5
                bg-[#18181b] text-white text-sm
                border border-white/5 rounded-2xl
                placeholder:text-gray-500
                focus:outline-none focus:border-[#10b981]/30
                transition-colors
              "
            />
          </div>

          {/* User Avatar con dropdown */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(prev => !prev)}
                className="flex items-center gap-0 focus:outline-none group"
                title="Mi cuenta"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.full_name || user.name || 'Usuario'}
                    className="w-9 h-9 rounded-full border-2 border-[#10b981] group-hover:border-[#34d399] transition-colors"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center text-black font-bold text-sm group-hover:opacity-90 transition-opacity">
                    {(user.full_name || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/* Dropdown menú */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 z-[9999] w-64 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Info del usuario */}
                  <div className="px-4 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.full_name || user.name}
                          className="w-10 h-10 rounded-full border-2 border-[#10b981] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center text-black font-bold flex-shrink-0">
                          {(user.full_name || user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user.full_name || user.name || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Home Button */}
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-2xl bg-[#18181b] border border-white/5 hover:bg-white/5 transition-colors"
            title="Inicio"
          >
            <Home className="w-5 h-5 text-gray-400" />
          </button>


          {/* Gemini Agent Button */}
          <button
            onClick={onOpenAgent}
            className="p-2 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            title="Agente IA"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </button>

          {/* Settings - Dashboard Configuration */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-2xl bg-[#18181b] border border-white/5 hover:bg-white/5 transition-colors"
            title="Configurar Dashboard"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>

          {/* Theme Toggle - Comentado: El diseño moderno solo soporta dark mode
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-2xl bg-[#18181b] border border-white/5 hover:bg-white/5 transition-colors"
            title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-400" />
            )}
          </button>
          */}
        </div>
      </div>
    </header>
  );
};

ModernHeader.propTypes = {
  balanceData: PropTypes.object,
  dollarQuote: PropTypes.object,
  notifications: PropTypes.array,
  isDarkMode: PropTypes.bool,
  onToggleTheme: PropTypes.func,
  onToggleAmountVisibility: PropTypes.func,
  amountsVisible: PropTypes.bool,
  user: PropTypes.object,
  onOpenSettings: PropTypes.func,
  onNavigateHome: PropTypes.func,
  onOpenAgent: PropTypes.func,
  onLogout: PropTypes.func,
  currenciesBalance: PropTypes.array
};

export default ModernHeader;
