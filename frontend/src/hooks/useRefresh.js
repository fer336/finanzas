/**
 * useRefresh - Hook reutilizable para refrescar queries de React Query
 *
 * Uso:
 *   const { refresh, isRefreshing } = useRefresh(['transactions', 'pendingPayments'])
 *
 *   Si no se pasan keys, refresca TODAS las queries activas.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './useFinancialData';

// Keys que se refrescan cuando no se especifica nada (las "financieras" principales)
const ALL_FINANCIAL_KEYS = [
  QUERY_KEYS.transactions,
  QUERY_KEYS.pendingPayments,
  QUERY_KEYS.objetivos,
  QUERY_KEYS.presupuestos,
  QUERY_KEYS.dashboardStats,
  QUERY_KEYS.categories,
  QUERY_KEYS.paymentMethods,
  QUERY_KEYS.monedas,
  QUERY_KEYS.tarjetas,
  QUERY_KEYS.resumenes,
  QUERY_KEYS.aiUsage,
];

export const useRefresh = (keys = ALL_FINANCIAL_KEYS) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all(
        keys.map((key) =>
          queryClient.refetchQueries({ queryKey: [key], type: 'active' })
        )
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, keys, isRefreshing]);

  return { refresh, isRefreshing };
};
