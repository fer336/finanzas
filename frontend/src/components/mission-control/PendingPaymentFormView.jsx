import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Calendar, DollarSign, AlertCircle, FileText, Tag, Flag } from 'lucide-react';
import FileUpload from '../FileUpload/FileUpload';
import apiServices from '../../services/api';

const PendingPaymentFormView = ({
  payment = null,
  onSave,
  onCancel,
  categories = [],
  paymentMethods = []
}) => {
  // Form state
  const [formData, setFormData] = useState({
    Nombre: '',
    Descripcion: '',
    Monto: '',
    Moneda: 'ARS',
    Fechavencimiento: new Date().toISOString().split('T')[0],
    Estado: 'pendiente',
    Tipo: 'factura',
    Prioridad: 'media',
    Notas: '',
    Recurrente: false,
    FrecuenciaRecurrencia: '',
    fecha_emision: '',
    liquidacion: '',
    periodo: '',
    num_factura: '',
    url_pdf: '',
    comprobante: '',
    interes: 0,
    recargo: 0,
    diasgracia: 0,
    categorias_id: '',
    metodos_pago_id: ''
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load data if editing
  useEffect(() => {
    if (payment) {
      console.log('📝 PendingPaymentFormView - Loading payment to edit:', payment);

      // Support multiple field formats
      const nombre = payment.Nombre || payment.nombre || '';
      const descripcion = payment.Descripcion || payment.descripcion || '';
      const monto = payment.Monto || payment.monto || '';
      const moneda = payment.Moneda || payment.moneda || 'ARS';
      const fechaVencimiento = payment.Fechavencimiento || payment.fechavencimiento || payment.FechaVencimiento || payment.fecha_vencimiento;

      // Normalize status
      let estado = payment.Estado || payment.estado;
      if (estado === true || estado === 'true') estado = 'pagado';
      else if (estado === false || estado === 'false' || estado === '' || !estado) estado = 'pendiente';
      else if (estado !== 'vencido') estado = 'pendiente';
      const tipo = payment.Tipo || payment.tipo || 'factura';
      const prioridad = payment.Prioridad || payment.prioridad || 'media';
      const notas = payment.Notas || payment.notas || '';
      const recurrente = payment.Recurrente || payment.recurrente || false;
      const frecuencia = payment.FrecuenciaRecurrencia || payment.frecuenciaRecurrencia || payment.frecuencia_recurrencia || '';
      const fechaEmision = payment.FechaEmision || payment.fecha_emision || payment.fechaEmision || '';
      const liquidacion = payment.Liquidacion || payment.liquidacion || '';
      const periodo = payment.Periodo || payment.periodo || '';
      const numFactura = payment.NumFactura || payment.num_factura || payment.numFactura || '';

      // Find URL
      const urlPdf = payment.UrlPdf || payment.url_pdf || payment.urlPdf || payment.URL_pdf || payment.Urlpdf || '';
      const comprobante = payment.Comprobante || payment.comprobante || payment.ArchivoAdjunto || payment.archivo_adjunto || payment.archivoAdjunto || '';

      const interes = payment.Interes || payment.interes || 0;
      const recargo = payment.Recargo || payment.recargo || 0;
      const diasGracia = payment.DiasGracia || payment.dias_gracia || payment.diasgracia || payment.diasGracia || 0;
      const categoriaId = payment.categorias_id || payment.CategoriasId || payment.Categorias?.Id || payment.Categorias?.id || '';
      const metodoPagoId = payment.metodos_pago_id || payment.MetodosPagoId || payment.MetodosPago?.Id || payment.MetodosPago?.id || '';

      const formattedData = {
        Nombre: nombre,
        Descripcion: descripcion,
        Monto: monto,
        Moneda: moneda,
        Fechavencimiento: fechaVencimiento ? fechaVencimiento.split('T')[0] : new Date().toISOString().split('T')[0],
        Estado: estado,
        Tipo: tipo,
        Prioridad: prioridad,
        Notas: notas,
        Recurrente: recurrente,
        FrecuenciaRecurrencia: frecuencia,
        fecha_emision: fechaEmision ? fechaEmision.split('T')[0] : '',
        liquidacion: liquidacion,
        periodo: periodo,
        num_factura: numFactura,
        url_pdf: urlPdf,
        comprobante: comprobante,
        interes: interes,
        recargo: recargo,
        diasgracia: diasGracia,
        categorias_id: categoriaId,
        metodos_pago_id: metodoPagoId
      };

      setFormData(formattedData);
    }
  }, [payment]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.Nombre || formData.Nombre.trim() === '') {
      newErrors.Nombre = 'El nombre es requerido';
    }

    if (!formData.Monto || isNaN(formData.Monto) || parseFloat(formData.Monto) <= 0) {
      newErrors.Monto = 'El monto debe ser mayor a 0';
    }

    if (!formData.Fechavencimiento) {
      newErrors.Fechavencimiento = 'La fecha de vencimiento es requerida';
    }

    if (formData.Recurrente && !formData.FrecuenciaRecurrencia) {
      newErrors.FrecuenciaRecurrencia = 'La frecuencia es requerida para pagos recurrentes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Save payment
  const handleSave = async () => {
    console.log('🔵 PendingPaymentFormView - handleSave called');
    console.log('📝 Form data:', formData);

    const isValid = validateForm();
    console.log('✅ Validation result:', isValid);
    console.log('❌ Validation errors:', errors);

    if (!isValid) {
      console.warn('⚠️ Form validation failed, not saving');
      return;
    }

    setIsSaving(true);

    try {
      // Prepare data for backend (all lowercase)
      const dataToSave = {
        nombre: formData.Nombre,
        descripcion: formData.Descripcion,
        monto: parseFloat(formData.Monto),
        moneda: formData.Moneda,
        fechavencimiento: formData.Fechavencimiento,
        estado: formData.Estado.toLowerCase(), // Backend expects lowercase 'estado' ('pendiente', 'pagado', 'vencido')
        tipo: formData.Tipo,
        prioridad: formData.Prioridad,
        notas: formData.Notas,
        fecha_emision: formData.fecha_emision,
        liquidacion: formData.liquidacion,
        periodo: formData.periodo,
        num_factura: formData.num_factura,
        url_pdf: formData.url_pdf,
        comprobante: formData.comprobante, // File URL from MinIO
        interes: parseFloat(formData.interes) || 0,
        recargo: parseFloat(formData.recargo) || 0,
        // NOTE: 'diasgracia' field does not exist in PagoPendiente model, omitting it
        categorias_id: formData.categorias_id || null,
        metodos_pago_id: formData.metodos_pago_id || null
      };

      console.log('💾 Calling onSave with data:', dataToSave);
      await onSave(dataToSave);
      console.log('✅ onSave completed successfully');
    } catch (error) {
      console.error('❌ Error saving payment:', error);
      setErrors({ general: 'Error al guardar el pago. Por favor intente nuevamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Payment types
  const tiposPago = [
    { value: 'factura', label: '📄 Factura', icon: '📄' },
    { value: 'servicio', label: '⚡ Servicio', icon: '⚡' },
    { value: 'prestamo', label: '💰 Préstamo', icon: '💰' },
    { value: 'impuesto', label: '🏛️ Impuesto', icon: '🏛️' },
    { value: 'alquiler', label: '🏠 Alquiler', icon: '🏠' },
    { value: 'tarjeta', label: '💳 Tarjeta', icon: '💳' },
    { value: 'otro', label: '📌 Otro', icon: '📌' }
  ];

  // Priorities
  const prioridades = [
    { value: 'baja', label: 'Baja', color: 'text-primary00', bgColor: 'bg-gray-500/10' },
    { value: 'media', label: 'Media', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    { value: 'alta', label: 'Alta', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
    { value: 'critica', label: 'Crítica', color: 'text-red-400', bgColor: 'bg-red-500/10' }
  ];

  // Frequencies
  const frecuencias = [
    { value: 'mensual', label: 'Mensual' },
    { value: 'bimensual', label: 'Bimensual' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'cuatrimestral', label: 'Cada 4 meses' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' }
  ];

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">
                {payment ? 'Editar Pago Pendiente' : 'Nuevo Pago Pendiente'}
              </h1>
              <p className="text-sm text-white/60">
                {payment ? 'Actualizar detalles del pago' : 'Completa la información del pago'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancelar</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Información Básica
          </h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Nombre del Pago <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.Nombre}
              onChange={(e) => handleInputChange('Nombre', e.target.value)}
              placeholder="ej. Factura de Luz"
              className={`w-full px-4 py-3 bg-white/10 border ${errors.Nombre ? 'border-red-500/50' : 'border-white/20'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40`}
            />
            {errors.Nombre && (
              <p className="mt-1 text-sm text-red-400">{errors.Nombre}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.Descripcion}
              onChange={(e) => handleInputChange('Descripcion', e.target.value)}
              placeholder="ej. Servicio mensual de electricidad"
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40 resize-none"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Número de Factura
            </label>
            <input
              type="text"
              value={formData.num_factura}
              onChange={(e) => handleInputChange('num_factura', e.target.value)}
              placeholder="ej. 001-00123456"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Estado
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Pending */}
              <button
                type="button"
                onClick={() => handleInputChange('Estado', 'pendiente')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${formData.Estado === 'pendiente' || formData.Estado === false || formData.Estado === ''
                    ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-yellow-500/30'
                  }`}
              >
                <AlertCircle className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Pendiente</span>
              </button>

              {/* Paid */}
              <button
                type="button"
                onClick={() => handleInputChange('Estado', 'pagado')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${formData.Estado === 'pagado' || formData.Estado === true
                    ? 'border-green-500/50 bg-green-500/20 text-green-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-green-500/30'
                  }`}
              >
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Pagado</span>
              </button>

              {/* Overdue */}
              <button
                type="button"
                onClick={() => handleInputChange('Estado', 'vencido')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${formData.Estado === 'vencido'
                    ? 'border-red-500/50 bg-red-500/20 text-red-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-red-500/30'
                  }`}
              >
                <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Vencido</span>
              </button>
            </div>
          </div>
        </div>

        {/* Amounts and Dates */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Montos y Fechas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Monto <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.Monto}
                onChange={(e) => handleInputChange('Monto', e.target.value)}
                placeholder="0.00"
                className={`w-full px-4 py-3 bg-white/10 border ${errors.Monto ? 'border-red-500/50' : 'border-white/20'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40`}
              />
              {errors.Monto && (
                <p className="mt-1 text-sm text-red-400">{errors.Monto}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Moneda
              </label>
              <select
                value={formData.Moneda}
                onChange={(e) => handleInputChange('Moneda', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white [&>option]:bg-[#1a382f] [&>option]:text-white"
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Fecha de Vencimiento <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.Fechavencimiento}
                onChange={(e) => handleInputChange('Fechavencimiento', e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border ${errors.Fechavencimiento ? 'border-red-500/50' : 'border-white/20'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white`}
              />
              {errors.Fechavencimiento && (
                <p className="mt-1 text-sm text-red-400">{errors.Fechavencimiento}</p>
              )}
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Fecha de Emisión
              </label>
              <input
                type="date"
                value={formData.fecha_emision}
                onChange={(e) => handleInputChange('fecha_emision', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
              />
            </div>

            {/* Interest */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Interés (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interes}
                onChange={(e) => handleInputChange('interes', e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40"
              />
            </div>

            {/* Surcharge */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Recargo ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.recargo}
                onChange={(e) => handleInputChange('recargo', e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40"
              />
            </div>

            {/* Grace Days */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Días de Gracia
              </label>
              <input
                type="number"
                value={formData.diasgracia}
                onChange={(e) => handleInputChange('diasgracia', e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40"
              />
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Período
              </label>
              <input
                type="text"
                value={formData.periodo}
                onChange={(e) => handleInputChange('periodo', e.target.value)}
                placeholder="ej. Ene 2025"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40"
              />
            </div>
          </div>

          {/* Settlement */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Liquidación
            </label>
            <input
              type="text"
              value={formData.liquidacion}
              onChange={(e) => handleInputChange('liquidacion', e.target.value)}
              placeholder="ej. Liquidación Mensual"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40"
            />
          </div>
        </div>

        {/* Classification */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Clasificación
          </h2>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Tipo de Pago
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tiposPago.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => handleInputChange('Tipo', tipo.value)}
                  className={`px-4 py-3 rounded-lg border transition-all ${formData.Tipo === tipo.value
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                    }`}
                >
                  <div className="text-2xl mb-1">{tipo.icon}</div>
                  <div className="text-xs">{tipo.label.split(' ')[1]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Prioridad
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {prioridades.map((prioridad) => (
                <button
                  key={prioridad.value}
                  type="button"
                  onClick={() => handleInputChange('Prioridad', prioridad.value)}
                  className={`px-4 py-3 rounded-lg border transition-all ${formData.Prioridad === prioridad.value
                      ? `${prioridad.bgColor} border-current ${prioridad.color}`
                      : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                    }`}
                >
                  <Flag className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs">{prioridad.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Categoría
            </label>
            <select
              value={formData.categorias_id}
              onChange={(e) => handleInputChange('categorias_id', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white [&>option]:bg-[#1a382f] [&>option]:text-white"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.Id} value={cat.Id}>
                  {cat.icono || '📁'} {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Método de Pago
            </label>
            <select
              value={formData.metodos_pago_id}
              onChange={(e) => handleInputChange('metodos_pago_id', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white [&>option]:bg-[#1a382f] [&>option]:text-white"
            >
              <option value="">Sin método de pago</option>
              {paymentMethods.map((method) => (
                <option key={method.Id} value={method.Id}>
                  {method.icono || '💳'} {method.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recurrence */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Recurrencia
          </h2>

          {/* Recurrent Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recurrente"
              checked={formData.Recurrente}
              onChange={(e) => handleInputChange('Recurrente', e.target.checked)}
              className="w-5 h-5 rounded bg-white/10 border-white/20 text-primary focus:ring-2 focus:ring-primary/50"
            />
            <label htmlFor="recurrente" className="text-white/80 cursor-pointer">
              Este es un pago recurrente
            </label>
          </div>

          {/* Frequency (only if recurrent) */}
          {formData.Recurrente && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Frecuencia <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.FrecuenciaRecurrencia}
                onChange={(e) => handleInputChange('FrecuenciaRecurrencia', e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border ${errors.FrecuenciaRecurrencia ? 'border-red-500/50' : 'border-white/20'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white [&>option]:bg-[#1a382f] [&>option]:text-white`}
              >
                <option value="">Seleccionar frecuencia</option>
                {frecuencias.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
              {errors.FrecuenciaRecurrencia && (
                <p className="mt-1 text-sm text-red-400">{errors.FrecuenciaRecurrencia}</p>
              )}
            </div>
          )}
        </div>

        {/* Notes and Files */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Notas y Adjuntos
          </h2>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Notas Adicionales
            </label>
            <textarea
              value={formData.Notas}
              onChange={(e) => handleInputChange('Notas', e.target.value)}
              placeholder="Agregar notas, observaciones o recordatorios..."
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40 resize-none"
            />
          </div>

          {/* PDF URL */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              URL del PDF/Factura
            </label>
            <input
              type="url"
              value={formData.url_pdf}
              onChange={(e) => handleInputChange('url_pdf', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-white/40"
            />
          </div>

          {/* File Upload (Comprobante) */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Comprobante de Pago (Subir a MinIO)
            </label>
            <FileUpload
              onFileUploaded={(fileData) => {
                const url = fileData.file_url || fileData.url;
                console.log('📎 File uploaded, URL:', url);
                handleInputChange('comprobante', url);
              }}
              onFileRemoved={() => {
                handleInputChange('comprobante', '');
              }}
              currentFileUrl={formData.comprobante}
              prefix="comprobantes"
              maxSizeMB={10}
              showPreview={true}
            />

            {/* Comprobante URL Field - Visible for user */}
            {formData.comprobante && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  URL del Comprobante
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.comprobante}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm font-mono"
                  />
                  <a
                    href={formData.comprobante}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-white/80"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('¿Eliminar el comprobante de MinIO? Esta acción no se puede deshacer.')) {
                        try {
                          console.log('🗑️ Deleting file from MinIO:', formData.comprobante);
                          await apiServices.filesApi.deleteFile(formData.comprobante);
                          console.log('✅ File deleted successfully from MinIO');
                          handleInputChange('comprobante', '');
                          alert('Comprobante eliminado exitosamente de MinIO');
                        } catch (error) {
                          console.error('❌ Error deleting file:', error);
                          alert(`Error eliminando archivo: ${error.message}`);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-colors flex items-center gap-2 text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex gap-3 pb-24 sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-white/10 z-50">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingPaymentFormView;
