import { useId, useState, useEffect, useRef } from 'react';
import {
  Plus,
  DollarSign,
  Tag,
  FileText,
  X,
  Save,
  Loader2,
  ChevronDown,
  Eye,
  ExternalLink,
  Paperclip
} from 'lucide-react';
import apiServices from '../services/api';
import dolarService, { TIPOS_DOLAR } from '../services/dolarService';
import FileUpload from './FileUpload/FileUpload';
import { normalizeDocumentPreviewUrl } from '../utils/documentPreviewUrl';
import { buildRecurringPendingPaymentDates } from '../utils/pendingPaymentStatus';

const { transaccionesApi, categoriasApi, metodosPagoApi, objetivosApi, monedasApi, pagosPendientesApi } = apiServices;

const FRECUENCIAS_RECURRENCIA = ['semanal', 'mensual', 'anual'];

function proximaFechaVencimiento(fechaBase, frecuencia) {
  return buildRecurringPendingPaymentDates(fechaBase, null, frecuencia).fechavencimiento;
}

const ModernTransactionForm = ({ isOpen, onClose, onSuccess, editingTransaction }) => {
  const modalTitleId = useId();
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
    esRecurrente: false, // 🔁 Si es un gasto fijo (crea un vencimiento futuro)
    frecuenciaRecurrente: 'mensual',
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
  const submittingRef = useRef(false);
  const advancedRef = useRef(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [feedback, setFeedback] = useState('');
  const feedbackRef = useRef(null);

  useEffect(() => {
    const firstField = Object.keys(fieldErrors)[0];
    if (!firstField) return;
    const input = document.getElementById(`transaction-${firstField}`);
    if (input && advancedRef.current?.contains(input)) {
      advancedRef.current.open = true;
      setAdvancedOpen(true);
    }
    input?.focus();
  }, [fieldErrors]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  const errorAttributes = (field) => ({
    'aria-invalid': Boolean(fieldErrors[field]),
    'aria-describedby': fieldErrors[field] ? `transaction-${field}-error` : undefined,
  });
  const renderFieldError = (field) => fieldErrors[field] && (
    <span id={`transaction-${field}-error`} className="mt-1 block text-sm text-foreground">
      {fieldErrors[field]}
    </span>
  );

  const fieldClassName = 'w-full px-3.5 py-2.5 bg-secondary border border-border rounded-sm text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-colors duration-150';
  const selectClassName = 'w-full px-3.5 py-2.5 pr-9 bg-secondary border border-border rounded-sm text-[13.5px] text-foreground appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-colors duration-150';
  const selectedControlClassName = 'border-primary bg-primary-surface font-semibold text-foreground';
  const selectedIncomeControlClassName = 'border-success bg-success font-semibold text-success-foreground';
  const selectedExpenseControlClassName = 'border-destructive bg-destructive font-semibold text-destructive-foreground';
  const inactiveControlClassName = 'border-border bg-secondary text-muted-foreground hover:bg-card-hover hover:text-foreground';
  const primaryButtonClassName = 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-50';
  const fieldIds = {
    description: 'transaction-description',
    notes: 'transaction-notes',
    amount: 'transaction-amount',
    currency: 'transaction-currency',
    date: 'transaction-date',
    exchangeType: 'transaction-exchange-type',
    category: 'transaction-category',
    paymentMethod: 'transaction-payment-method',
    newCategory: 'transaction-new-category',
    objetivo: 'transaction-saving-goal',
  };

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
      setFieldErrors({});
      setFeedback('');
      setShowCreateCategory(false);
      setNewCategoryName('');
      setAdvancedOpen(Boolean(editingTransaction && (
        editingTransaction.notas || editingTransaction.objetivo_id ||
        editingTransaction.es_credito || editingTransaction.archivo_adjunto ||
        editingTransaction.es_aporte_objetivo === false
      )));
      loadData();
      
      if (editingTransaction) {
        setTransactionType(editingTransaction.tipo || 'ingreso');
        setFormData({
          description: editingTransaction.descripcion || '',
          amount: editingTransaction.monto != null ? Math.abs(editingTransaction.monto) : '',
          currency: editingTransaction.moneda || 'ARS',
          category: editingTransaction.categoria_id || '',
          paymentMethod: editingTransaction.metodo_pago_id || '',
          objetivo: editingTransaction.objetivo_id || '', // 🎯 Cargar objetivo si existe
          esAporteObjetivo: editingTransaction.es_aporte_objetivo !== false, // 🎯 Por defecto true
          esCredito: editingTransaction.es_credito || false, // 💳 Cargar si es crédito
          esRecurrente: false, // 🔁 No se retroactiva al editar
          frecuenciaRecurrente: 'mensual',
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
          esRecurrente: false, // 🔁 Por defecto NO es recurrente
          frecuenciaRecurrente: 'mensual',
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
      esRecurrente: false, // 🔁 Reset recurrente
      frecuenciaRecurrente: 'mensual',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setTransactionType('ingreso');
    setShowCreateCategory(false);
    setNewCategoryName('');
    if (onClose) onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    // Preserve the existing description/positive-amount rules and parsing.
    const errors = {};
    if (!formData.description.trim()) errors.description = 'La descripción es requerida';
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) errors.amount = 'El monto es requerido';
    else if (amount <= 0) errors.amount = 'El monto debe ser mayor que cero. No se permiten valores negativos o cero.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setFeedback('Revisá los campos marcados. Tus datos siguen en el formulario.');
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      setLoading(true);
      setFeedback('');

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
        await transaccionesApi.update(editingTransaction.id, transactionData);
        if (onSuccess) onSuccess({ ...transactionData, id: editingTransaction.id });
      } else {
        const result = await transaccionesApi.create(transactionData);
        if (onSuccess) onSuccess({ ...transactionData, id: result.id });

        // 🔁 Gasto fijo/recurrente: además de la transacción (lo que ya se
        // pagó), se crea el próximo vencimiento en Pagos Pendientes para
        // que no se pierda de vista el mes que viene.
        if (transactionType === 'gasto' && formData.esRecurrente) {
          try {
            await pagosPendientesApi.create({
              nombre: formData.description.trim(),
              monto: Math.abs(parseFloat(formData.amount)),
              moneda: formData.currency,
              fechavencimiento: proximaFechaVencimiento(formData.date, formData.frecuenciaRecurrente),
              categorias_id: formData.category || null,
              notas: `Generado automáticamente desde el gasto "${formData.description.trim()}" (${formData.date})`,
              recurrente: true,
              frecuencia_recurrencia: formData.frecuenciaRecurrente,
              estado: 'pendiente'
            });
          } catch (recurrenteError) {
            console.error('Error creando el próximo vencimiento recurrente:', recurrenteError);
          }
        }
      }

      handleCancel();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setFeedback('No se pudo guardar la transacción. Tus datos se conservaron; intentá nuevamente.');
      feedbackRef.current?.focus();
    } finally {
      submittingRef.current = false;
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
      setFieldErrors({});
      setFeedback('');
      
    } catch (error) {
      console.error('Error creating category:', error);
      setFieldErrors({ 'new-category': 'No se pudo crear la categoría. Intentá nuevamente.' });
      setFeedback('No se pudo crear la categoría. Tus datos se conservaron.');
    }
  };
  if (!isOpen) return null;

  const attachedDocument = normalizeDocumentPreviewUrl(formData.archivoAdjunto || '');

  // Modal Kanagawa — overlay + panel tokens compartidos con el resto de modales
  // ya restyleados (ver ObjetivoFormModal.jsx / design_handoff README).
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center p-0 md:items-center md:p-8"
      style={{ background: 'rgba(32,36,44,.56)' }}
      onClick={(event) => event.target === event.currentTarget && handleCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        className="relative flex h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[12px] border border-border bg-popover text-popover-foreground md:h-auto md:max-h-[90vh] md:rounded-[12px]"
      >
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-popover px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-muted">
              {editingTransaction ? <FileText className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h2 id={modalTitleId} className="text-xl font-semibold text-foreground">
                {editingTransaction ? 'Editar transacción' : 'Nueva transacción'}
              </h2>
              <p className="text-sm text-muted-foreground">Empezá por lo esencial. El resto es opcional.</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            aria-label="Cerrar formulario de transacción"
            className="rounded-sm p-2 text-muted-foreground transition-colors duration-150 hover:bg-card-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-popover px-4 py-5 text-popover-foreground md:px-8">
          <p className="text-sm text-muted-foreground">Descripción y monto son obligatorios. El tipo define el signo del importe.</p>
          <section className="space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-serif text-[17px] font-semibold text-foreground">Información básica</h3>
            </div>

            <div role="group" aria-label="Tipo de movimiento" className="flex gap-3 [&>button]:min-h-11 [&>button]:flex-1">
              <button
                type="button"
                onClick={() => setTransactionType('ingreso')}
                aria-pressed={transactionType === 'ingreso'}
                className={`rounded-sm border px-4 py-2 text-[13px] font-medium transition-colors duration-150 ${
                  transactionType === 'ingreso'
                    ? selectedIncomeControlClassName
                    : inactiveControlClassName
                }`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('gasto')}
                aria-pressed={transactionType === 'gasto'}
                className={`rounded-sm border px-4 py-2 text-[13px] font-medium transition-colors duration-150 ${
                  transactionType === 'gasto'
                    ? selectedExpenseControlClassName
                    : inactiveControlClassName
                }`}
              >
                Gasto
              </button>
            </div>

            <div className="grid gap-4">
              <label htmlFor={fieldIds.description} className="block text-[12.5px] font-medium text-muted-foreground">
                <span className="mb-1.5 block">Descripción</span>
                <input
                  id={fieldIds.description}
                  required
                  {...errorAttributes('description')}
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="¿Qué transacción es esta?"
                  className={fieldClassName}
                />
              </label>
              {renderFieldError('description')}
            </div>
          </section>

          <section className="space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="font-serif text-[17px] font-semibold text-foreground">Montos y fechas</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="text-[12.5px] font-medium text-muted-foreground">Monto y moneda</div>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <label htmlFor={fieldIds.amount} className="sr-only">Monto</label>
                    <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold ${transactionType === 'gasto' ? 'text-destructive' : 'text-primary'}`}>$</span>
                    <input
                      id={fieldIds.amount}
                      required
                      {...errorAttributes('amount')}
                      inputMode="decimal"
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className={`${fieldClassName} pl-7`}
                      step="0.01"
                      min="0.01"
                      autoFocus
                    />
                  </div>
                  <div className="relative min-w-[120px]">
                    <label htmlFor={fieldIds.currency} className="sr-only">Moneda</label>
                    <select
                      id={fieldIds.currency}
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className={selectClassName}
                    >
                      {currencies.map(currency => (
                        <option key={currency.id || currency.codigo} value={currency.codigo}>
                          {currency.codigo}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                {renderFieldError('amount')}
              </div>

              <label htmlFor={fieldIds.date} className="block text-[12.5px] font-medium text-muted-foreground">
                <span className="mb-1.5 block">Fecha</span>
                <input
                  id={fieldIds.date}
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`${fieldClassName} font-mono`}
                />
              </label>
            </div>

            {formData.currency === 'USD' && (
              <div className="space-y-3 rounded-sm border border-border bg-secondary p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-[13px] font-semibold">Conversión USD</span>
                </div>
                <div className="relative">
                  <label htmlFor={fieldIds.exchangeType} className="sr-only">Tipo de dólar</label>
                  <select
                    id={fieldIds.exchangeType}
                    value={formData.tipoDolar}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipoDolar: e.target.value }))}
                    className={selectClassName}
                  >
                    {Object.values(TIPOS_DOLAR).map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="flex justify-between border-t border-muted pt-3 font-mono text-[12.5px]">
                  <span className="text-muted-foreground">{loadingCotizaciones ? 'Cargando cotizaciones…' : `Cotización: $${formData.cotizacionDolar ?? ''}`}</span>
                  <span className="font-semibold text-foreground">ARS: ${parseFloat(formData.montoArs || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="font-serif text-[17px] font-semibold text-foreground">Categorización</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label htmlFor={fieldIds.category} className="block text-[12.5px] font-medium text-muted-foreground">
                <span className="mb-1.5 block">Categoría</span>
                <div className="relative">
                  <select
                    id={fieldIds.category}
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === 'new') setShowCreateCategory(true);
                      else setFormData(prev => ({ ...prev, category: e.target.value }));
                    }}
                    className={selectClassName}
                  >
                    <option value="">Categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    <option value="new">+ Nueva</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </label>

              <label htmlFor={fieldIds.paymentMethod} className="block text-[12.5px] font-medium text-muted-foreground">
                <span className="mb-1.5 block">Método de pago</span>
                <div className="relative">
                  <select
                    id={fieldIds.paymentMethod}
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className={selectClassName}
                  >
                    <option value="">Método</option>
                    {metodosPago.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </label>
            </div>

            {showCreateCategory && (
              <div className="rounded-sm border border-border bg-secondary p-4">
                <div className="flex gap-2">
                  <input
                    id={fieldIds.newCategory}
                    aria-label="Nueva categoría"
                    {...errorAttributes('new-category')}
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nueva categoría"
                    className={`${fieldClassName} flex-1`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={createQuickCategory}
                    className={`rounded-sm px-4 py-2.5 text-[13px] font-semibold transition-colors duration-150 ${primaryButtonClassName}`}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateCategory(false)}
                    className="rounded-sm border border-border bg-secondary px-4 py-2.5 text-[13px] text-foreground transition-colors duration-150 hover:bg-card-hover"
                  >
                    Cancelar
                  </button>
                </div>
                {renderFieldError('new-category')}
              </div>
            )}
          </section>

          <details ref={advancedRef} open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)} className="border-t border-border pt-2">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
              Más opciones · notas, objetivos, crédito, recurrencia y comprobantes
            </summary>
            <section className="space-y-4 pt-4">
              <label htmlFor={fieldIds.notes} className="block text-[12.5px] font-medium text-muted-foreground">
                <span className="mb-1.5 block">Notas</span>
                <textarea
                  id={fieldIds.notes}
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Detalles adicionales (opcional)..."
                  rows={3}
                  className={fieldClassName}
                />
              </label>
            <label htmlFor={fieldIds.objetivo} className="block text-[12.5px] font-medium text-muted-foreground">
              <span className="mb-1.5 block">Objetivo de ahorro (opcional)</span>
              <div className="relative">
                <select
                  id={fieldIds.objetivo}
                  value={formData.objetivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, objetivo: e.target.value }))}
                  className={selectClassName}
                >
                  <option value="">Sin objetivo asignado</option>
                  {objetivos.map(obj => (
                    <option key={obj.id} value={obj.id}>
                      {obj.icono} {obj.nombre} ({obj.porcentaje_completado.toFixed(0)}%)
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </label>

            {formData.objetivo && (
              <fieldset className="space-y-2">
                <legend className="text-[12.5px] font-medium text-muted-foreground">Cómo afecta al objetivo</legend>
                <div className="flex w-fit gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, esAporteObjetivo: true }))}
                  className={`rounded-sm border px-4 py-1.5 text-[13px] font-medium transition-colors duration-150 ${formData.esAporteObjetivo ? selectedControlClassName : inactiveControlClassName}`}
                  >
                    Aporte
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, esAporteObjetivo: false }))}
                  className={`rounded-sm border px-4 py-1.5 text-[13px] font-medium transition-colors duration-150 ${!formData.esAporteObjetivo ? selectedControlClassName : inactiveControlClassName}`}
                  >
                    Uso
                  </button>
                </div>
              </fieldset>
            )}

            {transactionType === 'gasto' && (
              <div className="flex items-center justify-between rounded-sm border border-border bg-secondary p-4">
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-medium text-foreground">Gasto con tarjeta de crédito</span>
                  <span id="credit-card-expense-description" className="text-[12px] text-muted-foreground">No descuenta balance hasta pagar el resumen</span>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={formData.esCredito}
                    onChange={(e) => setFormData(prev => ({ ...prev, esCredito: e.target.checked }))}
                    className="peer sr-only"
                    aria-label="Marcar como gasto con tarjeta de crédito"
                    aria-describedby="credit-card-expense-description"
                  />
                  <div className="h-6 w-11 rounded-full bg-muted transition-colors duration-150 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-secondary after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" />
                </label>
              </div>
            )}

            {transactionType === 'gasto' && (
              <div className="rounded-sm border border-border bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-medium text-foreground">Gasto fijo / recurrente</span>
                    <span id="recurring-expense-description" className="text-[12px] text-muted-foreground">Crea el próximo vencimiento en Pagos Pendientes (ej: alquiler, luz, streaming)</span>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={formData.esRecurrente}
                      onChange={(e) => setFormData(prev => ({ ...prev, esRecurrente: e.target.checked }))}
                      className="peer sr-only"
                      aria-label="Marcar como gasto fijo o recurrente"
                      aria-describedby="recurring-expense-description"
                    />
                    <div className="h-6 w-11 rounded-full bg-muted transition-colors duration-150 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-secondary after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" />
                  </label>
                </div>

                {formData.esRecurrente && (
                  <fieldset className="mt-3 flex items-center gap-2 border-t border-muted pt-3">
                    <legend className="text-[12.5px] text-muted-foreground">Frecuencia</legend>
                    <div className="flex gap-1.5">
                      {FRECUENCIAS_RECURRENCIA.map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, frecuenciaRecurrente: freq }))}
                          className={`rounded-sm border px-3 py-1 text-[12.5px] font-medium capitalize transition-colors duration-150 ${
                            formData.frecuenciaRecurrente === freq
                              ? selectedControlClassName
                              : inactiveControlClassName
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4 pb-4 pt-6">
            <div className="mb-2 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" />
              <h3 className="font-serif text-[17px] font-semibold text-foreground">Documentos</h3>
            </div>

            {/* Legacy upload buttons omit type="button". Keep their own actions
                without allowing the native click default to submit this form. */}
            <div onClickCapture={(event) => {
              if (event.target.closest('button')) event.preventDefault();
            }}>
            <FileUpload
              onFileUploaded={(fileData) => setFormData(prev => ({ ...prev, archivoAdjunto: fileData.url }))}
              onFileRemoved={() => setFormData(prev => ({ ...prev, archivoAdjunto: '' }))}
              currentFileUrl={formData.archivoAdjunto}
              prefix="transacciones"
              maxSizeMB={10}
              showPreview={true}
            />
            </div>

            {formData.archivoAdjunto && (
              <div className="space-y-3 rounded-sm border border-border bg-secondary p-4">
                {attachedDocument.isValid ? (
                  <div className="flex items-center gap-4">
                    <a
                      href={attachedDocument.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-sm border border-border bg-secondary px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-card-hover"
                    >
                      <Eye size={16} />
                      Ver comprobante
                    </a>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">El enlace del comprobante no es seguro o no pertenece a un origen permitido.</p>
                )}

                {attachedDocument.isValid && attachedDocument.fileType === 'image' && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-background">
                    <img
                      src={attachedDocument.href}
                      alt="Comprobante"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden h-full w-full items-center justify-center text-muted-foreground">
                      <FileText size={28} />
                    </div>
                  </div>
                )}

                {attachedDocument.isValid && attachedDocument.fileType === 'pdf' && (
                  <a
                    href={attachedDocument.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] font-medium text-primary transition-colors duration-150 hover:opacity-80"
                  >
                    <ExternalLink size={16} />
                    Ver PDF adjunto
                  </a>
                )}
              </div>
            )}
          </section>
          </details>
        </div>

        <div className="shrink-0 border-t border-border bg-popover px-4 py-4 md:px-8">
          <div ref={feedbackRef} tabIndex={-1} role="alert" aria-live="assertive" aria-atomic="true" className={feedback ? 'mb-3 rounded-sm border border-border bg-accent p-3 text-sm text-accent-foreground' : 'sr-only'}>
            {feedback}
          </div>
          <div className="flex justify-end gap-3 [&>button]:min-h-11 [&>button]:flex-1 md:[&>button]:flex-none">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-sm border border-border bg-secondary px-[15px] py-[8px] text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-card-hover hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className={`flex items-center gap-2 rounded-sm px-[18px] py-[8px] text-[13px] font-semibold transition-colors duration-150 ${primaryButtonClassName}`}
          >
            {loading || isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
            {editingTransaction ? 'Guardar cambios' : 'Registrar'}
          </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
};

export default ModernTransactionForm;
