import PropTypes from 'prop-types';
import ModernTopNav from './ModernTopNav';
import MobileBottomNav from '../../MobileBottomNav';
import { useIsMobile } from '../../../hooks/use-mobile';

/**
 * ModernLayout - Layout wrapper con nav superior (desktop) + bottom nav
 * (mobile). Reemplaza el viejo Sidebar + Header oscuros por la barra de
 * navegación superior del tema "Papel" (ver DESIGN.md y
 * design_handoff_rediseno_papel/README.md sección 1).
 */
const ModernLayout = ({
  children,
  currentView,
  onNavigate,
  user,
  pendingPaymentsCount,
  onNewTransaction,
  onSearch,
  onLogout,
  amountsVisible,
  onToggleAmountVisibility,
  isDarkMode,
  onToggleTheme,
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav superior (solo desktop) */}
      <div className="hidden md:block">
        <ModernTopNav
          currentView={currentView}
          onNavigate={onNavigate}
          pendingPaymentsCount={pendingPaymentsCount}
          onNewTransaction={onNewTransaction}
          onSearch={onSearch}
          user={user}
          onLogout={onLogout}
          amountsVisible={amountsVisible}
          onToggleAmountVisibility={onToggleAmountVisibility}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
        />
      </div>

      {/* Page Content */}
      <main className="pb-24 md:pb-0">
        {children}
      </main>

      {isMobile && (
        <MobileBottomNav
          currentView={currentView}
          onNavigate={onNavigate}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
        />
      )}
    </div>
  );
};

ModernLayout.propTypes = {
  children: PropTypes.node.isRequired,
  currentView: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  user: PropTypes.object,
  pendingPaymentsCount: PropTypes.number,
  onNewTransaction: PropTypes.func,
  onSearch: PropTypes.func,
  onLogout: PropTypes.func,
  amountsVisible: PropTypes.bool,
  onToggleAmountVisibility: PropTypes.func,
  isDarkMode: PropTypes.bool,
  onToggleTheme: PropTypes.func,
};

export default ModernLayout;
