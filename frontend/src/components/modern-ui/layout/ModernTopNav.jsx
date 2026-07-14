import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Search, LogOut, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import Home from 'reicon-react/icons/Home';
import ArrowSwapHorizontal2 from 'reicon-react/icons/ArrowSwapHorizontal2';
import Calendar from 'reicon-react/icons/Calendar';
import Target from 'reicon-react/icons/Target';
import TrendUp2 from 'reicon-react/icons/TrendUp2';
import Settings from 'reicon-react/icons/Settings';

/**
 * ModernTopNav — barra de navegación superior del tema "Papel".
 * Reemplaza ModernSidebar + ModernHeader en desktop (ver DESIGN.md /
 * design_handoff_rediseno_papel/README.md sección "1. Barra de
 * navegación superior").
 *
 * Los 6 ítems de nav son la consolidación de las 9+ vistas actuales
 * (ver README.md "Mapa de migración"). "Inversiones" y "Ajustes" apuntan a
 * sus containers reales con sub-secciones internas (ModernInversionesView /
 * ModernAjustesView).
 */
const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', view: 'dashboard', matches: ['dashboard'], Icon: Home },
  {
    id: 'movimientos',
    label: 'Movimientos',
    view: 'transactions-full',
    matches: ['transactions', 'transactions-full'],
    Icon: ArrowSwapHorizontal2,
  },
  {
    id: 'vencimientos',
    label: 'Vencimientos',
    view: 'pending-payments-full',
    matches: ['pending-payments', 'pending-payments-full'],
    showBadge: true,
    Icon: Calendar,
  },
  {
    id: 'objetivos',
    label: 'Objetivos',
    view: 'objetivos-full',
    matches: ['objetivos-full'],
    Icon: Target,
  },
  {
    id: 'inversiones',
    label: 'Inversiones',
    view: 'inversiones',
    // Se conservan los ids viejos por si algo interno todavía navega directo
    // a esas vistas puntuales — la pill sigue marcándose activa en esos casos.
    matches: ['inversiones', 'cedears', 'dollar', 'currency-management', 'monedas-full'],
    Icon: TrendUp2,
  },
  {
    id: 'ajustes',
    label: 'Ajustes',
    view: 'ajustes',
    Icon: Settings,
    // Se conservan los ids viejos por compatibilidad — si algo interno
    // todavía navega directo a esas vistas puntuales, la pill de Ajustes
    // sigue marcándose activa en esos casos.
    matches: [
      'ajustes',
      'categories',
      'categories-full',
      'payment-methods',
      'payment-methods-full',
      'settings',
      'presupuestos-full',
      'budgets',
    ],
  },
];

const ModernTopNav = ({
  currentView,
  onNavigate,
  pendingPaymentsCount = 0,
  onNewTransaction,
  onSearch,
  user,
  onLogout,
  amountsVisible = true,
  onToggleAmountVisibility,
  isDarkMode = false,
  onToggleTheme,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
    onSearch && onSearch(value);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout && onLogout();
  };

  return (
    <nav
      className="flex items-center border-b border-[#ddd5c2] bg-card dark:border-[#2e3844]"
      style={{ padding: '14px 34px', gap: '26px' }}
    >
      {/* Wordmark */}
      <button
        type="button"
        onClick={() => onNavigate && onNavigate('dashboard')}
        className="shrink-0 font-serif text-[20px] font-bold text-foreground"
      >
        Finance<span className="text-[#b35a42] dark:text-[#c26a52]">.</span>
      </button>

      {/* Nav pills */}
      <div className="flex items-center gap-1 text-[13.5px]">
        {NAV_ITEMS.map((item) => {
          const isActive = item.matches.includes(currentView);
          const Icon = item.Icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate && onNavigate(item.view)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-[7px] transition-colors duration-150 ${
                isActive
                  ? 'bg-[#20242c] font-semibold text-[#f4f0e6] dark:bg-[#ece7d8] dark:text-[#12161c]'
                  : 'text-[#5d6470] hover:bg-black/5 dark:text-[#93a0af] dark:hover:bg-white/5'
              }`}
            >
              {Icon && (
                <Icon
                  size={16}
                  color={isActive ? (isDarkMode ? '#12161c' : '#f4f0e6') : (isDarkMode ? '#93a0af' : '#8a8677')}
                />
              )}
              {item.label}
              {item.showBadge && pendingPaymentsCount > 0 && (
                <span className="rounded-full bg-[#e9c46a] px-[6px] py-[1px] font-mono text-[10px] font-semibold text-[#20242c]">
                  {pendingPaymentsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right side: buscar + acción primaria + utilidades */}
      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8677] dark:text-[#93a0af]" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Buscar…"
            className="w-48 rounded-sm border border-[#ddd5c2] bg-white py-[7px] pl-9 pr-3 font-mono text-[12px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#2e3844] dark:bg-[#212836] dark:placeholder:text-[#93a0af]"
          />
        </div>

        <button
          type="button"
          onClick={onNewTransaction}
          className="rounded-sm bg-primary px-[15px] py-[8px] text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047] dark:hover:bg-[#7d9970]"
        >
          + Nuevo
        </button>

        {/* Deviation from hi-fi spec: el mockup de nav no incluye estos
            botones, pero se mantienen para no perder funcionalidad existente
            (ocultar montos, agente IA y cierre de sesión) hasta que Ajustes
            tenga su propio entry point real. */}
        {onToggleAmountVisibility && (
          <button
            type="button"
            onClick={onToggleAmountVisibility}
            title={amountsVisible ? 'Ocultar montos' : 'Mostrar montos'}
            className="rounded-sm border border-[#ddd5c2] bg-white p-2 text-[#8a8677] transition-colors duration-150 hover:bg-[#f0ead9] hover:text-foreground dark:border-[#2e3844] dark:bg-[#212836] dark:text-[#93a0af] dark:hover:bg-[#2e3844]"
          >
            {amountsVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        )}

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
            className="rounded-sm border border-[#ddd5c2] bg-white p-2 text-[#8a8677] transition-colors duration-150 hover:bg-[#f0ead9] hover:text-foreground dark:border-[#2e3844] dark:bg-[#212836] dark:text-[#93a0af] dark:hover:bg-[#2e3844]"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}

        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              title="Mi cuenta"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ddd5c2] bg-white text-[12px] font-semibold text-foreground overflow-hidden dark:border-[#2e3844] dark:bg-[#212836]"
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.full_name || user.name || 'Usuario'}
                  className="h-full w-full object-cover"
                />
              ) : (
                (user.full_name || user.name || 'U').charAt(0).toUpperCase()
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-md border border-[#ddd5c2] bg-card dark:border-[#2e3844]">
                <div className="border-b border-[#ddd5c2] px-4 py-3 dark:border-[#2e3844]">
                  <p className="truncate text-[13.5px] font-medium text-foreground">
                    {user.full_name || user.name || 'Usuario'}
                  </p>
                  <p className="truncate text-[12px] text-[#8a8677] dark:text-[#93a0af]">{user.email || ''}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-[#a04a34] transition-colors duration-150 hover:bg-[#f0ead9] dark:text-[#c26a52] dark:hover:bg-[#212836]"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

ModernTopNav.propTypes = {
  currentView: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  pendingPaymentsCount: PropTypes.number,
  onNewTransaction: PropTypes.func,
  onSearch: PropTypes.func,
  user: PropTypes.object,
  onLogout: PropTypes.func,
  amountsVisible: PropTypes.bool,
  onToggleAmountVisibility: PropTypes.func,
  isDarkMode: PropTypes.bool,
  onToggleTheme: PropTypes.func,
};

export default ModernTopNav;
