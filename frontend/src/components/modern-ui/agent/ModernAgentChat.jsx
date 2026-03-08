import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Bot, Send, User, Sparkles } from 'lucide-react';

const ModernAgentChat = ({ balanceData }) => {
  const [messages, setMessages] = useState([{ role: 'assistant', content: '¡Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte?', timestamp: new Date() }]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: inputValue, timestamp: new Date() }]);
    setInputValue('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Procesando tu consulta...', timestamp: new Date() }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        <div className="col-span-9">
          <div className="bg-[#18181b] rounded-3xl border border-white/5 h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#10b981] to-[#34d399] rounded-xl"><Bot className="w-6 h-6 text-white" /></div>
              <div><h2 className="text-lg font-bold text-white">Agente IA Financiero</h2><p className="text-xs text-gray-400">Powered by Gemini</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${msg.role === 'user' ? 'bg-gradient-to-br from-[#10b981] to-[#34d399]' : 'bg-[#0a0a0a]'}`}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-[#10b981]" />}
                    </div>
                    <div className={`p-4 rounded-xl ${msg.role === 'user' ? 'bg-gradient-to-br from-[#10b981] to-[#34d399] text-white' : 'bg-[#0a0a0a] text-white'}`}><p className="text-sm">{msg.content}</p></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-white/5 flex gap-3">
              <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribe tu pregunta..." className="flex-1 px-4 py-3 rounded-xl bg-[#0a0a0a] text-white border border-white/5 focus:outline-none focus:border-[#10b981]/30 transition-colors" />
              <button onClick={handleSend} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-medium hover:shadow-lg transition-all flex items-center gap-2">
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>
        <div className="col-span-3 space-y-6">
          <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5">
            <h3 className="text-base font-bold text-white mb-4">Datos Financieros</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-[#0a0a0a] rounded-lg"><span className="text-sm text-gray-400">Balance</span><span className="text-sm font-bold text-[#10b981]">$255.000</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ModernAgentChat.propTypes = { balanceData: PropTypes.object };
export default ModernAgentChat;
