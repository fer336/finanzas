/**
 * Custom Hooks para React Query
 * 
 * Cada hook maneja un tipo de dato específico con su configuración de cache
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiServices from '../services/api';

// ====== QUERY KEYS (Centralizados) ======
export const QUERY_KEYS = {
  transactions: 'transactions',
  categories: 'categories',
  paymentMethods: 'paymentMethods',
  pendingPayments: 'pendingPayments',
  objetivos: 'objetivos',
  presupuestos: 'presupuestos',
  monedas: 'monedas',
  tarjetas: 'tarjetas',
  cedears: 'cedears',
  dashboardStats: 'dashboardStats',
  dollarQuotes: 'dollarQuotes',
  balanceNeto: 'balanceNeto',
};

// ====== TRANSACCIONES ======
export const useTransactions = (filters = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.transactions, filters],
    queryFn: async () => {
      const { limit = 100, offset = 0, ...apiFilters } = filters || {};
      const response = await apiServices.transaccionesApi.getAll(limit, offset, apiFilters);
      return response.list || response || [];
    },
    staleTime: 60 * 1000, // 1 minuto (cambian con frecuencia)
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => apiServices.transaccionesApi.create(data),
    onSuccess: () => {
      // Invalida transacciones Y stats del dashboard
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.transactions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiServices.transaccionesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.transactions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => apiServices.transaccionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.transactions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] });
    },
  });
};

// ====== CATEGORÍAS (Casi estático) ======
export const useCategories = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.categories],
    queryFn: async () => {
      const response = await apiServices.categoriasApi.getAll();
      return response.list || response || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (cambian muy poco)
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => apiServices.categoriasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiServices.categoriasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => apiServices.categoriasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] });
    },
  });
};

// ====== MÉTODOS DE PAGO (Semi-estático) ======
export const usePaymentMethods = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.paymentMethods],
    queryFn: async () => {
      const response = await apiServices.metodosPagoApi.getAll();
      return response.list || response || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (cambian muy poco)
  });
};

export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => apiServices.metodosPagoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.paymentMethods] });
    },
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiServices.metodosPagoApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.paymentMethods] });
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => apiServices.metodosPagoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.paymentMethods] });
    },
  });
};

// ====== PAGOS PENDIENTES ======
export const usePendingPayments = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.pendingPayments],
    queryFn: async () => {
      const response = await apiServices.pagosPendientesApi.getAll();
      return response.list || response || [];
    },
    staleTime: 60 * 1000, // 1 minuto (cambian frecuentemente)
  });
};

export const useCreatePendingPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => apiServices.pagosPendientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.pendingPayments] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] });
    },
  });
};

export const useUpdatePendingPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiServices.pagosPendientesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.pendingPayments] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] });
    },
  });
};

export const useDeletePendingPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => apiServices.pagosPendientesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.pendingPayments] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardStats] });
    },
  });
};

// ====== OBJETIVOS ======
export const useObjetivos = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.objetivos],
    queryFn: async () => {
      const response = await apiServices.objetivosApi.getActive();
      return response.list || response || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useCreateObjetivo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => apiServices.objetivosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.objetivos] });
    },
  });
};

export const useUpdateObjetivo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiServices.objetivosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.objetivos] });
    },
  });
};

export const useDeleteObjetivo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => apiServices.objetivosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.objetivos] });
    },
  });
};

// ====== PRESUPUESTOS ======
export const usePresupuestos = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.presupuestos],
    queryFn: async () => {
      const response = await apiServices.presupuestosApi.getActive();
      return response.list || response || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useCreatePresupuesto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => apiServices.presupuestosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.presupuestos] });
    },
  });
};

export const useUpdatePresupuesto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiServices.presupuestosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.presupuestos] });
    },
  });
};

export const useDeletePresupuesto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => apiServices.presupuestosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.presupuestos] });
    },
  });
};

// ====== MONEDAS (Casi estático) ======
export const useMonedas = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.monedas],
    queryFn: async () => {
      const response = await apiServices.monedasApi.getAll({ activa: true });
      return response.list || response || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutos (cambian muy raramente)
  });
};

export const useCreateMoneda = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => apiServices.monedasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.monedas] });
    },
  });
};

export const useUpdateMoneda = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiServices.monedasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.monedas] });
    },
  });
};

// ====== COTIZACIÓN DÓLAR (Actualizar frecuentemente) ======
export const useDollarQuotes = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.dollarQuotes],
    queryFn: () => fetch('https://dolarapi.com/v1/dolares').then(r => r.json()),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Auto-refresh cada 1 minuto
  });
};

// ====== TARJETAS DE CRÉDITO ======
export const useTarjetas = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.tarjetas],
    queryFn: async () => {
      const response = await apiServices.transaccionesApi.getAll(100, 0, {
        metodo_pago: 'Tarjeta de Crédito'
      });
      return response.list || response || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// ====== ESTADÍSTICAS DEL DASHBOARD ======
// Cómputo puro sobre transacciones ya cargadas — antes esto era un
// useQuery con su propio fetch sin límite (transaccionesApi.getAll() sin
// argumentos, que además defaultea a limit=100 en el service), duplicando
// la llamada que ya hace useTransactions({limit:1000}) y bloqueando toda
// la app detrás de esa segunda espera. Ver ModernMissionControl, que ahora
// llama esto con useMemo sobre transactionsData.
export const computeDashboardStats = (transactionsList = []) => {
  // Calcular balance global (ARS)
  const ingresos = transactionsList
    .filter(t => t.tipo === 'ingreso' && !t.es_credito)
    .reduce((sum, t) => sum + parseFloat(t.monto_ars || t.monto || 0), 0);

  const gastos = transactionsList
    .filter(t => t.tipo === 'gasto' && !t.es_credito)
    .reduce((sum, t) => sum + parseFloat(t.monto_ars || t.monto || 0), 0);

  // Calcular balance por moneda
  const currenciesMap = {};

  transactionsList.forEach(t => {
    if (t.es_credito) return; // Excluir tarjetas de crédito

    const moneda = t.moneda || t.Moneda || 'ARS';
    const monto = parseFloat(t.monto || 0);
    const tipo = t.tipo;

    if (!currenciesMap[moneda]) {
      currenciesMap[moneda] = {
        moneda,
        ingresos: 0,
        gastos: 0,
        balance: 0,
        simbolo: moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : '$'
      };
    }

    if (tipo === 'ingreso') {
      currenciesMap[moneda].ingresos += monto;
    } else if (tipo === 'gasto') {
      currenciesMap[moneda].gastos += monto;
    }

    currenciesMap[moneda].balance =
      currenciesMap[moneda].ingresos - currenciesMap[moneda].gastos;
  });

  const currenciesBalance = Object.values(currenciesMap);

  return {
    balance: {
      ingresos,
      gastos,
      balance: ingresos - gastos,
    },
    currenciesBalance,
    transactionsCount: transactionsList.length,
  };
};

// ====== BALANCE NETO ======
// Dinero real que el usuario debería tener a fin de un mes: ancla en el
// balance inicial configurado más reciente + ingresos - gastos desde ahí.
export const useBalanceNeto = (mes) => {
  return useQuery({
    queryKey: [QUERY_KEYS.balanceNeto, mes],
    queryFn: () => apiServices.balanceInicialApi.getNeto(mes),
    staleTime: 60 * 1000,
  });
};

export const useSetBalanceInicial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiServices.balanceInicialApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.balanceNeto] });
    },
  });
};
