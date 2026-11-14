import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Clock } from 'lucide-react';

/**
 * Modal de advertencia de timeout de sesión
 * @param {boolean} isOpen - Si el modal está visible
 * @param {number} remainingSeconds - Segundos restantes antes del cierre de sesión
 * @param {Function} onExtend - Callback para extender la sesión
 * @param {Function} onLogout - Callback para cerrar sesión manualmente
 */
export const SessionTimeoutModal = ({ isOpen, remainingSeconds, onExtend, onLogout }) => {
  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-zinc-900 dark:from-[var(--card)] to-zinc-800 dark:to-[var(--secondary)] border border-yellow-500/30 dark:border-[var(--arrears-pill)] rounded-2xl shadow-2xl shadow-yellow-500/20 max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-500/10 dark:bg-[var(--arrears-pill)] rounded-full animate-pulse">
              <AlertTriangle className="w-6 h-6 text-yellow-500 dark:text-[var(--warning)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white dark:text-[var(--foreground)]">Sesión por expirar</h2>
              <p className="text-sm text-zinc-400 dark:text-[var(--muted-foreground)]">Tu sesión está inactiva</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-3 p-6 bg-zinc-950/50 rounded-xl border border-yellow-500/20 dark:border-[var(--arrears-pill)]">
            <Clock className="w-8 h-8 text-yellow-500 dark:text-[var(--warning)] animate-pulse" />
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-500 dark:text-[var(--warning)] tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <p className="text-xs text-zinc-400 dark:text-[var(--muted-foreground)] mt-1">
                Tiempo restante
              </p>
            </div>
          </div>

          {/* Mensaje */}
          <p className="text-sm text-zinc-300 dark:text-[var(--foreground)] mt-4 text-center">
            Por seguridad, cerraremos tu sesión automáticamente por inactividad.
          </p>
          <p className="text-xs text-zinc-500 dark:text-[var(--muted-foreground)] mt-2 text-center">
            ¿Quieres seguir conectado?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-3 bg-zinc-800 dark:bg-[var(--secondary)] hover:bg-zinc-700 dark:hover:bg-[var(--secondary)] text-white dark:text-[var(--foreground)] rounded-xl font-medium transition-colors border border-zinc-700 dark:border-[var(--border)]"
          >
            Cerrar sesión
          </button>
          <button
            onClick={onExtend}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 dark:from-[var(--warning)] to-orange-500 dark:to-[var(--warning)] hover:from-yellow-400 dark:hover:from-[var(--warning)] hover:to-orange-400 dark:hover:to-[var(--warning)] text-black dark:text-[var(--primary-foreground)] rounded-xl font-bold transition-all shadow-lg shadow-yellow-500/30 hover:scale-105"
          >
            Seguir conectado
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

