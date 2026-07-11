import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Calendar as CalendarIcon, 
  Type, 
  FileText, 
  Paperclip, 
  Delete,
  X,
  Loader2
} from 'lucide-react';

const NumericKeypad = ({ onKeyPress, onDelete, onSubmit, isSubmitting }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'];
  return (
    <div className="bg-[#1a1a1a] rounded-t-3xl p-4 pb-8 animate-in slide-in-from-bottom duration-300">
      <div className="grid grid-cols-3 gap-4 mb-4">
        {keys.map(key => (
          <button
            key={key}
            onClick={() => key === 'DEL' ? onDelete() : onKeyPress(key)}
            disabled={isSubmitting}
            className={`
              h-14 rounded-full text-2xl font-medium transition-colors
              ${key === 'DEL' 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-[#2a2a2a] text-white hover:bg-[#333] active:bg-[#404040]'
              }
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {key === 'DEL' ? <Delete className="w-6 h-6 mx-auto" /> : key}
          </button>
        ))}
      </div>
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className={`w-full py-4 bg-[#5ce1e6] hover:bg-[#4bccd0] text-black font-bold rounded-2xl text-lg transition-all shadow-lg shadow-teal-500/10 active:scale-[0.98] flex items-center justify-center gap-2
          ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
        `}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : (
          'Agregar transacción'
        )}
      </button>
    </div>
  );
};

export const TransactionModal = ({ isOpen, onClose, onSave, categories, paymentMethods, transaction }) => {
  const getLocalISODate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    tipo: transaction?.tipo || 'gasto',
    descripcion: transaction?.descripcion || '',
    monto: transaction?.monto || '',
    fecha_transaccion: transaction?.fecha_transaccion || transaction?.fecha || getLocalISODate(),
    categoria_id: transaction?.categoria_id || '',
    metodo_pago_id: transaction?.metodo_pago_id || '',
    notas: transaction?.notas || '',
    comprobante: transaction?.comprobante || ''
  });

  const [showKeypad, setShowKeypad] = useState(false);
  const [errors, setErrors] = useState({});
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);

  // Update form data when transaction prop changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        tipo: transaction.tipo || 'gasto',
        descripcion: transaction.descripcion || '',
        monto: transaction.monto || '',
        fecha_transaccion: transaction.fecha_transaccion || transaction.fecha || getLocalISODate(),
        categoria_id: transaction.categoria_id || '',
        metodo_pago_id: transaction.metodo_pago_id || '',
        notas: transaction.notas || '',
        comprobante: transaction.comprobante || ''
      });
    } else {
      // Reset to default if no transaction (new mode)
      setFormData({
        tipo: 'gasto',
        descripcion: '',
        monto: '',
        fecha_transaccion: getLocalISODate(),
        categoria_id: '',
        metodo_pago_id: '',
        notas: '',
        comprobante: ''
      });
    }
  }, [transaction]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleKeypadPress = (key) => {
    const currentMonto = formData.monto.toString();
    if (key === '.' && currentMonto.includes('.')) return;
    setFormData(prev => ({ ...prev, monto: currentMonto + key }));
  };

  const handleKeypadDelete = () => {
    setFormData(prev => ({ ...prev, monto: prev.monto.toString().slice(0, -1) }));
  };

  /**
   * 🖼️ Comprime imágenes que excedan 2MB
   */
  const compressImage = async (file) => {
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size <= MAX_SIZE_BYTES || !file.type.startsWith('image/') || file.type === 'application/pdf') {
      return file;
    }

    console.log(`🔄 Comprimiendo imagen de ${(file.size / 1024 / 1024).toFixed(2)}MB...`);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let width = img.width;
          let height = img.height;
          const maxDimension = 1920;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const tryCompress = (quality) => {
            canvas.toBlob(
              (blob) => {
                if (blob.size <= MAX_SIZE_BYTES || quality <= 0.3) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  console.log(`✅ Comprimido: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                  resolve(compressedFile);
                } else {
                  tryCompress(quality - 0.1);
                }
              },
              'image/jpeg',
              quality
            );
          };

          tryCompress(0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // 🖼️ Comprimir imagen si excede 2MB
        const processedFile = await compressImage(file);

        // Upload logic using apiServices (similar to FileUpload component)
        const uploadFormData = new FormData();
        uploadFormData.append('file', processedFile);
        
        // We'll use a direct fetch since apiServices might not expose raw upload easily if not wrapped
        // But checking apiServices.filesApi usually exposes upload or we can use the same endpoint logic
        // Let's reuse the logic from FileUpload component but simplified here
        const baseUrl = import.meta.env.MODE === 'production' ? '' : 'http://localhost:8000';
        const endpoint = `${baseUrl}/api/files/upload?prefix=comprobantes`;
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(endpoint, {
          method: 'POST',
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: uploadFormData,
        });

        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        const fileUrl = data.data?.file_url || data.data?.url || data.file_url || data.url;
        
        handleChange('comprobante', fileUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error al subir archivo');
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.descripcion) newErrors.descripcion = 'Requerido';
    if (!formData.monto || parseFloat(formData.monto) <= 0) newErrors.monto = 'Requerido';
    if (!formData.categoria_id) newErrors.categoria_id = 'Requerido';
    
    // Si no está visible el método de pago (opciones ocultas), quizás queramos asignarle uno por defecto
    // o simplemente validarlo igual. Validémoslo para asegurar consistencia.
    if (!formData.metodo_pago_id) newErrors.metodo_pago_id = 'Requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (validate()) {
      try {
        setIsSubmitting(true);
        await onSave(formData);
      } catch (error) {
        console.error('Error saving transaction:', error);
      } finally {
        setIsSubmitting(false);
      }
      
      // Don't close here, let parent handle it (or keep open for consecutive adds)
      // But typically we close on mobile.
      // If adding consecutively, parent handles reset.
    }
  };

  if (!isOpen) return null;

  const selectedCategory = categories?.find(c => c.id.toString() === formData.categoria_id.toString());
  
  // Helper to get time (mocked as current time if today, or 00:00)
  const getDisplayTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] bg-[#0f151a] sm:rounded-3xl sm:border sm:border-gray-800 shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-white">{transaction ? 'Editar Transacción' : 'Agregar transacción'}</h2>
          <div className="w-10" />
        </div>

        {/* Tabs - Modern Pill Style */}
        <div className="px-6 mt-2">
          <div className="flex w-full bg-[#162028] p-1 rounded-full">
            <button
              onClick={() => handleChange('tipo', 'gasto')}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-all rounded-full ${
                formData.tipo === 'gasto' 
                  ? 'bg-[#2a2a2a] text-red-400 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className={formData.tipo === 'gasto' ? 'text-red-400' : 'text-gray-500'}>▼</span> Gasto
            </button>
            <button
              onClick={() => handleChange('tipo', 'ingreso')}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-all rounded-full ${
                formData.tipo === 'ingreso' 
                  ? 'bg-[#2a2a2a] text-green-400 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className={formData.tipo === 'ingreso' ? 'text-green-400' : 'text-gray-500'}>▲</span> Ingreso
            </button>
          </div>
        </div>

        {/* Main Content Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 scrollbar-hide">
          
          {/* Hero Section: Icon & Amount */}
          <div className="flex items-center justify-between gap-4 py-2">
            {/* Category Icon */}
            <div className="w-14 h-14 rounded-[1.5rem] bg-[#1e293b] flex items-center justify-center text-2xl shrink-0 border border-gray-800 shadow-inner">
              {selectedCategory?.icono || <ShoppingBag className="w-7 h-7 text-yellow-500" />}
            </div>
            
            {/* Amount Input */}
            <div className="flex-1 text-right relative">
              <div 
                onClick={() => setShowKeypad(true)}
                className="text-4xl font-bold text-white cursor-text min-h-[3rem] flex justify-end items-center tracking-tight"
              >
                <span className="text-gray-500 mr-1 text-3xl">$</span>
                {formData.monto || '0'}
              </div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-1">
                {formData.tipo === 'gasto' ? 'Compras' : 'Ingresos'}
              </p>
            </div>
          </div>

          {/* Date & Time Bar */}
          <div className="flex items-center justify-between bg-[#162028] rounded-[1.5rem] px-5 py-3">
            <div className="flex items-center gap-3 text-white font-medium">
              <div className="p-2 bg-white/5 rounded-full">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input 
                 type="date"
                 value={formData.fecha_transaccion}
                 onChange={(e) => handleChange('fecha_transaccion', e.target.value)}
                 className="bg-transparent text-white focus:outline-none font-bold w-full text-sm uppercase tracking-wide"
              />
            </div>
            <div className="bg-[#0f151a] px-3 py-1.5 rounded-full text-white font-mono text-xs border border-gray-800">
              {getDisplayTime()}
            </div>
          </div>

          {/* Inputs Section */}
          <div className="space-y-3">
            {/* Title / Description */}
            <div className="bg-[#162028] rounded-[1.5rem] flex items-center px-5 py-3.5 focus-within:ring-1 focus-within:ring-teal-500/50 transition-colors">
              <input 
                type="text"
                placeholder="Título"
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                className="bg-transparent w-full text-white placeholder-gray-500 focus:outline-none text-base font-medium"
              />
              <Type className="w-5 h-5 text-gray-500 ml-2" />
            </div>

            {/* Notes */}
            <div className="bg-[#162028] rounded-[1.5rem] px-5 py-3.5 focus-within:ring-1 focus-within:ring-teal-500/50 transition-colors min-h-[90px] flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Notas</span>
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <textarea
                value={formData.notas}
                onChange={(e) => handleChange('notas', e.target.value)}
                className="bg-transparent w-full text-white placeholder-gray-600 focus:outline-none resize-none flex-1 text-sm leading-relaxed"
                placeholder="Detalles adicionales..."
              />
            </div>

            {/* Attachment Button */}
            <div className="w-full">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect}
                accept="image/*,application/pdf"
              />
              
              {!formData.comprobante ? (
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[#162028] rounded-[1.5rem] px-5 py-3 flex items-center justify-between text-gray-400 hover:text-white hover:bg-[#1f2937] transition-colors group"
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <div className="p-1.5 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    Adjuntar comprobante
                  </span>
                  <span className="text-xl font-light text-gray-600 group-hover:text-gray-400">+</span>
                </button>
              ) : (
                <div className="w-full bg-[#162028] rounded-[1.5rem] px-5 py-3 flex items-center justify-between border border-teal-500/30">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Paperclip className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-sm text-teal-400 truncate max-w-[200px]">
                      Adjunto cargado
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleChange('comprobante', '')}
                    className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Category Selection - Horizontal Scroll */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3 px-1">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Categoría</label>
                <button 
                  type="button" 
                  onClick={() => setShowMoreOptions(!showMoreOptions)} 
                  className="text-xs text-teal-400 font-medium hover:text-teal-300"
                >
                  {showMoreOptions ? 'Ver menos' : 'Ver todas'}
                </button>
              </div>
              
              <div className="flex overflow-x-auto pb-4 gap-3 snap-x no-scrollbar -mx-6 px-6">
                {categories?.filter(c => c.tipo === formData.tipo || !c.tipo).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleChange('categoria_id', cat.id)}
                    className={`flex-none w-24 aspect-[4/3] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all snap-start ${
                      formData.categoria_id.toString() === cat.id.toString() 
                        ? 'bg-teal-500/20 border-2 border-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] scale-105' 
                        : 'bg-[#162028] text-gray-400 hover:bg-[#1f2937] border border-transparent'
                    }`}
                  >
                    <span className="text-2xl filter drop-shadow-md">{cat.icono || '📁'}</span>
                    <span className="text-[11px] font-medium truncate w-full text-center px-1 leading-tight">{cat.nombre}</span>
                  </button>
                ))}
                {/* Add Category Button */}
                <button
                  type="button"
                  className="flex-none w-24 aspect-[4/3] rounded-2xl flex flex-col items-center justify-center gap-2 bg-[#162028]/50 text-gray-500 hover:bg-[#1f2937] border-2 border-dashed border-gray-700 hover:border-gray-500 transition-all snap-start"
                >
                  <span className="text-2xl font-light">+</span>
                  <span className="text-[11px] font-medium">Nueva</span>
                </button>
              </div>
            </div>

            {/* Payment Method Selection - Horizontal Scroll */}
            <div className="mt-2">
              <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 px-1">Método de Pago</label>
              <div className="flex overflow-x-auto pb-4 gap-3 snap-x no-scrollbar -mx-6 px-6">
                {paymentMethods?.map(pm => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => handleChange('metodo_pago_id', pm.id)}
                    className={`flex-none w-32 p-3 rounded-2xl flex items-center gap-3 transition-all snap-start ${
                      formData.metodo_pago_id.toString() === pm.id.toString() 
                        ? 'bg-teal-500/20 border-2 border-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.2)]' 
                        : 'bg-[#162028] text-gray-400 hover:bg-[#1f2937] border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-sm shrink-0">
                      {pm.icono || '💳'}
                    </div>
                    <span className="text-xs font-medium truncate">{pm.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Errors */}
            {(errors.descripcion || errors.monto || errors.categoria_id || errors.metodo_pago_id) && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                  Por favor completa los campos requeridos (Monto, Título, Categoría, Método de Pago)
                </div>
            )}
          </div>
          
          <div className="h-24" /> {/* Spacer for keypad/footer */}
        </div>

        {/* Footer / Keypad */}
        {showKeypad ? (
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <div className="flex justify-center bg-[#1a1a1a] border-t border-gray-800 pt-2">
               <button onClick={() => setShowKeypad(false)} className="mb-2 p-1 bg-gray-800 rounded-full">
                 <X className="w-4 h-4 text-gray-400" />
               </button>
            </div>
            <NumericKeypad 
              onKeyPress={handleKeypadPress}
              onDelete={handleKeypadDelete}
              onSubmit={(e) => {
                setShowKeypad(false);
                if (!formData.categoria_id && !showMoreOptions) {
                   setShowMoreOptions(true);
                } else {
                   handleSubmit(e);
                }
              }}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          <div className="p-4 bg-[#0f151a] border-t border-gray-800 shrink-0">
            <button
              onClick={(e) => {
                if (!formData.monto) {
                  setShowKeypad(true);
                } else if (!formData.categoria_id) {
                  // Scroll to category or open more options
                  if (!showMoreOptions) setShowMoreOptions(true);
                } else {
                  handleSubmit(e);
                }
              }}
              disabled={isSubmitting}
              className={`w-full py-4 bg-[#5ce1e6] hover:bg-[#4bccd0] text-black font-bold rounded-2xl text-lg transition-all shadow-lg shadow-teal-500/10 active:scale-[0.98] flex items-center justify-center gap-2
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {transaction ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                !formData.monto ? 'Ingresar la cantidad' : (!formData.categoria_id ? 'Selecciona una categoría' : (transaction ? 'Actualizar' : 'Agregar transacción'))
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
