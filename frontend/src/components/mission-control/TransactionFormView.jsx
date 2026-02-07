import React, { useState, useEffect } from 'react';
import { Calendar, Tag, CreditCard, FileText, TrendingUp, TrendingDown, Type, Paperclip, Trash2, Clock } from 'lucide-react';
import FileUpload from '../FileUpload/FileUpload';

export const TransactionFormView = ({ transaction, categories, paymentMethods, onSave, onCancel }) => {
  const getLocalISODate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    fecha: getLocalISODate(),
    tipo: 'gasto',
    categoria_id: '',
    metodo_pago_id: '',
    notas: '',
    comprobante: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (transaction) {
      // Support multiple field formats (uppercase/lowercase)
      const descripcion = transaction.Descripcion || transaction.descripcion || '';
      const monto = transaction.Monto || transaction.monto || '';
      const fechaField = transaction.FechaTransaccion || transaction.fecha_transaccion || transaction.fecha;
      const fecha = fechaField ? fechaField.split('T')[0] : getLocalISODate();
      const tipo = (transaction.Tipo || transaction.tipo || 'gasto').toLowerCase();
      const categoria_id = transaction.categorias_id || transaction.categoria_id ||
        transaction.Categorias?.Id || transaction.Categorias?.id || '';
      const metodo_pago_id = transaction.metodos_pago_id || transaction.metodo_pago_id ||
        transaction.MetodosPago?.Id || transaction.MetodosPago?.id || '';
      const notas = transaction.Notas || transaction.notas || '';
      const comprobante = transaction.Comprobante || transaction.comprobante || transaction.ArchivoAdjunto || transaction.archivo_adjunto || transaction.archivoAdjunto || '';

      setFormData({
        descripcion,
        monto,
        fecha,
        tipo,
        categoria_id,
        metodo_pago_id,
        notas,
        comprobante
      });
    }
  }, [transaction]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Validar descripción
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }
    
    // Validar monto (debe ser positivo)
    const monto = parseFloat(formData.monto);
    if (!formData.monto || isNaN(monto)) {
      newErrors.monto = 'El monto es requerido';
    } else if (monto <= 0) {
      newErrors.monto = 'Debe ser mayor que 0';
    }
    
    // Validar otros campos
    if (!formData.fecha) newErrors.fecha = 'La fecha es requerida';
    if (!formData.categoria_id) newErrors.categoria_id = 'Selecciona una categoría';
    if (!formData.metodo_pago_id) newErrors.metodo_pago_id = 'Selecciona un método de pago';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...formData,
        monto: parseFloat(formData.monto),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      
      {/* 1. Header & Type Selector */}
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => handleChange('tipo', 'gasto')}
          className={`flex-1 py-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
            formData.tipo === 'gasto'
              ? 'border-red-500/50 bg-red-500/10 text-red-400'
              : 'border-white/5 bg-[#1a1a1a] text-white/40 hover:bg-white/5'
          }`}
        >
          <TrendingDown className="w-5 h-5" />
          <span className="font-bold text-sm">Gasto</span>
        </button>

        <button
          type="button"
          onClick={() => handleChange('tipo', 'ingreso')}
          className={`flex-1 py-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
            formData.tipo === 'ingreso'
              ? 'border-green-500/50 bg-green-500/10 text-green-400'
              : 'border-white/5 bg-[#1a1a1a] text-white/40 hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="font-bold text-sm">Ingreso</span>
        </button>
      </div>

      {/* 2. Main Amount Input */}
      <div className="flex flex-col items-center justify-center mb-8 relative">
        <div className="relative">
            <span className={`absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 text-4xl font-bold mr-2 ${formData.tipo === 'gasto' ? 'text-white' : 'text-green-400'}`}>$</span>
            <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.monto}
            onChange={(e) => handleChange('monto', e.target.value)}
            placeholder="0"
            className={`bg-transparent text-6xl font-bold text-center w-48 outline-none placeholder-white/20 ${
              errors.monto ? 'text-red-400' : formData.tipo === 'gasto' ? 'text-white' : 'text-green-400'
            }`}
            autoFocus
            required
            />
        </div>
        <p className="text-white/40 text-sm mt-2 font-medium">Monto de la transacción</p>
        {errors.monto && (
          <p className="text-red-400 text-xs mt-1 absolute -bottom-5 animate-pulse">
            ⚠️ {errors.monto}
          </p>
        )}
      </div>

      {/* 3. Date & Time Row */}
      <div className="flex justify-center gap-3 mb-8">
        <div className="bg-[#1a1a1a] rounded-[1.5rem] px-5 py-3 flex items-center gap-2 text-white/80">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <input 
                type="date" 
                value={formData.fecha}
                onChange={(e) => handleChange('fecha', e.target.value)}
                className="bg-transparent outline-none text-sm font-medium w-full"
            />
        </div>
        <div className="bg-[#1a1a1a] rounded-[1.5rem] px-5 py-3 flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4 text-white/40" />
            <span className="text-sm font-medium">12:00</span>
        </div>
      </div>

      {/* 4. Form Fields Stack */}
      <div className="flex flex-col gap-4 flex-1">
        
        {/* Title */}
        <div className="relative group">
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Título"
              className={`w-full bg-[#1a1a1a] text-white text-base rounded-[2rem] px-6 py-5 outline-none transition-colors pl-14 ${
                errors.descripcion ? 'border border-red-500/50' : 'focus:ring-1 focus:ring-cyan-500/50'
              }`}
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30">
              <Type className="w-5 h-5" />
            </div>
        </div>

        {/* Category Selector */}
        <div className="relative group">
            <select
              value={formData.categoria_id}
              onChange={(e) => handleChange('categoria_id', e.target.value)}
              className={`w-full bg-[#1a1a1a] text-white text-base rounded-[2rem] px-6 py-5 outline-none transition-colors appearance-none cursor-pointer pl-14 ${
                errors.categoria_id ? 'border border-red-500/50' : 'focus:ring-1 focus:ring-cyan-500/50'
              }`}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.Id || cat.id} value={cat.Id || cat.id}>
                  {cat.Nombre || cat.nombre}
                </option>
              ))}
            </select>
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
              <Tag className="w-5 h-5" />
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>

        {/* Payment Method Selector */}
        <div className="relative group">
            <select
              value={formData.metodo_pago_id}
              onChange={(e) => handleChange('metodo_pago_id', e.target.value)}
              className={`w-full bg-[#1a1a1a] text-white text-base rounded-[2rem] px-6 py-5 outline-none transition-colors appearance-none cursor-pointer pl-14 ${
                errors.metodo_pago_id ? 'border border-red-500/50' : 'focus:ring-1 focus:ring-cyan-500/50'
              }`}
            >
              <option value="">Selecciona método de pago</option>
              {paymentMethods.map((method) => (
                <option key={method.Id || method.id} value={method.Id || method.id}>
                  {method.Nombre || method.nombre}
                </option>
              ))}
            </select>
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>

        {/* Notes */}
        <div className="relative group">
            <textarea
              value={formData.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              placeholder="Notas"
              rows="3"
              className="w-full bg-[#1a1a1a] text-white text-base rounded-[2rem] px-6 py-5 outline-none transition-colors focus:ring-1 focus:ring-cyan-500/50 resize-none pl-14"
            />
            <div className="absolute left-5 top-6 text-white/30 pointer-events-none">
              <FileText className="w-5 h-5" />
            </div>
        </div>

        {/* Attachment */}
        <div className="bg-[#1a1a1a] rounded-[2rem] p-4">
            <div className="flex items-center gap-3 mb-2 px-2">
                <Paperclip className="w-5 h-5 text-white/30" />
                <span className="text-white/60 text-sm">Comprobante</span>
            </div>
            
            {formData.comprobante ? (
                <div className="flex items-center justify-between bg-white/5 rounded-2xl p-3 px-4">
                    <span className="text-cyan-400 text-xs truncate max-w-[150px]">Comprobante adjunto</span>
                    <div className="flex gap-2">
                        <a href={formData.comprobante} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white text-xs underline">Ver</a>
                        <button onClick={() => handleChange('comprobante', '')} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-2">
                    <FileUpload
                        onFileUploaded={(fileData) => handleChange('comprobante', fileData.url || fileData.file_url)}
                        prefix="comprobantes"
                        maxSizeMB={10}
                    />
                </div>
            )}
        </div>

      </div>

      {/* 5. Footer Actions */}
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 rounded-[2rem] bg-[#1a1a1a] text-white font-bold text-base hover:bg-white/5 border border-white/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-4 rounded-[2rem] bg-cyan-500 text-black font-bold text-base hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-colors"
        >
          {transaction ? 'Actualizar' : 'Guardar'}
        </button>
      </div>

    </form>
  );
};
