import React, { createContext, useContext, useState } from 'react';

const AmountVisibilityContext = createContext();

export const AmountVisibilityProvider = ({ children }) => {
  const [isAmountVisible, setIsAmountVisible] = useState(true);

  const toggleAmountVisibility = () => {
    setIsAmountVisible(prev => !prev);
  };

  const formatAmount = (amount, options = {}) => {
    if (!isAmountVisible) {
      return options.currency === false ? '****' : '$ ****';
    }

    if (options.currency === false) {
      return amount.toLocaleString('es-AR', {
        minimumFractionDigits: options.decimals ?? 2,
        maximumFractionDigits: options.decimals ?? 2
      });
    }

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: options.decimals ?? 2,
      maximumFractionDigits: options.decimals ?? 2
    }).format(amount);
  };

  return (
    <AmountVisibilityContext.Provider value={{
      isAmountVisible,
      toggleAmountVisibility,
      formatAmount
    }}>
      {children}
    </AmountVisibilityContext.Provider>
  );
};

export const useAmountVisibility = () => {
  const context = useContext(AmountVisibilityContext);
  if (!context) {
    throw new Error('useAmountVisibility must be used within AmountVisibilityProvider');
  }
  return context;
};

