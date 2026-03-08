import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, Trash2, X } from 'lucide-react';

/**
 * ConfirmModal - Modal de confirmación moderno
 */
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger' // 'danger' o 'warning' o 'info'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: {
      icon: 'text-red-500',
      bg: 'bg-red-500/10',
      button: 'from-red-500 to-red-600'
    },
    warning: {
      icon: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      button: 'from-yellow-500 to-yellow-600'
    },
    info: {
      icon: 'text-blue-500',
      bg: 'bg-blue-500/10',
      button: 'from-blue-500 to-blue-600'
    }
  };

  const color = colors[type];

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#18181b] rounded-3xl border border-white/10 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="p-6 pb-4 flex justify-center">
          <div className={`w-16 h-16 rounded-full ${color.bg} flex items-center justify-center`}>
            {type === 'danger' ? (
              <Trash2 className={`w-8 h-8 ${color.icon}`} />
            ) : (
              <AlertCircle className={`w-8 h-8 ${color.icon}`} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-3 bg-gradient-to-r ${color.button} rounded-xl text-white font-medium hover:shadow-lg transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(['danger', 'warning', 'info'])
};

export default ConfirmModal;
