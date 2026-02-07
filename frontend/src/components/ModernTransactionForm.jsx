import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  X,
  Check,
  CreditCard,
  Save,
  Loader2,
  ChevronDown,
  Eye,
  ExternalLink,
  Target
} from 'lucide-react';
import apiServices from '../services/api';
import dolarService, { TIPOS_DOLAR } from '../services/dolarService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import FileUpload from './FileUpload/FileUpload';

const { transaccionesApi, categoriasApi, metodosPagoApi, objetivosApi, monedasApi } = apiServices;

const ModernTransactionForm = ({ isOpen, onClose, onSuccess, editingTransaction }) => {
  const [transactionType, setTransactionType] = useState('ingreso');
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'ARS',
    category: '',
    paymentMethod: '',
    objetivo: '', // 🎯 Nuevo campo para objetivo de ahorro
    esAporteObjetivo: true, // 🎯 Si es aporte (suma) o uso (resta) del objetivo
    esCredito: false, // 💳 Si es gasto con tarjeta de crédito
    date: new Date().toISOString().split('T')[0],
    notes: '',
    archivoAdjunto: '', // URL of the attached file
    // Fields for USD conversion
    tipoDolar: 'blue', // dollar type (official, blue, mep, etc.)
    montoUsd: '', // original amount in USD
    cotizacionDolar: '', // dollar quote at the moment
    montoArs: '' // amount converted to ARS
  });

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data when form opens
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriasResponse, metodosResponse, objetivosResponse, monedasResponse] = await Promise.all([
          categoriasApi.getAll(),
          metodosPagoApi.getAll(),
          objetivosApi.getActive(), // 🎯 Cargar objetivos activos
          monedasApi.getAll({ activa: true, orden_by: 'orden' }) // 💰 Cargar monedas activas
        ]);
        
        setCategorias(categoriasResponse.list || []);
        setMetodosPago(metodosResponse.list || []);
        setObjetivos(objetivosResponse.list || objetivosResponse || []); // 🎯 Manejar respuesta con o sin .list
        setCurrencies(monedasResponse || []); // 💰 Cargar monedas
        
        // Load dollar quotes
        loadCotizaciones();
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };

    if (isOpen) {
      loadData();
      
      if (editingTransaction) {
        setTransactionType(editingTransaction.tipo || 'ingreso');
        setFormData({
          description: editingTransaction.descripcion || '',
          amount: editingTransaction.monto || '',
          currency: editingTransaction.moneda || 'ARS',
          category: editingTransaction.categoria_id || '',
          paymentMethod: editingTransaction.metodo_pago_id || '',
          objetivo: editingTransaction.objetivo_id || '', // 🎯 Cargar objetivo si existe
          esAporteObjetivo: editingTransaction.es_aporte_objetivo !== false, // 🎯 Por defecto true
          esCredito: editingTransaction.es_credito || false, // 💳 Cargar si es crédito
          date: editingTransaction.fecha_transaccion 
            ? new Date(editingTransaction.fecha_transaccion).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          notes: editingTransaction.notas || '',
          archivoAdjunto: editingTransaction.archivo_adjunto || ''
        });
      } else {
        setTransactionType('ingreso');
        setFormData({
          description: '',
          amount: '',
          currency: 'ARS',
          category: '',
          paymentMethod: '',
          objetivo: '', // 🎯 Vacío por defecto
          esAporteObjetivo: true, // 🎯 Por defecto es aporte (suma)
          esCredito: false, // 💳 Por defecto NO es crédito
          date: new Date().toISOString().split('T')[0],
          notes: '',
          archivoAdjunto: '',
          // Fields for USD conversion
          tipoDolar: 'blue',
          montoUsd: '',
          cotizacionDolar: '',
          montoArs: ''
        });
      }
    }
  }, [isOpen, editingTransaction]);

  const loadCotizaciones = async () => {
    try {
      setLoadingCotizaciones(true);
      const data = await dolarService.getAllCotizaciones();
      setCotizaciones(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoadingCotizaciones(false);
    }
  };

  // Effect to update conversion automatically
  useEffect(() => {
    if (formData.currency === 'USD' && formData.montoUsd && formData.tipoDolar) {
      const cotizacionSeleccionada = cotizaciones.find(c => c.casa === formData.tipoDolar);
      if (cotizacionSeleccionada) {
        const montoEnPesos = dolarService.convertirUsdToArs(formData.montoUsd, cotizacionSeleccionada.venta);
        setFormData(prev => ({
          ...prev,
          cotizacionDolar: cotizacionSeleccionada.venta,
          montoArs: montoEnPesos,
          amount: montoEnPesos
        }));
      }
    }
  }, [formData.montoUsd, formData.tipoDolar, cotizaciones, formData.currency]);

  // Las monedas se cargan dinámicamente desde la API (ver useEffect)

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setFormData({
      description: '',
      amount: '',
      currency: 'ARS',
      category: '',
      paymentMethod: '',
      objetivo: '', // 🎯 Reset objetivo
      esAporteObjetivo: true, // 🎯 Reset a aporte por defecto
      esCredito: false, // 💳 Reset crédito
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setTransactionType('ingreso');
    setShowCreateCategory(false);
    setNewCategoryName('');
    if (onClose) onClose();
  };

  const handleSubmit = async () => {
    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setLoading(true);

      // Validación de descripción
      if (!formData.description.trim()) {
        alert('La descripción es requerida');
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Validación de monto (debe ser positivo)
      const amount = parseFloat(formData.amount);
      if (!formData.amount || isNaN(amount)) {
        alert('El monto es requerido');
        setLoading(false);
        setIsSubmitting(false);
        return;
      }
      
      if (amount <= 0) {
        alert('El monto debe ser mayor que cero.\nNo se permiten valores negativos o cero.');
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      const transactionData = {
        descripcion: formData.description.trim(),
        monto: transactionType === 'gasto' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount)),
        moneda: formData.currency,
        monto_ars: transactionType === 'gasto' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount)),
        fecha_transaccion: formData.date,
        tipo: transactionType,
        notas: formData.notes.trim(),
        categoria_id: formData.category || null,
        metodo_pago_id: formData.paymentMethod || null,
        objetivo_id: formData.objetivo || null, // 🎯 Incluir objetivo si existe
        es_aporte_objetivo: formData.esAporteObjetivo, // 🎯 Si suma o resta del objetivo
        es_credito: transactionType === 'gasto' ? formData.esCredito : false, // 💳 Solo para gastos
        tasa_cambio: 1,
        archivo_adjunto: formData.archivoAdjunto || ''
        // incluir_en_cuota_alimentaria: false, // DEPRECATED: Causing backend error
        // gasto_compartido: false, // DEPRECATED: Causing backend error
        // objetivo_aportes: 0 // DEPRECATED: Causing backend error
      };

      if (editingTransaction && editingTransaction.id) {
        console.log('Editing transaction:', transactionData);
        await transaccionesApi.update(editingTransaction.id, transactionData);
        if (onSuccess) onSuccess({ ...transactionData, id: editingTransaction.id });
      } else {
        console.log('Creating new transaction:', transactionData);
        const result = await transaccionesApi.create(transactionData);
        if (onSuccess) onSuccess({ ...transactionData, id: result.id });
      }

      handleCancel();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction: ' + error.message);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const createQuickCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      // 🔧 Determinar el tipo de categoría basado en el tipo de transacción actual
      const tipoCategoria = formData.transactionType === 'income' ? 'ingreso' : 'gasto';
      
      const newCategory = await categoriasApi.create({
        nombre: newCategoryName.trim(),
        tipo: tipoCategoria, // ✅ Usa 'ingreso' o 'gasto' según la transacción
        color: formData.transactionType === 'income' ? '#10b981' : '#ef4444',
        icono: formData.transactionType === 'income' ? '💰' : '📁',
        activa: true
      });
      
      // Update category list
      setCategorias(prev => [...prev, newCategory]);
      
      // Select new category
      setFormData(prev => ({
        ...prev,
        category: newCategory.id
      }));
      
      // Clear new category form
      setNewCategoryName('');
      setShowCreateCategory(false);
      
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category: ' + error.message);
    }
  };
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  // Render original modal for mobile
  if (isMobile) {
  return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* ... existing mobile layout ... */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl shadow-2xl border border-zinc-800/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl p-6 border-b border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  {editingTransaction ? (
                    <FileText className="w-6 h-6 text-white" />
                  ) : (
                    <Plus className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">
                      {editingTransaction ? 'Editar' : 'Nueva Transacción'}
                  </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                      {editingTransaction ? 'Modificar detalles' : 'Registrar ingreso o gasto'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 text-zinc-400 hover:text-white transition-all duration-200 rounded-xl hover:bg-zinc-800/50 hover:scale-110"
              >
                <X size={24} />
              </button>
            </div>
          </div>

            {/* Form Content Mobile */}
          <div className="p-6 space-y-6">
              {/* Transaction Type Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTransactionType('ingreso')}
                  disabled={loading}
                  className={`relative p-4 rounded-xl border transition-all duration-300 ${
                    transactionType === 'ingreso'
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg shadow-green-500/25'
                      : 'bg-zinc-800/50 border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className={`w-5 h-5 ${transactionType === 'ingreso' ? 'text-green-400' : 'text-zinc-400'}`} />
                    <span className={`font-semibold ${transactionType === 'ingreso' ? 'text-green-400' : 'text-zinc-400'}`}>
                      Ingreso
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => setTransactionType('gasto')}
                  disabled={loading}
                  className={`relative p-4 rounded-xl border transition-all duration-300 ${
                    transactionType === 'gasto'
                      ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/50 shadow-lg shadow-red-500/25'
                      : 'bg-zinc-800/50 border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <TrendingDown className={`w-5 h-5 ${transactionType === 'gasto' ? 'text-red-400' : 'text-zinc-400'}`} />
                    <span className={`font-semibold ${transactionType === 'gasto' ? 'text-red-400' : 'text-zinc-400'}`}>
                      Gasto
                    </span>
                  </div>
                </button>
            </div>

              {/* Mobile Inputs Stack */}
              <div className="space-y-4">
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                  placeholder="Descripción"
                  className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none"
                />
                
                {/* Monto Input */}
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Monto"
                  className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none"
                  step="0.01"
                  min="0.01"
                  required
                />
                
                {/* Currency Selector - Full Width for Mobile */}
                <div className="w-full">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:border-blue-500 focus:outline-none text-base"
                  >
                    {currencies.map(currency => (
                      <option key={currency.id || currency.codigo} value={currency.codigo}>
                        {currency.simbolo} {currency.nombre} ({currency.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none"
                />

                {/* Category & Method Selects for Mobile */}
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none text-sm"
                  >
                    <option value="">Categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>

                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none text-sm"
                  >
                    <option value="">Método Pago</option>
                    {metodosPago.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>

                {/* 🎯 Objetivo de Ahorro */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Target size={16} className="text-blue-400" />
                    Objetivo de Ahorro (Opcional)
                  </label>
                  <select
                    value={formData.objetivo}
                    onChange={(e) => setFormData(prev => ({ ...prev, objetivo: e.target.value }))}
                    className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none text-sm"
                  >
                    <option value="">Sin objetivo asignado</option>
                    {objetivos.map(obj => (
                      <option key={obj.id} value={obj.id}>
                        {obj.icono} {obj.nombre} - {obj.porcentaje_completado.toFixed(0)}% completado
                      </option>
                    ))}
                  </select>
                  {formData.objetivo && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
                      <p className="text-xs text-zinc-400 font-medium">
                        ¿Cómo afecta al objetivo?
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.esAporteObjetivo}
                          onChange={(e) => setFormData(prev => ({ ...prev, esAporteObjetivo: e.target.checked }))}
                          className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-white group-hover:text-blue-400 transition-colors">
                          {formData.esAporteObjetivo ? '✅ Aporte' : '❌ Uso'} 
                          <span className="text-zinc-500 ml-1">
                            ({formData.esAporteObjetivo ? 'suma al objetivo' : 'resta del objetivo'})
                          </span>
                        </span>
                      </label>
                      <p className="text-xs text-zinc-500">
                        💡 <strong>Aporte:</strong> Para inversiones, ahorro (suma al progreso)
                        <br />
                        💡 <strong>Uso:</strong> Para gastos del objetivo (resta del progreso)
                      </p>
                    </div>
                  )}
                </div>

                {/* 💳 Tarjeta de Crédito Checkbox - Solo para GASTOS */}
                {transactionType === 'gasto' && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.esCredito}
                        onChange={(e) => setFormData(prev => ({ ...prev, esCredito: e.target.checked }))}
                        className="mt-1 w-5 h-5 rounded border-blue-500/30 bg-zinc-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-blue-300 flex items-center gap-2">
                          <CreditCard size={16} />
                          Es gasto con tarjeta de crédito
                        </span>
                        <p className="text-xs text-blue-400/70 mt-1">
                          Esta transacción no se descontará del balance inmediatamente. Se registrará como deuda de tarjeta hasta que pagues el resumen.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Notas..."
                  rows={2}
                  className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none resize-none"
                />

                {/* File Upload for Mobile */}
                <div className="w-full">
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">Comprobante</label>
                  <FileUpload
                    onFileUploaded={(fileData) => setFormData(prev => ({ ...prev, archivoAdjunto: fileData.url }))}
                    onFileRemoved={() => setFormData(prev => ({ ...prev, archivoAdjunto: '' }))}
                    currentFileUrl={formData.archivoAdjunto}
                    prefix="transacciones"
                    maxSizeMB={10}
                    showPreview={true}
                  />
                  
                  {/* Vista previa del comprobante (Mobile) */}
                  {formData.archivoAdjunto && (
                    <div className="mt-3 p-4 bg-zinc-900/50 border border-white/10 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-400">Comprobante Adjunto</span>
                        <a
                          href={formData.archivoAdjunto}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-colors text-blue-400 text-sm font-medium"
                        >
                          <Eye size={16} />
                          Ver Completo
                        </a>
                      </div>
                      
                      {/* Vista previa de imagen */}
                      {(formData.archivoAdjunto.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                        <div className="relative w-full aspect-video bg-zinc-950 rounded-lg overflow-hidden">
                          <img
                            src={formData.archivoAdjunto}
                            alt="Comprobante"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full items-center justify-center text-zinc-500">
                            <FileText size={32} />
                          </div>
                        </div>
                      )}
                      
                      {/* Ícono para archivos PDF */}
                      {(formData.archivoAdjunto.match(/\.pdf$/i)) && (
                        <div className="flex items-center justify-center py-12 text-red-400">
                          <FileText size={64} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Footer */}
          <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/50">
            <button
              onClick={handleSubmit}
              disabled={loading || isSubmitting || !formData.description.trim() || !formData.amount}
              className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading || isSubmitting ? 'Guardando...' : (editingTransaction ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP VERSION - Completely Redesigned
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleCancel}
      />
      <div 
        className="relative w-full max-w-3xl bg-[#09090b] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] z-[1001]"
      >
        {/* Desktop Header - Compact */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#09090b]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
            </h2>
          </div>
          <button 
            onClick={handleCancel}
            className="p-1.5 hover:bg-white/5 rounded-full transition-colors group"
          >
            <X className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Single Column Layout - Compact */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            <div className="space-y-4">
              
              {/* Type Selector - Compact Inline */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTransactionType('ingreso')}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    transactionType === 'ingreso'
                      ? 'bg-green-500/10 border-green-500/50 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    transactionType === 'ingreso' ? 'bg-green-500 text-white' : 'bg-zinc-800'
                  }`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Ingreso</p>
                    <p className="text-xs opacity-60">Salarios, ventas</p>
                  </div>
                </button>

                <button
                  onClick={() => setTransactionType('gasto')}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    transactionType === 'gasto'
                      ? 'bg-red-500/10 border-red-500/50 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    transactionType === 'gasto' ? 'bg-red-500 text-white' : 'bg-zinc-800'
                  }`}>
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Gasto</p>
                    <p className="text-xs opacity-60">Compras, pagos</p>
                  </div>
                </button>
              </div>

              {/* Compact 2-Column Form */}
              <div className="grid grid-cols-2 gap-3">
                {/* Monto */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Monto</label>
                  <div className="relative">
                    <span className={`absolute left-2.5 top-2.5 text-sm font-bold ${transactionType === 'gasto' ? 'text-red-400' : 'text-green-400'}`}>$</span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full pl-7 pr-2 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-lg font-bold text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                      step="0.01"
                      min="0.01"
                      autoFocus
                      required
                    />
                  </div>
                  {formData.amount && parseFloat(formData.amount) <= 0 && (
                    <p className="text-xs text-red-400 mt-1">⚠️ El monto debe ser mayor que 0</p>
                  )}
                </div>

                {/* Fecha */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Fecha</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Descripción */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Descripción</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="¿Qué transacción es esta?"
                    className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Categoría</label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if(e.target.value === 'new') setShowCreateCategory(true);
                        else setFormData(prev => ({ ...prev, category: e.target.value }));
                      }}
                      className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white appearance-none cursor-pointer focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Categoría</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      <option value="new">+ Nueva</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                {/* Método de Pago */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Método de Pago</label>
                  <div className="relative">
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white appearance-none cursor-pointer focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Método</option>
                      {metodosPago.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                {/* 🎯 Objetivo de Ahorro */}
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                    <Target size={12} />
                    Objetivo de Ahorro (Opcional)
                  </label>
                  <div className="relative">
                    <select
                      value={formData.objetivo}
                      onChange={(e) => setFormData(prev => ({ ...prev, objetivo: e.target.value }))}
                      className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white appearance-none cursor-pointer focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Sin objetivo asignado</option>
                      {objetivos.map(obj => (
                        <option key={obj.id} value={obj.id}>
                          {obj.icono} {obj.nombre} ({obj.porcentaje_completado.toFixed(0)}%)
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
                  </div>
                  {formData.objetivo && (
                    <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
                      <p className="text-[10px] text-zinc-400 font-medium">
                        ¿Cómo afecta al objetivo?
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.esAporteObjetivo}
                          onChange={(e) => setFormData(prev => ({ ...prev, esAporteObjetivo: e.target.checked }))}
                          className="w-3 h-3 rounded border-zinc-600 bg-zinc-800 text-blue-500"
                        />
                        <span className="text-[10px] text-white">
                          {formData.esAporteObjetivo ? '✅ Aporte (suma)' : '❌ Uso (resta)'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 💳 Tarjeta de Crédito Checkbox - Solo para GASTOS */}
                {transactionType === 'gasto' && (
                  <div className="col-span-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.esCredito}
                        onChange={(e) => setFormData(prev => ({ ...prev, esCredito: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded border-blue-500/30 bg-zinc-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-blue-300">
                          💳 Es gasto con tarjeta de crédito
                        </span>
                        <p className="text-xs text-blue-400/60 mt-1">
                          No se descontará del balance hasta que pagues el resumen
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Moneda Buttons */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-zinc-400 block mb-1">Moneda</label>
                  <div className="flex gap-2">
                    {currencies.map(currency => (
                      <button
                        key={currency.id || currency.codigo}
                        onClick={() => setFormData(prev => ({ ...prev, currency: currency.codigo }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          formData.currency === currency.codigo
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'
                        }`}
                        title={currency.nombre}
                      >
                        {currency.codigo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
                
              {/* Create Category Inline */}
              {showCreateCategory && (
                <div className="col-span-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nueva categoría"
                      className="flex-1 p-1.5 bg-zinc-900/80 border border-blue-500/30 rounded text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button onClick={createQuickCategory} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                      +
                    </button>
                    <button onClick={() => setShowCreateCategory(false)} className="px-2 hover:bg-white/10 text-white rounded">
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-zinc-400">Notas</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Detalles adicionales (opcional)..."
                  rows={2}
                  className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Comprobante */}
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-zinc-400">Comprobante</label>
                <FileUpload
                  onFileUploaded={(fileData) => setFormData(prev => ({ ...prev, archivoAdjunto: fileData.url }))}
                  onFileRemoved={() => setFormData(prev => ({ ...prev, archivoAdjunto: '' }))}
                  currentFileUrl={formData.archivoAdjunto}
                  prefix="transacciones"
                  maxSizeMB={10}
                  showPreview={true}
                />
                
                {/* Vista previa del comprobante */}
                {formData.archivoAdjunto && (
                  <div className="mt-3 p-3 bg-zinc-900/50 border border-white/10 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">Comprobante Adjunto</span>
                      <div className="flex gap-2">
                        <a
                          href={formData.archivoAdjunto}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-colors text-blue-400 text-xs"
                        >
                          <Eye size={12} />
                          Ver Completo
                        </a>
                      </div>
                    </div>
                    
                    {/* Vista previa de imagen */}
                    {(formData.archivoAdjunto.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                      <div className="relative w-full aspect-video bg-zinc-950 rounded-lg overflow-hidden">
                        <img
                          src={formData.archivoAdjunto}
                          alt="Comprobante"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center text-zinc-500 text-xs">
                          <FileText size={24} />
                        </div>
                      </div>
                    )}
                    
                    {/* Ícono para archivos PDF */}
                    {(formData.archivoAdjunto.match(/\.pdf$/i)) && (
                      <div className="flex items-center justify-center py-8 text-red-400">
                        <FileText size={48} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* USD Conversion */}
              {formData.currency === 'USD' && (
                <div className="col-span-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-1">
                  <div className="flex items-center gap-1 text-blue-400">
                    <DollarSign size={12} />
                    <span className="text-xs font-bold">Conversión USD</span>
                  </div>
                  <select
                    value={formData.tipoDolar}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipoDolar: e.target.value }))}
                    className="w-full p-1 bg-zinc-900/80 border border-blue-500/30 rounded text-xs text-white focus:outline-none"
                  >
                    {Object.values(TIPOS_DOLAR).map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                  </select>
                  <div className="text-xs flex justify-between pt-1 border-t border-white/5">
                    <span className="text-zinc-400">Cot: ${formData.cotizacionDolar}</span>
                    <span className="text-white font-bold">ARS: ${parseFloat(formData.montoArs || 0).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-[#09090b] flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white font-medium hover:bg-white/5 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || isSubmitting || !formData.description.trim() || !formData.amount}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading || isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            {editingTransaction ? 'Guardar' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernTransactionForm;
