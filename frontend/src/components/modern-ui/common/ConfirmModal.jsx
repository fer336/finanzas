import PropTypes from 'prop-types';
import { AlertCircle, Trash2 } from 'lucide-react';

/**
 * ConfirmModal — modal de confirmación, tema "Papel" (ver DESIGN.md:
 * overlay rgba(32,36,44,.4), panel #faf7ef radius 12px, sin sombra
 * decorativa ni gradientes).
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
    danger: { icon: '#a04a34', bg: '#fdf6e3', button: 'bg-[#a04a34] hover:bg-[#8f4230]' },
    warning: { icon: '#8a6a1f', bg: '#fdf6e3', button: 'bg-[#8a6a1f] hover:bg-[#795b1a]' },
    info: { icon: '#3d5a80', bg: '#f0ead9', button: 'bg-[#3d5a80] hover:bg-[#354e6d]' },
  };

  const color = colors[type];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(32,36,44,.4)] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[#ddd5c2] bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center p-6 pb-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: color.bg }}
          >
            {type === 'danger' ? (
              <Trash2 className="h-8 w-8" style={{ color: color.icon }} />
            ) : (
              <AlertCircle className="h-8 w-8" style={{ color: color.icon }} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-[13.5px] leading-relaxed text-[#5d6470]">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-sm border border-[#ddd5c2] bg-white px-4 py-[9px] text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-[#f0ead9]"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-sm px-4 py-[9px] text-[13px] font-semibold text-[#faf7ef] transition-colors duration-150 ${color.button}`}
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
