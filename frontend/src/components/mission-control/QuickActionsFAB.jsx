import React from 'react';
import { Bot } from 'lucide-react';

export const QuickActionsFAB = ({ onSelectAction }) => {
  return (
    <>
      {/* Main FAB Button - Abre el agente en pantalla completa */}
      <button
        onClick={() => onSelectAction('agent')}
        className="fixed bottom-24 sm:bottom-6 left-6 z-50 size-14 sm:size-16 rounded-full bg-[#059467] text-white flex items-center justify-center shadow-lg hover:bg-[#059467]/90 transition-transform transform hover:scale-105"
        title="Abrir Asistente de IA"
      >
        <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>
    </>
  );
};

