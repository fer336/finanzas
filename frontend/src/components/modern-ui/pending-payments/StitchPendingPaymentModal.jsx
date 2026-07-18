import { useId, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Save,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Info,
  Repeat,
  Check,
  Link,
  Trash2,
  ExternalLink,
  Upload,
  AlertCircle,
  File
} from 'lucide-react';
import { normalizeDocumentPreviewUrl } from '../../../utils/documentPreviewUrl';

const labelClassName = 'text-[12.5px] font-medium text-foreground';
const helperClassName = 'text-[11.5px] text-muted-foreground';
const inputClassName = 'rounded-sm border border-border bg-secondary px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-colors duration-150';
const selectedPillClassName = 'border-primary bg-primary-surface font-semibold text-foreground';
const inactivePillClassName = 'border-border bg-secondary text-muted-foreground hover:bg-card-hover hover:text-foreground';
const secondaryButtonClassName = 'rounded-sm border border-border bg-secondary text-foreground transition-colors duration-150 hover:bg-card-hover hover:text-foreground disabled:opacity-50';
const primaryButtonClassName = 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:opacity-50';

// ─────────────────────────────────────────────────────────────────────────────
// FileUploadField — upload de archivos a MinIO con preview + URL manual
// ─────────────────────────────────────────────────────────────────────────────
const FileUploadField = ({ label, hint, value, onChange, previewTitle, accentColor, uploadPrefix = 'comprobantes' }) => {
  const urlInputId = useId();
  const fileInputId = useId();
  const hintId = useId();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const normalizedDocument = normalizeDocumentPreviewUrl(value || '');

  const isSafeDocument = normalizedDocument.isValid;
  const safeDocumentUrl = normalizedDocument.href;
  const isImage = isSafeDocument && normalizedDocument.fileType === 'image';
  const isPdf = isSafeDocument && normalizedDocument.fileType === 'pdf';
  const hasFile = !!value;

  // ── Compresión de imágenes (adaptada de ComprobanteUploader) ──
  const compressImage = async (file) => {
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
    if (file.size <= MAX_SIZE_BYTES || !file.type.startsWith('image/') || file.type === 'application/pdf') {
      return file;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let width = img.width, height = img.height;
          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = (height / width) * maxDim; width = maxDim; }
            else { width = (width / height) * maxDim; height = maxDim; }
          }
          canvas.width = width; canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const tryCompress = (q) => {
            canvas.toBlob((blob) => {
              if (!blob) { resolve(file); return; }
              if (blob.size <= MAX_SIZE_BYTES || q <= 0.3) {
                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
              } else { tryCompress(q - 0.1); }
            }, 'image/jpeg', q);
          };
          tryCompress(0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Subida a MinIO ──
  const doUpload = async (file) => {
    const maxSize = 10 * 1024 * 1024;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (file.size > maxSize) { setError('El archivo es demasiado grande. Máximo 10MB.'); return; }
    if (!allowed.includes(file.type)) { setError('Tipo de archivo no permitido. Use JPG, PNG o PDF.'); return; }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const processedFile = await compressImage(file);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + 10;
        });
      }, 200);

      const baseUrl = import.meta.env.MODE === 'production' ? '' : 'http://localhost:8000';
      const fd = new FormData();
      fd.append('file', processedFile);

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${baseUrl}/api/files/upload?prefix=${uploadPrefix}`, {
        method: 'POST',
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || 'Error al subir archivo');
      }

      const data = await res.json();
      const fileUrl = data.data?.file_url || data.data?.url || data.file_url || data.url;
      if (!fileUrl) throw new Error('El servidor no devolvió la URL');

      clearInterval(progressInterval);
      setUploadProgress(100);
      onChange(fileUrl);

      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    } catch (err) {
      setError(err.message || 'Error al subir el archivo');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Handlers de drag & drop ──
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) doUpload(files[0]);
  };
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) doUpload(files[0]);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex flex-col gap-0.5">
        <span className={`flex items-center gap-1.5 ${labelClassName}`}>
          <FileText className="h-3.5 w-3.5" style={{ color: accentColor }} />
          {label}
        </span>
        {hint && <span id={hintId} className={helperClassName}>{hint}</span>}
      </div>

      {/* ── Ya hay archivo subido → preview ── */}
      {hasFile && !showUrlInput && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-md border border-border bg-secondary">
            {!isSafeDocument ? (
              <div className="flex items-center gap-3 p-4">
                <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-2.5 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <p className="flex-1 text-[12px] text-muted-foreground">El enlace guardado no es seguro o no pertenece a un origen permitido.</p>
              </div>
            ) : isImage ? (
              <div className="relative">
                <img src={safeDocumentUrl} alt={previewTitle} className="max-h-56 w-full bg-background object-contain" />
                <a href={safeDocumentUrl} target="_blank" rel="noopener noreferrer"
                   className="absolute right-2 top-2 flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-card-hover">
                  <ExternalLink className="h-3 w-3" /> Ver completo
                </a>
              </div>
            ) : isPdf ? (
              <div className="relative h-64">
                <iframe src={safeDocumentUrl} title={previewTitle} sandbox="allow-same-origin allow-downloads allow-popups" className="h-full w-full border-0" />
                <a href={safeDocumentUrl} target="_blank" rel="noopener noreferrer"
                   className="absolute right-2 top-2 flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-card-hover">
                  <ExternalLink className="h-3 w-3" /> Abrir PDF
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4">
                <div className="rounded-sm p-2.5" style={{ backgroundColor: `${accentColor}1a` }}>
                  <FileText className="h-5 w-5" style={{ color: accentColor }} />
                </div>
                <p className="flex-1 truncate text-[12px] text-muted-foreground">{normalizedDocument.documentName}</p>
                <a href={safeDocumentUrl} target="_blank" rel="noopener noreferrer"
                   className="flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11.5px] font-medium transition-colors"
                   style={{ backgroundColor: `${accentColor}1a`, color: accentColor, border: `1px solid ${accentColor}40` }}>
                  <ExternalLink className="h-3 w-3" /> Abrir
                </a>
              </div>
            )}
          </div>

          {/* Acciones: reemplazar + quitar + editar URL */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11.5px] font-medium transition-colors"
                    style={{ backgroundColor: `${accentColor}1a`, color: accentColor, border: `1px solid ${accentColor}40` }}>
              <Upload className="h-3 w-3" /> Reemplazar archivo
            </button>
            <button type="button" onClick={() => onChange('')}
                    className="flex items-center gap-1.5 rounded-sm border border-destructive/40 px-3 py-1.5 text-[11.5px] font-medium text-destructive transition-colors hover:bg-destructive/10">
              <Trash2 className="h-3 w-3" /> Quitar
            </button>
            <button type="button" onClick={() => setShowUrlInput(true)}
                    className="ml-auto flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Link className="h-3 w-3" /> Editar URL
            </button>
          </div>
        </div>
      )}

      {/* ── Zona de upload (cuando no hay archivo O se activó URL manual) ── */}
      {(!hasFile || showUrlInput) && !uploading && (
        <div className="space-y-3">
          {/* Upload zone (solo si no hay archivo) */}
          {!hasFile && (
            <button
              type="button"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-controls={fileInputId}
              aria-describedby={hint ? hintId : undefined}
              aria-busy={uploading}
              aria-label={`Subir ${label.toLowerCase()}`}
              className={`
                flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-60
                ${isDragging
                   ? 'border-primary bg-primary-surface'
                   : 'border-border bg-secondary hover:border-primary hover:bg-card-hover'
                }
              `}
            >
              <Upload className="h-8 w-8" style={{ color: `${accentColor}99` }} />
              <p className="text-[13.5px] font-medium text-foreground">Subir archivo</p>
              <p className="text-center text-[11.5px] text-muted-foreground">
                Arrastrá un archivo o hace clic para seleccionar
              </p>
              <p className="text-[11px] text-muted-foreground">
                JPG, PNG, PDF — máx. 10MB
              </p>
            </button>
          )}

          {/* URL input (siempre visible cuando está en modo URL) */}
          <div className="flex gap-2">
            <label htmlFor={urlInputId} className="sr-only">URL manual para {label.toLowerCase()}</label>
            <input
              id={urlInputId}
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              aria-describedby={hint ? hintId : undefined}
              className={`flex-1 ${inputClassName}`}
              placeholder="https://..."
            />
            {value && (
              <button type="button" onClick={() => onChange('')}
                       className="rounded-sm border border-destructive/40 p-3 text-destructive transition-colors hover:bg-destructive/10"
                      title={`Quitar ${label.toLowerCase()}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Toggle: URL manual ⇄ upload */}
          {!hasFile && (
            <button type="button" onClick={() => setShowUrlInput(!showUrlInput)}
                    className="flex items-center gap-1 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground">
              <Link className="h-3 w-3" />
              {showUrlInput ? 'Subir archivo en su lugar' : 'O pegar URL manualmente'}
            </button>
          )}
          {hasFile && showUrlInput && (
            <button type="button" onClick={() => setShowUrlInput(false)}
                    className="flex items-center gap-1 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground">
              <FileText className="h-3 w-3" />
              Volver a vista de archivo
            </button>
          )}
        </div>
      )}

      {/* ── Progress bar ── */}
      {uploading && (
        <div className="space-y-2 rounded-md border border-border bg-secondary p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">Subiendo archivo...</span>
            <span className="text-[13px] text-muted-foreground">{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all duration-300"
                 style={{ width: `${uploadProgress}%`, backgroundColor: accentColor }} />
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-sm border border-destructive/40 bg-destructive/10 p-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span className="flex-1 text-[13px] text-destructive">{error}</span>
          <button type="button" onClick={() => setError(null)}
                  className="rounded-sm p-1 transition-colors hover:bg-destructive/10">
            <X className="h-3.5 w-3.5 text-destructive" />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input id={fileInputId} ref={fileInputRef} type="file" className="hidden"
             accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileSelect} aria-label={`Subir ${label.toLowerCase()}`} />
    </div>
  );
};

/**
 * StitchPendingPaymentModal — alta/edición de Vencimiento, tema "Kanagawa"
 * Uses the current Kanagawa semantic modal tokens from DESIGN.md / index.css.
 */
const StitchPendingPaymentModal = ({
  isOpen,
  onClose,
  onSave,
  payment = null,
  categories = [],
  paymentMethods = []
}) => {
  const modalTitleId = useId();
  const [formData, setFormData] = useState({
    Nombre: '',
    Descripcion: '',
    Monto: '',
    Moneda: 'ARS',
    Fechavencimiento: new Date().toISOString().split('T')[0],
    fecha_emision: '',
    Estado: 'pendiente',
    Tipo: 'factura',
    Prioridad: 'media',
    Recurrente: false,
    FrecuenciaRecurrencia: '',
    num_factura: '',
    url_pdf: '',
    comprobante: '',
    categorias_id: '',
    metodos_pago_id: '',
    Notas: ''
  });
  const formIds = {
    nombre: 'pending-payment-name',
    descripcion: 'pending-payment-description',
    factura: 'pending-payment-invoice-number',
    monto: 'pending-payment-amount',
    moneda: 'pending-payment-currency',
    vencimiento: 'pending-payment-due-date',
    categoria: 'pending-payment-category',
    metodoPago: 'pending-payment-method',
  };

  const [saving, setSaving] = useState(false);

  // Cargar datos si es edición
  useEffect(() => {
    if (payment && isOpen) {
      console.log('📝 Cargando pago para editar:', payment);

      setFormData({
        Nombre: payment.Nombre || payment.nombre || '',
        Descripcion: payment.Descripcion || payment.descripcion || '',
        Monto: payment.Monto || payment.monto || '',
        Moneda: payment.Moneda || payment.moneda || 'ARS',
        Fechavencimiento: (payment.Fechavencimiento || payment.fechavencimiento || payment.fechaVencimiento || payment.fecha_vencimiento || '').split('T')[0] || new Date().toISOString().split('T')[0],
        fecha_emision: (payment.fecha_emision || '').split('T')[0] || '',
        Estado: payment.Estado || payment.estado || 'pendiente',
        Tipo: payment.Tipo || payment.tipo || 'factura',
        Prioridad: payment.Prioridad || payment.prioridad || 'media',
        Recurrente: payment.Recurrente || payment.recurrente || false,
        FrecuenciaRecurrencia: payment.FrecuenciaRecurrencia || payment.frecuencia_recurrencia || '',
        num_factura: payment.num_factura || payment.NumFactura || '',
        url_pdf: payment.url_pdf || payment.UrlPdf || '',
        comprobante: payment.comprobante || payment.Comprobante || '',
        categorias_id: payment.categorias_id || payment.categoria_id || '',
        metodos_pago_id: payment.metodos_pago_id || payment.metodo_pago_id || '',
        Notas: payment.Notas || payment.notas || ''
      });
    }
  }, [payment, isOpen]);

  // Block scroll
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Limpiar campos vacíos (convertir '' a null para UUIDs)
      const cleanedData = { ...formData };

      // Campos UUID que deben ser null si están vacíos
      const uuidFields = ['categorias_id', 'metodos_pago_id'];
      uuidFields.forEach(field => {
        if (cleanedData[field] === '' || cleanedData[field] === undefined) {
          cleanedData[field] = null;
        }
      });

      // Campos de URL: convertir '' a null para que el backend limpie el valor en DB
      const urlFields = ['url_pdf', 'comprobante'];
      urlFields.forEach(field => {
        if (cleanedData[field] === '' || cleanedData[field] === undefined) {
          cleanedData[field] = null;
        }
      });

      // Campos numéricos
      if (cleanedData.interes === '' || cleanedData.interes === undefined) {
        cleanedData.interes = 0;
      }
      if (cleanedData.recargo === '' || cleanedData.recargo === undefined) {
        cleanedData.recargo = 0;
      }
      if (cleanedData.diasgracia === '' || cleanedData.diasgracia === undefined) {
        cleanedData.diasgracia = 0;
      }

      console.log('💾 Datos limpiados para guardar:', cleanedData);

      await onSave(cleanedData);
    } catch (error) {
      console.error('Error guardando:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" style={{ background: 'rgba(32,36,44,.4)' }} onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground"
        >

          {/* Header (Sticky) */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-popover px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="rounded-sm border border-border bg-muted p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h2 id={modalTitleId} className="font-serif text-[19px] font-bold text-foreground sm:text-[21px]">
                {payment ? 'Editar vencimiento' : 'Nuevo vencimiento'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal de vencimiento"
              className="rounded-sm p-2 text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content (Scrollable) */}
          <form onSubmit={handleSubmit} className="custom-scrollbar flex-1 space-y-7 overflow-y-auto p-6 sm:p-8">

            {/* Información Básica */}
            <section className="space-y-4">
              <div className="mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-[16px] font-semibold text-foreground">Información básica</h3>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={formIds.nombre} className={labelClassName}>Nombre del pago</label>
                  <input
                    id={formIds.nombre}
                    type="text"
                    value={formData.Nombre}
                    onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                    className={inputClassName}
                    placeholder="Ej: Netflix, Alquiler, Luz..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={formIds.descripcion} className={labelClassName}>Descripción</label>
                  <textarea
                    id={formIds.descripcion}
                    value={formData.Descripcion}
                    onChange={(e) => setFormData({...formData, Descripcion: e.target.value})}
                    className={`${inputClassName} resize-none`}
                    placeholder="Añadir una nota o descripción..."
                    rows={3}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={formIds.factura} className={labelClassName}>Número de factura</label>
                  <input
                    id={formIds.factura}
                    type="text"
                    value={formData.num_factura}
                    onChange={(e) => setFormData({...formData, num_factura: e.target.value})}
                    className={inputClassName}
                    placeholder="Ej: 001-00123456"
                  />
                </div>
              </div>
            </section>

            {/* Montos y Fechas */}
            <section className="space-y-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-[16px] font-semibold text-foreground">Montos y fechas</h3>
              </div>

              <div className="space-y-4">
                {/* Monto */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={formIds.monto} className={labelClassName}>Monto</label>
                  <input
                    id={formIds.monto}
                    type="number"
                    step="0.01"
                    value={formData.Monto}
                    onChange={(e) => setFormData({...formData, Monto: e.target.value})}
                    className={`${inputClassName} font-mono`}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Moneda */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={formIds.moneda} className={labelClassName}>Moneda</label>
                  <select
                    id={formIds.moneda}
                    value={formData.Moneda}
                    onChange={(e) => setFormData({...formData, Moneda: e.target.value})}
                    className={inputClassName}
                  >
                    <option value="ARS">ARS - Pesos Argentinos</option>
                    <option value="USD">USD - Dólares</option>
                    <option value="EUR">EUR - Euros</option>
                  </select>
                </div>

                {/* Fecha de Vencimiento */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={formIds.vencimiento} className={labelClassName}>Fecha de vencimiento</label>
                  <input
                    id={formIds.vencimiento}
                    type="date"
                    value={formData.Fechavencimiento}
                    onChange={(e) => setFormData({...formData, Fechavencimiento: e.target.value})}
                    className={`${inputClassName} font-mono text-[13px]`}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Categorización */}
            <section className="space-y-5">
              <div className="mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-[16px] font-semibold text-foreground">Categorización</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={formIds.categoria} className={labelClassName}>Categoría</label>
                  <select
                    id={formIds.categoria}
                    value={formData.categorias_id}
                    onChange={(e) => setFormData({...formData, categorias_id: e.target.value})}
                    className={inputClassName}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id || cat.Id} value={cat.id || cat.Id}>
                        {(cat.icono || cat.Icono || '📁')} {cat.nombre || cat.Nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={formIds.metodoPago} className={labelClassName}>Método de pago</label>
                  <select
                    id={formIds.metodoPago}
                    value={formData.metodos_pago_id}
                    onChange={(e) => setFormData({...formData, metodos_pago_id: e.target.value})}
                    className={inputClassName}
                  >
                    <option value="">Sin método</option>
                    {paymentMethods.map(pm => (
                      <option key={pm.id || pm.Id} value={pm.id || pm.Id}>
                        {(pm.icono || pm.Icono || '💳')} {pm.nombre || pm.Nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo de Gasto (Radio Buttons Pills) */}
              <fieldset className="space-y-3">
                <legend className={labelClassName}>Tipo de gasto</legend>
                <div className="flex flex-wrap gap-2">
                  {['Servicio', 'Factura', 'Alquiler', 'Otro'].map((tipo) => (
                    <label
                      key={tipo}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-popover ${
                        formData.Tipo.toLowerCase() === tipo.toLowerCase()
                          ? selectedPillClassName
                          : inactivePillClassName
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        value={tipo.toLowerCase()}
                        checked={formData.Tipo.toLowerCase() === tipo.toLowerCase()}
                        onChange={() => setFormData({...formData, Tipo: tipo.toLowerCase()})}
                        className="sr-only"
                      />
                      <span className="text-[12.5px] font-medium">{tipo}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Prioridad (Toggle Pills) */}
              <fieldset className="space-y-3">
                <legend className={labelClassName}>Prioridad</legend>
                <div className="inline-flex items-center gap-[3px] rounded-full border border-border bg-card p-[3px]">
                  {[
                    { value: 'baja', label: 'Baja', activeClassName: 'bg-primary text-primary-foreground' },
                    { value: 'media', label: 'Media', activeClassName: 'bg-accent text-accent-foreground' },
                    { value: 'alta', label: 'Alta', activeClassName: 'bg-destructive text-destructive-foreground' }
                  ].map((pri) => (
                    <label
                      key={pri.value}
                      className={`cursor-pointer rounded-full px-4 py-1.5 font-mono text-[12px] font-semibold transition-colors duration-150 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-popover ${
                        formData.Prioridad === pri.value ? pri.activeClassName : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="prioridad"
                        value={pri.value}
                        checked={formData.Prioridad === pri.value}
                        onChange={() => setFormData({...formData, Prioridad: pri.value})}
                        className="sr-only"
                      />
                      {pri.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            {/* Estado y Recurrencia */}
            <section className="space-y-5">
              <div className="mb-2 flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-[16px] font-semibold text-foreground">Estado y recurrencia</h3>
              </div>

              {/* Estado (Toggle Buttons) */}
              <fieldset className="flex flex-col gap-3">
                <legend className={labelClassName}>Estado actual</legend>
                <div className="flex rounded-full border border-border bg-card p-[3px]">
                  {[
                    { value: 'pendiente', label: 'Pendiente', activeClassName: 'bg-accent text-accent-foreground' },
                    { value: 'pagado', label: 'Pagado', activeClassName: 'bg-success text-success-foreground' },
                    { value: 'vencido', label: 'Vencido', activeClassName: 'bg-destructive text-destructive-foreground' }
                  ].map((estado) => (
                    <label
                      key={estado.value}
                      className={`flex-1 cursor-pointer rounded-full py-1.5 text-center text-[12.5px] font-semibold transition-colors duration-150 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-popover ${
                        formData.Estado === estado.value ? estado.activeClassName : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="estado"
                        value={estado.value}
                        checked={formData.Estado === estado.value}
                        onChange={() => setFormData({...formData, Estado: estado.value})}
                        className="sr-only"
                      />
                      {estado.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Recurrente (Toggle Switch) */}
              <div className="flex items-center justify-between rounded-md border border-border bg-secondary p-4">
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-medium text-foreground">Pago recurrente</span>
                  <span id="pending-payment-recurrence-description" className="text-[11.5px] text-muted-foreground">Se generará automáticamente cada período</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.Recurrente}
                  aria-label="Marcar vencimiento como pago recurrente"
                  aria-describedby="pending-payment-recurrence-description"
                  onClick={() => setFormData({...formData, Recurrente: !formData.Recurrente})}
                  className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150"
                  style={{ background: formData.Recurrente ? 'var(--primary)' : 'var(--muted)' }}
                >
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-secondary transition-all duration-150"
                    style={{ left: formData.Recurrente ? '18px' : '2px' }}
                  />
                </button>
              </div>

              {/* Frecuencia (solo si es recurrente) */}
              {formData.Recurrente && (
                <fieldset className="grid grid-cols-3 gap-2.5 pl-1">
                  <legend className="sr-only">Frecuencia de recurrencia</legend>
                  {['Semanal', 'Mensual', 'Anual'].map((freq) => (
                    <label
                      key={freq}
                      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border py-2.5 text-[12.5px] font-medium transition-all focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-popover ${
                        formData.FrecuenciaRecurrencia === freq.toLowerCase()
                          ? selectedPillClassName
                          : inactivePillClassName
                      }`}
                    >
                      <input
                        type="radio"
                        name="frecuencia-recurrencia"
                        value={freq.toLowerCase()}
                        checked={formData.FrecuenciaRecurrencia === freq.toLowerCase()}
                        onChange={() => setFormData({...formData, FrecuenciaRecurrencia: freq.toLowerCase()})}
                        className="sr-only"
                      />
                      {formData.FrecuenciaRecurrencia === freq.toLowerCase() && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      {freq}
                    </label>
                  ))}
                </fieldset>
              )}
            </section>

            {/* Documentos */}
            <section className="space-y-5 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-[16px] font-semibold text-foreground">Documentos</h3>
              </div>

              {/* ── FACTURA ORIGINAL (url_pdf) ── */}
              <FileUploadField
                label="Factura original"
                hint="El PDF o imagen de la factura/servicio a pagar"
                value={formData.url_pdf}
                onChange={(val) => setFormData({ ...formData, url_pdf: val })}
                previewTitle="Factura"
                accentColor="var(--info)"
                uploadPrefix="facturas"
              />

              {/* ── COMPROBANTE DE PAGO (comprobante) ── */}
              <FileUploadField
                label="Comprobante de pago"
                hint="El ticket o recibo que prueba que ya pagaste"
                value={formData.comprobante}
                onChange={(val) => setFormData({ ...formData, comprobante: val })}
                previewTitle="Comprobante"
                accentColor="var(--success)"
                uploadPrefix="comprobantes"
              />
            </section>
          </form>

          {/* Footer (Sticky) */}
          <div className="sticky bottom-0 z-20 flex items-center justify-end gap-3 border-t border-border bg-popover px-6 py-5 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`${secondaryButtonClassName} px-5 py-2.5 text-[13.5px] font-medium`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className={`flex items-center gap-2 rounded-sm px-5 py-2.5 text-[13.5px] font-semibold transition-colors duration-150 ${primaryButtonClassName}`}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(32, 36, 44, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(32, 36, 44, 0.25);
        }
      `}</style>
    </>
  );
};

StitchPendingPaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  payment: PropTypes.object,
  categories: PropTypes.array,
  paymentMethods: PropTypes.array
};

export default StitchPendingPaymentModal;
