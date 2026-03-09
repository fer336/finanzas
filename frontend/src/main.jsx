import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { AuthProvider } from './components/auth/auth-provider';
import { AmountVisibilityProvider } from './contexts/AmountVisibilityContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initOfflineInterceptor } from './utils/network';

// Inicializar interceptor de red para manejar modo offline
initOfflineInterceptor();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AmountVisibilityProvider>
            <App />
          </AmountVisibilityProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
