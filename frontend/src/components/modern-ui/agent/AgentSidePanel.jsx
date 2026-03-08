import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Send, Sparkles, Trash2, Copy, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AIConfigModal } from '../../AIConfigModal';

/**
 * AgentSidePanel - Panel lateral flotante para el Agente IA (estilo Gemini)
 */
const AgentSidePanel = ({ isOpen, onClose, balanceData }) => {
  // Thread ID para persistencia con LangGraph + Redis
  const [threadId, setThreadId] = useState(() => {
    const saved = localStorage.getItem('lucy_thread_id');
    if (saved) return saved;
    const newId = `lucy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('lucy_thread_id', newId);
    return newId;
  });

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 ¡Hola! Soy **Lucy**, tu asistente financiera inteligente.\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Block scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Llamar al endpoint del agente
      console.log('🤖 Enviando mensaje a Lucy:', input);
      
      const response = await fetch('/api/agent/chat-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message: input,
          thread_id: threadId,
          context: {
            balance_data: balanceData
          }
        })
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del backend:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      console.log('✅ Respuesta de Lucy (LangGraph):', data);

      const assistantMessage = {
        role: 'assistant',
        content: data.response || data.output || 'Lo siento, ocurrió un error.',
        timestamp: new Date(),
        toolCalls: data.tool_calls,
        threadId: data.thread_id
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('❌ Error en agente:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Error al procesar tu mensaje**\n\n${error.message || error}\n\nPor favor, intenta de nuevo o reformula tu pregunta.`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm('¿Borrar toda la conversación?')) {
      setMessages([{
        role: 'assistant',
        content: '👋 ¡Hola! Soy **Lucy**, tu asistente financiera inteligente.\n\n¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      }]);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel lateral */}
      <div 
        className={`
          fixed top-0 right-0 h-screen w-[480px] max-w-full
          bg-[#18181b] border-l border-white/10
          shadow-2xl z-[9999]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Lucy</h2>
              <p className="text-xs text-gray-400">Tu asistente financiera personal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Configurar Lucy (API Key)"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={clearChat}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Borrar conversación"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[85%] rounded-2xl p-4
                  ${message.role === 'user' 
                    ? 'bg-gradient-to-br from-[#10b981] to-[#34d399] text-white' 
                    : 'bg-[#0a0a0a] border border-white/10 text-white'
                  }
                `}
              >
                <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-sm" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline 
                          ? <code className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono" {...props} />
                          : <code className="block p-2 bg-white/10 rounded-lg text-xs font-mono overflow-x-auto my-2" {...props} />,
                      a: ({node, ...props}) => <a className="text-[#10b981] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('es-AR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#10b981] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-gray-400">Pensando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta sobre tus finanzas..."
                rows={1}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981]/50 transition-colors resize-none scrollbar-thin"
                style={{ maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`
                p-3 rounded-xl transition-all flex-shrink-0
                ${input.trim() && !isLoading
                  ? 'bg-gradient-to-br from-[#10b981] to-[#34d399] hover:shadow-lg hover:shadow-[#10b981]/30' 
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
                }
              `}
              title="Enviar mensaje"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Sugerencias rápidas */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-thin pb-2">
            <button
              onClick={() => setInput('¿Cuánto gasté este mes?')}
              className="px-3 py-1.5 bg-[#0a0a0a] border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#10b981]/50 transition-colors whitespace-nowrap"
            >
              💰 Gastos del mes
            </button>
            <button
              onClick={() => setInput('¿Cómo va mi presupuesto?')}
              className="px-3 py-1.5 bg-[#0a0a0a] border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#10b981]/50 transition-colors whitespace-nowrap"
            >
              📊 Estado presupuesto
            </button>
            <button
              onClick={() => setInput('¿Cuánto debo de tarjetas?')}
              className="px-3 py-1.5 bg-[#0a0a0a] border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#10b981]/50 transition-colors whitespace-nowrap"
            >
              💳 Deuda tarjetas
            </button>
          </div>
        </div>
      </div>

      {/* AI Config Modal */}
      {showConfigModal && (
        <AIConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </>
  );
};

AgentSidePanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  balanceData: PropTypes.object
};

export default AgentSidePanel;
