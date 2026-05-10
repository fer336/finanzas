import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ModernSidebar from './ModernSidebar';
import ModernHeader from './ModernHeader';
import MobileBottomNav from '../../MobileBottomNav';
import { useIsMobile } from '../../../hooks/use-mobile';

/**
 * ModernLayout - Layout wrapper con Sidebar + Header + Content
 */
const ModernLayout = ({
  children,
  currentView,
  onNavigate,
  user,
  balanceData,
  currenciesBalance,
  dollarQuote,
  notifications,
  isDarkMode,
  onToggleTheme,
  amountsVisible,
  onToggleAmountVisibility,
  onNewTransaction,
  onBulkUpload,
  onSearch,
  onLogout,
  onOpenSettings,
  onOpenAgent,
  dashboardSettings
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Sidebar (solo desktop) */}
      <div className="hidden md:block">
        <ModernSidebar
          currentView={currentView}
          onNavigate={onNavigate}
          user={user}
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
          onLogout={onLogout}
          dashboardSettings={dashboardSettings}
        />
      </div>

      {/* Main Content Area */}
      <div 
        className={`
          transition-all duration-300
          ml-0
          ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-56'}
        `}
      >
        {/* Header (solo desktop) */}
        <div className="hidden md:block">
          <ModernHeader
            balanceData={balanceData}
            currenciesBalance={currenciesBalance}
            dollarQuote={dollarQuote}
            notifications={notifications}
            isDarkMode={isDarkMode}
            onToggleTheme={onToggleTheme}
            amountsVisible={amountsVisible}
            onToggleAmountVisibility={onToggleAmountVisibility}
            user={user}
            onOpenSettings={onOpenSettings}
            onNavigateHome={() => onNavigate && onNavigate('dashboard')}
            onOpenAgent={onOpenAgent}
            onLogout={onLogout}
          />
        </div>

        {/* Page Content */}
        <main className="animate-fade-in pb-24 md:pb-0">
          {children}
        </main>
      </div>

      {isMobile && (
        <MobileBottomNav
          currentView={currentView}
          onNavigate={onNavigate}
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
  balanceData: PropTypes.object,
  dollarQuote: PropTypes.object,
  notifications: PropTypes.array,
  isDarkMode: PropTypes.bool,
  onToggleTheme: PropTypes.func,
  amountsVisible: PropTypes.bool,
  onToggleAmountVisibility: PropTypes.func,
  onNewTransaction: PropTypes.func,
  onBulkUpload: PropTypes.func,
  onSearch: PropTypes.func,
  onLogout: PropTypes.func,
  onOpenSettings: PropTypes.func,
};

export default ModernLayout;
