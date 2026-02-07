import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { SessionTimeoutModal } from './SessionTimeoutModal';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si hay parámetros de autenticación en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const sessionExpired = urlParams.get('session_expired');
    const tokenFromUrl = urlParams.get('token');
    const userFromUrl = urlParams.get('user');
    const emailFromUrl = urlParams.get('email');
    const pictureFromUrl = urlParams.get('picture');

    // Mostrar mensaje de sesión expirada
    if (sessionExpired === 'true') {
      console.warn('⏰ Sesión expirada por inactividad');
      // Crear notificación temporal
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-[10000] bg-yellow-500/90 text-black px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 duration-300';
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p class="font-bold">Sesión expirada</p>
            <p class="text-sm">Tu sesión se cerró por inactividad (10 minutos)</p>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Remover notificación después de 5 segundos
      setTimeout(() => {
        notification.classList.add('animate-out', 'fade-out', 'slide-out-to-top-4');
        setTimeout(() => notification.remove(), 300);
      }, 5000);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (authStatus === 'success' && tokenFromUrl) {
      // Autenticación exitosa
      const userData = {
        name: decodeURIComponent(userFromUrl || ''),
        email: decodeURIComponent(emailFromUrl || ''),
        picture: decodeURIComponent(pictureFromUrl || ''),
      };
      
      setUser(userData);
      setToken(tokenFromUrl);
      setIsAuthenticated(true);
      
      // Guardar en localStorage
      localStorage.setItem('auth_token', tokenFromUrl);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } else if (authStatus === 'notfound') {
      // Usuario no existe en la base de datos
      const email = urlParams.get('email');
      const userName = urlParams.get('user');
      
      console.error('Usuario no encontrado en base de datos:', { email, userName });
      alert(`Acceso denegado.\n\nEl usuario ${decodeURIComponent(email || '')} no está registrado en el sistema.\n\nContacta al administrador para obtener acceso.`);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } else if (authStatus === 'inactive') {
      // Usuario inactivo en la base de datos
      const email = urlParams.get('email');
      const userName = urlParams.get('user');
      
      console.error('Usuario inactivo:', { email, userName });
      alert(`Acceso denegado.\n\nEl usuario ${decodeURIComponent(email || '')} está desactivado.\n\nContacta al administrador para reactivar tu cuenta.`);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } else if (authStatus === 'unauthorized') {
      // Usuario no autorizado (caso antiguo)
      const email = urlParams.get('email');
      const userName = urlParams.get('user');
      
      console.error('Usuario no autorizado:', { email, userName });
      alert(`Acceso denegado. El email ${decodeURIComponent(email || '')} no está autorizado.`);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } else if (authStatus === 'error') {
      // Error en autenticación
      const message = urlParams.get('message');
      
      console.error('Error en autenticación:', message);
      alert(`Error de autenticación: ${decodeURIComponent(message || 'Error desconocido')}`);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } else {
      // Verificar si hay datos guardados en localStorage
      const savedToken = localStorage.getItem('auth_token');
      const savedUserData = localStorage.getItem('user_data');
      
      if (savedToken && savedUserData) {
        try {
          const userData = JSON.parse(savedUserData);
          setUser(userData);
          setToken(savedToken);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      }
    }
    
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('last_activity'); // Limpiar timestamp de actividad
    
    // Redirigir al login con mensaje
    window.location.href = '/?session_expired=true';
  };

  // 🔒 Session Timeout: 10 minutos de inactividad
  const {
    showWarning,
    remainingSeconds,
    extendSession,
    resetTimeout
  } = useSessionTimeout(
    logout, // Callback cuando expira la sesión
    10, // 10 minutos de inactividad
    2   // Advertencia 2 minutos antes
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    logout,
    resetTimeout // Exportar para poder resetear manualmente desde otros componentes
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Modal de advertencia de sesión por expirar */}
      {isAuthenticated && (
        <SessionTimeoutModal
          isOpen={showWarning}
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser used within an AuthProvider');
  }
  return context;
}