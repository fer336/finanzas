import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './components/auth/auth-provider';
import { AmountVisibilityProvider } from './contexts/AmountVisibilityContext';
import { initOfflineInterceptor } from './utils/network';

// Inicializar interceptor de red para manejar modo offline
initOfflineInterceptor();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AmountVisibilityProvider>
        <App />
      </AmountVisibilityProvider>
    </AuthProvider>
  </React.StrictMode>
);