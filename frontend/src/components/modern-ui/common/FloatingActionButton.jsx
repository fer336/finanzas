import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, X } from 'lucide-react';

/**
 * FloatingActionButton - FAB desplegable con múltiples acciones
 */
const FloatingActionButton = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Acciones desplegadas */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 flex flex-col gap-2 mb-1 animate-fade-in">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  action.onClick && action.onClick();
                  setIsOpen(false);
                }}
                className="
                  flex items-center gap-2.5 px-3 py-2 rounded-xl
                  bg-[#18181b] border border-white/10
                  text-white hover:bg-white/5
                  shadow-lg
                  transition-all
                  whitespace-nowrap
                "
                title={action.label}
                style={{
                  animation: `slideInRight 0.2s ease-out ${index * 0.04}s both`
                }}
              >
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Botón Principal */}
      <button
        onClick={toggleMenu}
        className={`
          w-11 h-11 rounded-full
          bg-gradient-to-br from-[#10b981] to-[#34d399]
          flex items-center justify-center
          shadow-lg shadow-green-500/25
          active:scale-95
          transition-all
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
      >
        {isOpen ? (
          <X className="w-4 h-4 text-white" />
        ) : (
          <Plus className="w-4 h-4 text-white" />
        )}
      </button>

      {/* Backdrop para cerrar al hacer click afuera */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

FloatingActionButton.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.shape({
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  })).isRequired,
};

export default FloatingActionButton;
