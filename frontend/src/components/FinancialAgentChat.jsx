import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, X, Image as ImageIcon, Camera, RotateCcw, CreditCard, TrendingUp, TrendingDown, Calendar, ExternalLink, DollarSign, AlertCircle, Clock, ArrowUpCircle, ArrowDownCircle, PieChart, Bot } from 'lucide-react';

const FinancialAgentChat = ({ onClose, categories = [], paymentMethods = [], userData = {}, financialData = null }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🤖 Enviar mensaje directamente al agente backend (Python + OpenRouter)
  const sendMessageToAgent = async (userMessage) => {
    // Normalizar datos para evitar duplicados (mayúsculas/minúsculas)
    const normalizeObject = (obj) => {
      if (!obj) return obj;
      if (Array.isArray(obj)) {
        return obj.map(item => normalizeObject(item));
      }
      if (typeof obj === 'object') {
        const normalized = {};
        Object.keys(obj).forEach(key => {
          const lowerKey = key.toLowerCase();
          // Solo agregar si no existe ya en minúsculas
          if (!normalized[lowerKey]) {
            normalized[lowerKey] = normalizeObject(obj[key]);
          }
        });
        return normalized;
      }
      return obj;
    };
    
    // Preparar contexto limpio sin duplicados
    const context = {
      timestamp: new Date().toISOString(),
      user_name: userData.name || 'Usuario',
      categories: normalizeObject(categories),
      payment_methods: normalizeObject(paymentMethods),
      financial_data: normalizeObject(financialData)
    };

    // Si hay mensajes previos, enviarlos como historial
    // (Limitamos a los últimos 10 para no saturar el contexto)
    const history = messages.slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    try {
      // En desarrollo usar localhost, en producción usar la URL configurada con HTTPS forzado
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isDevelopment 
        ? 'http://localhost:8000' 
        : (import.meta.env.VITE_BACKEND_URL || `https://${window.location.hostname}`);
      
      console.log('🤖 Sending message to AI agent:', baseUrl);
      
      // 🔐 Obtener token JWT del localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ No auth token found in localStorage');
        throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
      }
      
      const response = await fetch(`${baseUrl}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          history: history,
          context: context
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Backend error ${response.status}:`, errorText);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI agent responded successfully');
      return data.response || 'No recibí respuesta del agente.';

    } catch (error) {
      console.error('❌ Error connecting to AI agent:', error);
      return `❌ Lo siento, hubo un error al conectar con el agente. Por favor intenta de nuevo más tarde.\n\nDetalle técnico: ${error.message}`;
    }
  };

  // Manejar selección de imagen
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Abrir selector de archivos
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Abrir cámara
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // Limpiar imagen seleccionada
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Limpiar conversación
  const clearConversation = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar toda la conversación?')) {
      setMessages([]);
      setInputValue('');
      clearImage();
    }
  };

  // Manejar envío de mensaje
  const handleSendMessage = async (text = inputValue) => {
    if ((!text.trim() && !selectedImage) || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text.trim() || '📷 Imagen adjunta',
      image: imagePreview,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    clearImage();
    setIsLoading(true);

    try {
      // Enviar al backend Python
      const agentResponse = await sendMessageToAgent(text.trim());

      // Agregar respuesta del agente
      const agentMessage = {
        id: Date.now() + 1,
        type: 'agent',
        text: agentResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'agent',
        text: '❌ Hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Manejar Enter para enviar
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Renderizar Markdown con estilos de tarjeta
  const renderMarkdown = (text) => (
    <div className="markdown-content">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Párrafos
          p: ({node, children}) => <p className="text-white/90 leading-relaxed mb-3 last:mb-0">{children}</p>,
          
          // Listas como cards
          ul: ({node, children}) => (
            <div className="bg-[#1f1f1f] border border-white/10 rounded-xl p-4 my-3">
              <ul className="list-disc list-inside space-y-2 text-white/90">{children}</ul>
            </div>
          ),
          ol: ({node, children}) => (
            <div className="bg-[#1f1f1f] border border-white/10 rounded-xl p-4 my-3">
              <ol className="list-decimal list-inside space-y-2 text-white/90">{children}</ol>
            </div>
          ),
          li: ({node, children}) => <li className="pl-1">{children}</li>,
          
          // Énfasis y negrita
          strong: ({node, children}) => <span className="font-bold text-cyan-300">{children}</span>,
          em: ({node, children}) => <span className="italic text-white/80">{children}</span>,
          
          // Encabezados
          h1: ({node, children}) => <h1 className="text-xl font-bold text-white mt-6 mb-3 pb-2 border-b border-white/10">{children}</h1>,
          h2: ({node, children}) => <h2 className="text-lg font-bold text-white mt-5 mb-3 text-cyan-400">{children}</h2>,
          h3: ({node, children}) => <h3 className="text-base font-bold text-white/90 mt-4 mb-2">{children}</h3>,
          
          // Tablas
          table: ({node, children}) => (
            <div className="overflow-x-auto my-4 bg-[#1f1f1f] rounded-xl border border-white/10 shadow-lg">
              <table className="w-full text-sm text-left border-collapse">{children}</table>
            </div>
          ),
          thead: ({node, children}) => <thead className="bg-white/5 text-white/70 uppercase text-xs font-semibold">{children}</thead>,
          tbody: ({node, children}) => <tbody className="divide-y divide-white/5">{children}</tbody>,
          tr: ({node, children}) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
          th: ({node, children}) => <th className="px-4 py-3 whitespace-nowrap">{children}</th>,
          td: ({node, children}) => <td className="px-4 py-3 text-white/80 border-t border-white/5">{children}</td>,
          
          // Bloques de código
          code: ({node, inline, className, children, ...props}) => {
            return !inline ? (
              <div className="bg-black/30 rounded-lg p-3 my-2 overflow-x-auto border border-white/5 font-mono text-sm">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code className="bg-white/10 rounded px-1.5 py-0.5 font-mono text-sm text-cyan-300 border border-white/5" {...props}>
                {children}
              </code>
            );
          },
          
          // Citas
          blockquote: ({node, children}) => (
            <blockquote className="border-l-4 border-cyan-500/50 pl-4 py-1 my-3 bg-cyan-500/5 rounded-r-lg italic text-white/80">
              {children}
            </blockquote>
          ),
          
          // Links
          a: ({node, href, children}) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1 transition-colors">
              {children} <ExternalLink className="w-3 h-3" />
            </a>
          ),

          // Imágenes
          img: ({node, src, alt}) => (
            <img src={src} alt={alt} className="rounded-xl max-w-full border border-white/10 my-2 shadow-lg" />
          ),
          
          // Separadores
          hr: () => <hr className="border-white/10 my-6" />
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );

  // Renderizar contenido con formato visual
  const renderFormattedContent = (text) => {
    // Intentar parsear como JSON primero
    try {
      const jsonData = JSON.parse(text);
      if (jsonData && typeof jsonData === 'object') {
        return renderStructuredData(jsonData);
      }
    } catch (e) {
      // No es JSON, continuar con detección de patrones
    }

    // Detectar si el texto tiene estructura de resumen bancario (DEBE tener múltiples indicadores)
    const hasBankCardData = (
      (text.includes('Resumen de tu tarjeta') || text.includes('tarjeta VISA') || text.includes('tarjeta MasterCard')) &&
      (text.includes('Saldo actual:') || text.includes('saldo actual')) &&
      text.match(/\$[0-9,]+/)
    );

    if (hasBankCardData) {
      return renderBankCards(text);
    }

    // Detectar análisis de gastos detallado (DEBE tener lista con montos)
    const hasDetailedExpenses = (
      (text.includes('gastos principales') || 
       text.includes('Este mes, tus gastos') || 
       text.includes('Gastos principales') ||
       text.includes('Gastos Totales') ||
       text.includes('Detalle por Categoría')) &&
      text.split('\n').filter(line => line.match(/[*\-•]\s+.+\$[0-9,]+/)).length >= 3
    );

    if (hasDetailedExpenses) {
      return renderExpenseAnalysis(text);
    }

    // Detectar pagos pendientes (debe tener múltiples indicadores)
    const hasPendingPayments = (
      (text.includes('pagos pendientes') || text.includes('facturas que debes') || text.includes('debes atender')) &&
      (text.includes('Vencimiento:') || text.includes('vencimiento:')) &&
      text.match(/https?:\/\/[^\s)]+/)
    );

    if (hasPendingPayments) {
      return renderPendingPayments(text);
    }

    // Detectar lista de transacciones individuales (debe tener múltiples transacciones con montos y fechas)
    const hasTransactionList = (
      text.split('\n').filter(line => 
        line.match(/[-+]\$[0-9,]+(?:\.[0-9]+)?\s*ARS\s+el\s+\d+\s+de/)
      ).length >= 3
    );

    if (hasTransactionList) {
      return renderTransactionList(text);
    }

    // Para todo lo demás, usar Markdown con estilos de tarjeta
    return renderMarkdown(text);
  };

  // Renderizar datos estructurados (JSON)
  const renderStructuredData = (data) => {
    // Si es un array, renderizar como lista de items
    if (Array.isArray(data)) {
      return (
        <div className="space-y-3">
          {data.map((item, idx) => (
            <div key={idx} className="bg-[#1f1f1f] rounded-xl p-4 border border-white/10">
              {Object.entries(item).map(([key, value]) => (
                <div key={key} className="mb-2 last:mb-0">
                  <span className="text-white/60 text-sm">{key}: </span>
                  <span className="text-white font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    // Si es un objeto, renderizar sus propiedades
    return (
      <div className="bg-[#1f1f1f] rounded-xl p-4 border border-white/10">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="mb-3 last:mb-0">
            <p className="text-white/60 text-sm mb-1">{key}</p>
            <p className="text-white font-medium">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar lista de transacciones individuales
  const renderTransactionList = (text) => {
    const lines = text.split('\n');
    const transactions = [];
    let introText = '';

    lines.forEach(line => {
      // Detectar transacciones: Nombre*: -$MONTO ARS el FECHA
      const txMatch = line.match(/^([^:*]+)[*:]?\s*:\s*([+-]?)\$([0-9,]+(?:\.[0-9]+)?)\s*ARS\s+el\s+(\d+\s+de\s+\w+\s+de\s+\d{4})/);
      
      if (txMatch) {
        const [, name, sign, amount, date] = txMatch;
        transactions.push({
          name: name.trim().replace(/^[🍦🔧🍺💰🏪🍞🛒💳📦🚰💡🏥⚡🔨]+\s*/, ''), // Quitar emojis
          amount: parseFloat(amount.replace(/,/g, '')),
          isExpense: sign === '-' || !sign, // Por defecto es gasto si no tiene signo
          date: date.trim(),
          emoji: name.match(/[🍦🔧🍺💰🏪🍞🛒💳📦🚰💡🏥⚡🔨]/)?.[0] || (sign === '+' ? '💰' : '💸')
        });
      } else if (!line.match(/[-+]\$/) && line.trim() && transactions.length === 0) {
        introText += line + ' ';
      }
    });

    if (transactions.length > 0) {
      // Calcular totales
      const totalExpenses = transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpenses;

      // Agrupar por categoría (basado en nombre)
      const categories = {};
      transactions.forEach(tx => {
        const category = tx.name.split(/\s*[:-]\s*/)[0]; // Primera parte antes de : o -
        if (!categories[category]) {
          categories[category] = { count: 0, total: 0, transactions: [] };
        }
        categories[category].count++;
        categories[category].total += tx.amount;
        categories[category].transactions.push(tx);
      });

      const topCategories = Object.entries(categories)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5);

      return (
        <div>
          {introText && (
            <p className="text-white/80 mb-4 leading-relaxed">{introText.trim()}</p>
          )}

          {/* Resumen visual */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="w-5 h-5 text-red-400" />
                <p className="text-white/70 text-sm">Total Gastos</p>
              </div>
              <p className="text-2xl font-bold text-red-400">
                ${totalExpenses.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-white/40 text-xs mt-1">{transactions.filter(t => t.isExpense).length} transacciones</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="w-5 h-5 text-green-400" />
                <p className="text-white/70 text-sm">Total Ingresos</p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                ${totalIncome.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-white/40 text-xs mt-1">{transactions.filter(t => !t.isExpense).length} transacciones</p>
            </div>
          </div>

          {/* Balance */}
          <div className={`rounded-xl p-4 mb-4 ${
            balance >= 0 
              ? 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20' 
              : 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20'
          }`}>
            <p className="text-white/70 text-sm mb-1">Balance Neto</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
              {balance >= 0 ? '+' : '-'}${Math.abs(balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Top categorías */}
          {topCategories.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-5 h-5 text-purple-400" />
                <h4 className="text-white font-semibold">Top 5 - Donde gastaste más</h4>
              </div>
              <div className="space-y-2">
                {topCategories.map(([category, data], idx) => {
                  const percentage = (data.total / totalExpenses) * 100;
                  const colors = [
                    'bg-purple-500',
                    'bg-blue-500',
                    'bg-pink-500',
                    'bg-orange-500',
                    'bg-cyan-500'
                  ];
                  return (
                    <div key={idx} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">{category}</span>
                        <span className="text-white/70 text-sm">${data.total.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`${colors[idx]} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-white/50 text-xs w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                      <p className="text-white/40 text-xs mt-1">{data.count} transacciones</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabla de transacciones */}
          <div className="mb-4">
            <h4 className="text-white/70 text-sm font-medium mb-3 uppercase tracking-wide">Detalle de Transacciones</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {transactions.map((tx, idx) => (
                <div 
                  key={idx} 
                  className={`rounded-lg p-3 border transition-all hover:scale-[1.02] ${
                    tx.isExpense
                      ? 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10'
                      : 'bg-green-500/5 border-green-500/10 hover:bg-green-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-2xl">{tx.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{tx.name}</p>
                        <p className="text-white/50 text-xs mt-0.5">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${tx.isExpense ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.isExpense ? '-' : '+'}${tx.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/40 text-xs">ARS</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensaje final */}
          {lines.filter(line => 
            !line.match(/[-+]\$[0-9,]+/) && 
            line.trim() && 
            !introText.includes(line)
          ).map((line, idx) => (
            <p key={idx} className="text-white/70 mt-4 text-sm leading-relaxed italic">{line}</p>
          ))}
        </div>
      );
    }

    return renderMarkdown(text);
  };

  // Renderizar pagos pendientes
  const renderPendingPayments = (text) => {
    const lines = text.split('\n');
    const payments = [];
    let introText = '';
    let currentPayment = null;

    lines.forEach((line) => {
      // Detectar inicio de pago (número seguido de punto y asteriscos)
      if (line.match(/^\d+\.\s+\*/)) {
        if (currentPayment) {
          payments.push(currentPayment);
        }
        currentPayment = {
          title: line.replace(/^\d+\.\s+\*+/, '').replace(/\*+:?\s*$/, '').trim(),
          amount: null,
          dueDate: null,
          status: null,
          link: null
        };
      } else if (currentPayment) {
        // Extraer monto
        const amountMatch = line.match(/Monto:\s*\*?\$?([0-9,]+(?:\.[0-9]+)?)\s*ARS\*?/i);
        if (amountMatch) {
          currentPayment.amount = amountMatch[1];
        }

        // Extraer fecha de vencimiento
        const dateMatch = line.match(/Vencimiento:\s*\*?([^*\n]+?)\*?(?:\s*\(|$)/i);
        if (dateMatch) {
          currentPayment.dueDate = dateMatch[1].trim();
        }

        // Extraer estado
        const statusMatch = line.match(/Estado:\s*\*?([^*\n]+)\*?/i);
        if (statusMatch) {
          currentPayment.status = statusMatch[1].trim();
        }

        // Extraer link
        const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          currentPayment.link = linkMatch[2];
          currentPayment.linkText = linkMatch[1];
        }
      } else if (!line.match(/^\d+\.\s+\*/) && line.trim() && !introText) {
        introText += line + ' ';
      }
    });

    // Agregar el último pago
    if (currentPayment) {
      payments.push(currentPayment);
    }

    if (payments.length > 0) {
      return (
        <div>
          {introText && (
            <p className="text-white/80 mb-4 leading-relaxed">{introText.trim()}</p>
          )}

          <div className="space-y-3">
            {payments.map((payment, idx) => {
              // Determinar si está vencido o próximo a vencer
              const isOverdue = payment.status?.toLowerCase().includes('pendiente');
              
              return (
                <div 
                  key={idx} 
                  className={`rounded-2xl p-4 border ${
                    isOverdue 
                      ? 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20' 
                      : 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isOverdue ? 'bg-red-500/20' : 'bg-orange-500/20'
                    }`}>
                      <AlertCircle className={`w-5 h-5 ${isOverdue ? 'text-red-400' : 'text-orange-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-base mb-1">{payment.title}</h4>
                      {payment.status && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isOverdue 
                            ? 'bg-red-500/20 text-red-300' 
                            : 'bg-orange-500/20 text-orange-300'
                        }`}>
                          {payment.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Monto y Fecha */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {payment.amount && (
                      <div className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-white/50 text-xs mb-1">Monto</p>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <p className="text-white font-bold text-lg">
                            {parseFloat(payment.amount.replace(/,/g, '')).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-white/40 text-xs">ARS</p>
                        </div>
                      </div>
                    )}

                    {payment.dueDate && (
                      <div className="bg-white/5 rounded-lg p-2.5">
                        <p className="text-white/50 text-xs mb-1">Vencimiento</p>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <p className="text-white font-medium text-sm">
                            {payment.dueDate}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botón de factura */}
                  {payment.link && (
                    <a
                      href={payment.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5 font-medium text-sm transition-colors ${
                        isOverdue
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20'
                          : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/20'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {payment.linkText || 'Ver Factura'}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return renderMarkdown(text);
  };

  // Renderizar análisis de gastos
  const renderExpenseAnalysis = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const categories = [];
    let introText = '';
    let totalAmount = null;

    lines.forEach(line => {
      // Detectar total de gastos
      const totalMatch = line.match(/\*{1,2}Gastos? Totales?[^:]*:\*{1,2}\s*\$([0-9,]+(?:\.[0-9]+)?)\s*ARS/i);
      if (totalMatch) {
        totalAmount = totalMatch[1];
        return;
      }

      // Detectar categorías con formato: * **Categoría:** $MONTO ARS o - Categoría: $MONTO ARS
      const categoryMatch = line.match(/^[*\-•]\s*\*{0,2}([^:*]+?)\*{0,2}:\s*\$([0-9,]+(?:\.[0-9]+)?)\s*ARS(.*)$/);
      if (categoryMatch) {
        const [, category, amount, details] = categoryMatch;
        categories.push({
          name: category.trim(),
          details: details.trim().replace(/^\(|\)$/g, ''),
          amount: amount
        });
      } else if (!line.match(/^\*{1,2}[^*]+\*{1,2}:?\s*$/) && !line.startsWith('*') && !line.startsWith('-') && !line.startsWith('•') && !totalAmount) {
        introText += line + ' ';
      }
    });

    if (categories.length > 0) {
      return (
        <div>
          {introText && (
            <p className="text-white/80 mb-4 leading-relaxed">{introText.trim()}</p>
          )}

          {/* Total destacado */}
          {totalAmount && (
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 rounded-2xl p-5 mb-4">
              <p className="text-white/60 text-sm mb-2">Total de Gastos</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  ${parseFloat(totalAmount.replace(/,/g, '')).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-lg text-white/50">ARS</span>
              </div>
            </div>
          )}
          
          {/* Detalle por categoría */}
          {categories.length > 0 && (
            <div>
              <h4 className="text-white/70 text-sm font-medium mb-3 uppercase tracking-wide">Detalle por Categoría</h4>
              <div className="grid gap-3">
                {categories.map((cat, idx) => {
                  const colors = [
                    'from-blue-500/10 to-blue-600/5 border-blue-500/20',
                    'from-purple-500/10 to-purple-600/5 border-purple-500/20',
                    'from-pink-500/10 to-pink-600/5 border-pink-500/20',
                    'from-orange-500/10 to-orange-600/5 border-orange-500/20',
                    'from-green-500/10 to-green-600/5 border-green-500/20',
                    'from-red-500/10 to-red-600/5 border-red-500/20',
                    'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
                    'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20',
                  ];
                  
                  const colorClass = colors[idx % colors.length];
                  
                  return (
                    <div key={idx} className={`bg-gradient-to-r ${colorClass} border rounded-xl p-4 hover:scale-[1.02] transition-transform`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">{cat.name}</h4>
                          {cat.details && (
                            <p className="text-white/70 text-sm">{cat.details}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-white/10 rounded-lg px-3 py-1.5 flex-shrink-0">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-white font-bold text-lg">
                            ${parseFloat(cat.amount.replace(/,/g, '')).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Pregunta final */}
          {lines.filter(line => 
            !line.match(/^[*\-•]\s*\*{0,2}[^:]+\*{0,2}:/) && 
            !line.match(/\*{1,2}Gastos? Totales?/i) &&
            !line.match(/\*{1,2}Detalle por Categoría/i) &&
            line.trim() && 
            !introText.includes(line)
          ).map((line, idx) => (
            <p key={idx} className="text-white/70 mt-4 text-sm leading-relaxed">{line}</p>
          ))}
        </div>
      );
    }

    return renderMarkdown(text);
  };

  // Renderizar tarjetas bancarias
  const renderBankCards = (text) => {
    const sections = text.split(/\d+\.\s+\*/); // Divide por "1. *", "2. *"
    const cards = [];

    // Helper to parse currency strings that might be in AR format (1.234,56) or US format (1,234.56)
    const parseCurrencyValue = (str) => {
        if (!str) return 0;
        // Check for AR format: contains dot as thousands and comma as decimal (or just comma as decimal)
        // Heuristic: if it has comma and dot, and last separator is comma -> AR
        // If it has only comma and it is used as decimal -> AR (e.g. 100,50)
        
        let cleanStr = str.trim();
        
        // Remove symbols if any captured
        cleanStr = cleanStr.replace(/[$\s]/g, '');

        // Detect format
        const hasComma = cleanStr.includes(',');
        const hasDot = cleanStr.includes('.');

        if (hasComma && hasDot) {
            const lastDotIndex = cleanStr.lastIndexOf('.');
            const lastCommaIndex = cleanStr.lastIndexOf(',');
            
            if (lastCommaIndex > lastDotIndex) {
                // AR Format: 1.234,56 -> Remove dots, replace comma with dot
                return parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
            } else {
                // US Format: 1,234.56 -> Remove commas
                return parseFloat(cleanStr.replace(/,/g, ''));
            }
        } else if (hasComma) {
            // Only comma. Could be 1,234 (US thousands) or 12,34 (AR decimal)
            // Usually in this context (ARS), comma is decimal.
            // But let's check if there are multiple commas? No.
            // Assume AR decimal if no dots present, OR US thousands if no decimals?
            // Context is ARS, so mostly likely comma is decimal.
            return parseFloat(cleanStr.replace(',', '.'));
        } else {
            // Only dots or neither. 
            // If dots: 1.234 (AR thousands) or 1.23 (US decimal).
            // Ambiguous. 
            // Given "ARS", likely 1.234 is thousands.
            // But 10.50 is common too.
            // Let's stick to standard parseFloat for dot-only unless we are sure.
            // Actually, best effort:
            return parseFloat(cleanStr);
        }
    };

    sections.forEach((section, idx) => {
      if (!section.trim()) return;

      // Extraer información - Improved regex to capture full numbers including dots and commas
      const cardName = section.match(/Resumen de tu tarjeta\s+([^*]+)\*/)?.[1]?.trim();
      const saldoMatch = section.match(/Saldo actual:\s+\*?\$?([0-9.,]+)\*?\s*ARS/);
      const pagosMatch = section.match(/Pagos[^:]*:\s+\*?\$?([0-9.,]+)\*?\s*ARS/);
      const consumosMatch = section.match(/Consumos[^:]*:\s+\*?\$?([0-9.,]+)\*?\s*ARS/);
      const fechaPago = section.match(/Fecha del último pago[^:]*:\s+\*?([^*\n]+)\*?/)?.[1]?.trim();
      const linkFactura = section.match(/\[Factura[^\]]*\]\s*\(([^)]+)\)/)?.[1];

      const saldo = saldoMatch ? saldoMatch[1] : null;
      const pagos = pagosMatch ? pagosMatch[1] : null;
      const consumos = consumosMatch ? consumosMatch[1] : null;

      if (cardName) {
        // Filter Logic:
        // Show ONLY if pending.
        // Pending = Saldo > 0 AND (Pagos < Saldo)
        // Also consider "Fecha del último pago" if it implies full payment, but checking amounts is safer.
        
        const saldoVal = parseCurrencyValue(saldo);
        const pagosVal = parseCurrencyValue(pagos);
        
        // Tolerance for floating point diff
        const isPaid = saldoVal > 0 && pagosVal >= (saldoVal - 100);
        
        // If it's effectively paid, skip it
        if (isPaid) return;

        const isVisa = cardName.toLowerCase().includes('visa');
        const isMasterCard = cardName.toLowerCase().includes('master');
        
        cards.push(
          <div key={idx} className="mb-4 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl p-5 border border-white/10 shadow-xl">
            {/* Header de la tarjeta */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isVisa ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                isMasterCard ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{cardName}</h3>
                <p className="text-white/50 text-sm">Resumen mensual</p>
              </div>
            </div>

            {/* Saldo principal */}
            {saldo && (
              <div className="bg-white/5 rounded-xl p-4 mb-3">
                <p className="text-white/60 text-sm mb-1">Saldo Actual</p>
                <p className="text-3xl font-bold text-white">
                  ${saldoVal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  <span className="text-lg text-white/50 ml-2">ARS</span>
                </p>
              </div>
            )}

            {/* Grid de información */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {pagos && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-green-400" />
                    <p className="text-white/60 text-xs">Pagos</p>
                  </div>
                  <p className="text-green-400 font-semibold text-lg">
                    ${pagosVal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {consumos && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                    <p className="text-white/60 text-xs">Consumos</p>
                  </div>
                  <p className="text-red-400 font-semibold text-lg">
                    ${parseCurrencyValue(consumos).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>

            {/* Fecha de pago */}
            {fechaPago && (
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 mb-3">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-white/50 text-xs">Último pago</p>
                  <p className="text-white text-sm font-medium">{fechaPago}</p>
                </div>
              </div>
            )}

            {/* Link a factura */}
            {linkFactura && (
              <a
                href={linkFactura}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg px-4 py-2 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Factura
              </a>
            )}
          </div>
        );
      }
    });

    if (cards.length > 0) {
      return (
        <div>
          {text.match(/^[^*\d]+/)?.[0] && (
            <p className="text-white/80 mb-4">{text.match(/^[^*\d]+/)?.[0].trim()}</p>
          )}
          {cards}
        </div>
      );
    }

    return renderMarkdown(text);
  };


  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#09090b] text-white h-[100dvh]">
      {/* Header estilo Gemini - Modernizado */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">Asistente Financiero</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs text-zinc-400 font-medium">En línea</span>
              </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón limpiar conversación */}
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="w-9 h-9 rounded-full hover:bg-white/5 transition-colors flex items-center justify-center group"
              title="Limpiar conversación"
            >
              <RotateCcw className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
            </button>
          )}
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center group"
          >
            <X className="w-5 h-5 text-zinc-400 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Messages Area - Con padding inferior para el input fijo */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl mx-auto w-full scrollbar-hide pb-32">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-0 animate-in fade-in zoom-in duration-500 fill-mode-forwards" style={{animationDelay: '100ms', opacity: 1}}>
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 flex items-center justify-center mb-2 ring-1 ring-white/5 shadow-2xl">
                    <Bot className="w-10 h-10 text-cyan-400/80" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-xl font-medium text-white">¿En qué puedo ayudarte?</h3>
                  <p className="text-sm text-zinc-500">
                    Puedo analizar tus gastos, mostrarte resúmenes pendientes o darte consejos financieros.
                  </p>
                </div>
                
                {/* Sugerencias rápidas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-4">
                  {['Resúmenes pendientes', 'Gastos del mes', 'Analizar última factura', 'Consejo de ahorro'].map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-4 py-3 bg-[#18181b] hover:bg-[#27272a] border border-white/5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 transition-all text-left truncate"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
            </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {message.type === 'user' ? (
              // Mensaje del usuario - Burbuja moderna
              <div className="flex justify-end mb-6">
                <div className="bg-[#2a2a2a] rounded-[2rem] rounded-tr-md px-6 py-4 max-w-[85%] border border-white/5 shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {message.image && (
                    <img 
                      src={message.image} 
                      alt="Adjunto" 
                      className="rounded-xl mb-3 max-w-full border border-white/10 shadow-sm"
                    />
                  )}
                  <p className="text-[15px] text-white/95 whitespace-pre-wrap break-words relative z-10 leading-relaxed font-light">
                    {message.text}
                  </p>
                </div>
              </div>
            ) : (
              // Mensaje del agente - Estilo limpio
              <div className="flex gap-4 items-start mb-6 group">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex-shrink-0 mt-1 shadow-lg shadow-cyan-500/20 ring-2 ring-black">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 pt-1 min-w-0">
                  <div className="text-[15px] text-zinc-300 leading-relaxed font-light">
                    {renderFormattedContent(message.text)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator - Emoji giratorio */}
        {isLoading && (
          <div className="flex gap-4 items-start animate-pulse">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1f1f1f] flex-shrink-0">
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <div className="flex-1 pt-1">
              <span className="text-[15px] text-white/50">Generando respuesta...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>


      {/* Input Area - Flotante y Fijo abajo */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 md:pb-4 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent z-[70]">
        <div className="max-w-4xl mx-auto w-full relative">
          {/* Preview de imagen */}
          {imagePreview && (
            <div className="absolute bottom-full left-0 mb-3 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
              <div className="relative group">
                <img src={imagePreview} alt="Preview" className="rounded-xl max-h-32 border border-white/10 shadow-2xl" />
              <button
                onClick={clearImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all shadow-lg text-zinc-400"
              >
                  <X className="w-3 h-3" />
              </button>
              </div>
            </div>
          )}
          
          <div className="flex items-end gap-2 bg-[#18181b] rounded-[1.5rem] p-2 border border-white/10 focus-within:border-cyan-500/30 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all shadow-2xl">
            {/* Botones de adjunto */}
             <div className="flex items-center gap-1 pb-1 pl-1">
                <button
                onClick={handleFileClick}
                disabled={isLoading}
                className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors disabled:opacity-50 text-zinc-400 hover:text-cyan-400"
                title="Subir imagen"
                >
                <ImageIcon className="w-5 h-5" />
                </button>
                
                <button
                onClick={handleCameraClick}
                disabled={isLoading}
                className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors disabled:opacity-50 text-zinc-400 hover:text-cyan-400"
                title="Usar cámara"
                >
                <Camera className="w-5 h-5" />
                </button>
            </div>

            {/* Input ocultos para archivos */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Textarea Auto-resizable */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              rows="1"
              disabled={isLoading}
              className="flex-1 bg-transparent px-2 py-3 text-white placeholder-zinc-500 focus:outline-none resize-none disabled:opacity-50 text-[16px] max-h-[120px] leading-relaxed !ring-0 !shadow-none !border-none"
              style={{
                minHeight: '48px',
                boxShadow: 'none'
              }}
            />

            {/* Botón enviar */}
            <button
              onClick={() => handleSendMessage()}
              disabled={(!inputValue.trim() && !selectedImage) || isLoading}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all mb-0.5 ${
                  (!inputValue.trim() && !selectedImage) || isLoading 
                  ? 'bg-transparent text-zinc-600' 
                  : 'bg-white text-black hover:bg-cyan-50 hover:shadow-lg hover:shadow-cyan-500/20'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Texto disclaimer */}
          <p className="text-[10px] text-zinc-600 mt-2 text-center font-medium tracking-wide">
            IA generativa • Puede cometer errores
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialAgentChat;
