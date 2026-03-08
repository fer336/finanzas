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
    <div className="fixed bottom-24 right-8 z-40">
      {/* Acciones desplegadas */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2 animate-fade-in">
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
                  flex items-center gap-3 px-4 py-3 rounded-2xl
                  bg-[#18181b] border-2 border-white/10
                  text-white hover:bg-white/5
                  shadow-xl hover:shadow-2xl
                  transition-all
                  whitespace-nowrap
                "
                title={action.label}
                style={{
                  animation: `slideInRight 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                <Icon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Botón Principal */}
      <button
        onClick={toggleMenu}
        className={`
          w-14 h-14 rounded-full
          bg-gradient-to-br from-[#10b981] to-[#34d399]
          flex items-center justify-center
          shadow-xl shadow-green-500/30
          hover:shadow-2xl hover:scale-110
          transition-all
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
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
