import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // Ocultar después de 3 segundos cuando vuelve la conexión
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mostrar estado inicial si está offline
    if (!navigator.onLine) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // No mostrar nada si está online y no hay que mostrar el status
  if (isOnline && !showStatus) return null;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${
      showStatus ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'
    } max-w-[90vw] w-auto`}>
      <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${
        isOnline 
          ? 'bg-emerald-500/80 border-emerald-400/50 text-white shadow-emerald-500/20' 
          : 'bg-red-500/80 border-red-400/50 text-white shadow-red-500/20'
      }`}>
        {isOnline ? (
          <>
            <div className="p-1.5 bg-white/20 rounded-full">
              <Wifi className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-wide">Conexión restaurada</span>
          </>
        ) : (
          <>
            <div className="p-1.5 bg-white/20 rounded-full animate-pulse">
              <WifiOff className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-wide">Modo Offline</span>
              <span className="text-[11px] opacity-90 font-medium">Usando datos locales</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (isOnline) return null;
  
  return (
    <div className="fixed bottom-6 left-6 z-[90] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-amber-500/90 backdrop-blur-md border border-amber-400/50 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-bold">Sin conexión</span>
      </div>
    </div>
  );
}
