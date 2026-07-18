import PropTypes from 'prop-types';
import { AlertCircle, Trash2 } from 'lucide-react';

/**
 * ConfirmModal — modal de confirmación, tema "Kanagawa" (ver DESIGN.md:
 * overlay rgba(32,36,44,.4), panel #e5ddb0 radius 12px, sin sombra
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
    danger: { icon: 'var(--destructive)', bg: 'var(--accent)', button: 'bg-destructive hover:bg-[#8f4230] dark:hover:bg-[#a85a44]' },
    warning: { icon: 'var(--warning)', bg: '#f9d791', button: 'bg-[#6b572f] hover:bg-[#795b1a]' },
    info: { icon: 'var(--info)', bg: '#e4d794', button: 'bg-[#4d699b] hover:bg-[#354e6d]' },
  };

  const color = colors[type];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(32,36,44,.4)] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[#c8bf91] bg-card dark:border-[#363646]"
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
          <p className="text-[13.5px] leading-relaxed text-[#43436c] dark:text-[#c8c093]">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-sm border border-[#c8bf91] bg-white px-4 py-[9px] text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-[#e4d794] dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#363646]"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-sm px-4 py-[9px] text-[13px] font-semibold text-[#e5ddb0] transition-colors duration-150 ${color.button}`}
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
