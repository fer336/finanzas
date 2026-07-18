import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Save,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Eye,
  Info,
  CreditCard,
  Repeat,
  Check,
  Link,
  Trash2,
  ExternalLink,
  Upload,
  AlertCircle,
  File
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// FileUploadField — upload de archivos a MinIO con preview + URL manual
// ─────────────────────────────────────────────────────────────────────────────
const FileUploadField = ({ label, hint, value, onChange, previewTitle, accentColor, uploadPrefix = 'comprobantes' }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const isImage = value && /\.(jpe?g|png|webp|gif|bmp|svg)(\?.*)?$/i.test(value);
  const isPdf   = value && /\.(pdf)(\?.*)?$/i.test(value);
  const hasFile = !!value;

  // ── Compresión de imágenes (adaptada de ComprobanteUploader) ──
  const compressImage = useCallback(async (file) => {
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
  }, []);

  // ── Subida a MinIO ──
  const doUpload = useCallback(async (file) => {
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
  }, [compressImage, onChange, uploadPrefix]);

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
        <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">
          <FileText className="h-3.5 w-3.5" style={{ color: accentColor }} />
          {label}
        </label>
        {hint && <span className="text-[11.5px] text-[#625f55] dark:text-[#c8c093]">{hint}</span>}
      </div>

      {/* ── Ya hay archivo subido → preview ── */}
      {hasFile && !showUrlInput && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-md border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37]">
            {isImage ? (
              <div className="relative">
                <img src={value} alt={previewTitle} className="max-h-56 w-full bg-[#f2ecbc] object-contain" />
                <a href={value} target="_blank" rel="noopener noreferrer"
                   className="absolute right-2 top-2 flex items-center gap-1.5 rounded-sm border border-[#c8bf91] bg-[#e5ddb0] px-3 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-[#e4d794] dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#363646]">
                  <ExternalLink className="h-3 w-3" /> Ver completo
                </a>
              </div>
            ) : isPdf ? (
              <div className="relative h-64">
                <iframe src={value} title={previewTitle} className="h-full w-full border-0" />
                <a href={value} target="_blank" rel="noopener noreferrer"
                   className="absolute right-2 top-2 flex items-center gap-1.5 rounded-sm border border-[#c8bf91] bg-[#e5ddb0] px-3 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-[#e4d794] dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#363646]">
                  <ExternalLink className="h-3 w-3" /> Abrir PDF
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4">
                <div className="rounded-sm p-2.5" style={{ backgroundColor: `${accentColor}1a` }}>
                  <FileText className="h-5 w-5" style={{ color: accentColor }} />
                </div>
                <p className="flex-1 truncate text-[12px] text-[#625f55] dark:text-[#c8c093]">{value}</p>
                <a href={value} target="_blank" rel="noopener noreferrer"
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
                    className="flex items-center gap-1.5 rounded-sm border border-[#b83245]/30 dark:border-[#e46876]/30 px-3 py-1.5 text-[11.5px] font-medium text-[#b83245] dark:text-[#e46876] transition-colors hover:bg-[#b83245]/10 dark:hover:bg-[#e46876]/10">
              <Trash2 className="h-3 w-3" /> Quitar
            </button>
            <button type="button" onClick={() => setShowUrlInput(true)}
                    className="ml-auto flex items-center gap-1.5 text-[11.5px] font-medium text-[#625f55] dark:text-[#c8c093] transition-colors hover:text-foreground">
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
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 cursor-pointer transition-all
                ${isDragging
                  ? 'border-primary bg-[#e4d794] dark:bg-[#2a2a37]'
                  : 'border-[#c8bf91] bg-white hover:border-[#625f55] hover:bg-[#e4d794]/50 dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#363646]'
                }
              `}
            >
              <Upload className="h-8 w-8" style={{ color: `${accentColor}99` }} />
              <p className="text-[13.5px] font-medium text-foreground">Subir archivo</p>
              <p className="text-center text-[11.5px] text-[#625f55] dark:text-[#c8c093]">
                Arrastrá un archivo o hace clic para seleccionar
              </p>
              <p className="text-[11px] text-[#625f55] dark:text-[#c8c093]">
                JPG, PNG, PDF — máx. 10MB
              </p>
            </div>
          )}

          {/* URL input (siempre visible cuando está en modo URL) */}
          <div className="flex gap-2">
            <input
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 rounded-sm border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] dark:placeholder:text-[#c8c093] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://..."
            />
            {value && (
              <button type="button" onClick={() => onChange('')}
                      className="rounded-sm border border-[#b83245]/30 dark:border-[#e46876]/30 p-3 text-[#b83245] dark:text-[#e46876] transition-colors hover:bg-[#b83245]/10 dark:hover:bg-[#e46876]/10"
                      title={`Quitar ${label.toLowerCase()}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Toggle: URL manual ⇄ upload */}
          {!hasFile && (
            <button type="button" onClick={() => setShowUrlInput(!showUrlInput)}
                    className="flex items-center gap-1 text-[11.5px] text-[#625f55] dark:text-[#c8c093] transition-colors hover:text-foreground">
              <Link className="h-3 w-3" />
              {showUrlInput ? 'Subir archivo en su lugar' : 'O pegar URL manualmente'}
            </button>
          )}
          {hasFile && showUrlInput && (
            <button type="button" onClick={() => setShowUrlInput(false)}
                    className="flex items-center gap-1 text-[11.5px] text-[#625f55] dark:text-[#c8c093] transition-colors hover:text-foreground">
              <FileText className="h-3 w-3" />
              Volver a vista de archivo
            </button>
          )}
        </div>
      )}

      {/* ── Progress bar ── */}
      {uploading && (
        <div className="space-y-2 rounded-md border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#43436c] dark:text-[#c8c093]">Subiendo archivo...</span>
            <span className="text-[13px] text-[#625f55] dark:text-[#c8c093]">{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#d5cea3]">
            <div className="h-full rounded-full transition-all duration-300"
                 style={{ width: `${uploadProgress}%`, backgroundColor: accentColor }} />
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-sm border border-[#b83245]/30 bg-[#b83245]/10 p-3 dark:border-[#e46876]/30 dark:bg-[#e46876]/10">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#b83245] dark:text-[#e46876]" />
          <span className="flex-1 text-[13px] text-[#b83245] dark:text-[#e46876]">{error}</span>
          <button type="button" onClick={() => setError(null)}
                  className="rounded-sm p-1 transition-colors hover:bg-[#b83245]/10 dark:hover:bg-[#e46876]/10">
            <X className="h-3.5 w-3.5 text-[#b83245] dark:text-[#e46876]" />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden"
             accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileSelect} />
    </div>
  );
};

/**
 * StitchPendingPaymentModal — alta/edición de Vencimiento, tema "Kanagawa"
 * (ver design_handoff_rediseno_papel/README.md "Interactions & Behavior":
 * "modal fondo #e5ddb0, overlay rgba(32,36,44,.4), radius 12px").
 */
const StitchPendingPaymentModal = ({
  isOpen,
  onClose,
  onSave,
  payment = null,
  categories = [],
  paymentMethods = []
}) => {
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
        <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#c8bf91] bg-[#e5ddb0] dark:border-[#363646] dark:bg-[#181820]">

          {/* Header (Sticky) */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#c8bf91] bg-[#e5ddb0] px-6 py-5 dark:border-[#363646] dark:bg-[#181820] sm:px-8">
            <div className="flex items-center gap-3">
              <div className="rounded-sm bg-[#e4d794] p-2 dark:bg-[#2a2a37]">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-serif text-[19px] font-bold text-foreground sm:text-[21px]">
                {payment ? 'Editar vencimiento' : 'Nuevo vencimiento'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-2 text-[#625f55] transition-colors hover:bg-black/5 hover:text-foreground dark:text-[#c8c093] dark:hover:bg-white/5"
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
                  <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Nombre del pago</label>
                  <input
                    type="text"
                    value={formData.Nombre}
                    onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                    className="rounded-sm border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] dark:placeholder:text-[#c8c093] focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: Netflix, Alquiler, Luz..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Descripción</label>
                  <textarea
                    value={formData.Descripcion}
                    onChange={(e) => setFormData({...formData, Descripcion: e.target.value})}
                    className="resize-none rounded-sm border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] dark:placeholder:text-[#c8c093] focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Añadir una nota o descripción..."
                    rows={3}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Número de factura</label>
                  <input
                    type="text"
                    value={formData.num_factura}
                    onChange={(e) => setFormData({...formData, num_factura: e.target.value})}
                    className="rounded-sm border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] dark:placeholder:text-[#c8c093] focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.Monto}
                    onChange={(e) => setFormData({...formData, Monto: e.target.value})}
                    className="rounded-sm border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] px-3.5 py-2.5 font-mono text-[13.5px] text-foreground placeholder:text-[#625f55] dark:placeholder:text-[#c8c093] focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Moneda */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Moneda</label>
                  <select
                    value={formData.Moneda}
                    onChange={(e) => setFormData({...formData, Moneda: e.target.value})}
                    className="rounded-sm border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] px-3.5 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="ARS">ARS - Pesos Argentinos</option>
                    <option value="USD">USD - Dólares</option>
                    <option value="EUR">EUR - Euros</option>
                  </select>
                </div>

                {/* Fecha de Vencimiento */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Fecha de vencimiento</label>
                  <input
                    type="date"
                    value={formData.Fechavencimiento}
                    onChange={(e) => setFormData({...formData, Fechavencimiento: e.target.value})}
                    className="rounded-sm border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] px-3.5 py-2.5 font-mono text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Categoría</label>
                  <select
                    value={formData.categorias_id}
                    onChange={(e) => setFormData({...formData, categorias_id: e.target.value})}
                    className="rounded-sm border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] px-3.5 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Método de pago</label>
                  <select
                    value={formData.metodos_pago_id}
                    onChange={(e) => setFormData({...formData, metodos_pago_id: e.target.value})}
                    className="rounded-sm border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] px-3.5 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              <div className="space-y-3">
                <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Tipo de gasto</label>
                <div className="flex flex-wrap gap-2">
                  {['Servicio', 'Factura', 'Alquiler', 'Otro'].map((tipo) => (
                    <label
                      key={tipo}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 transition-colors ${
                        formData.Tipo.toLowerCase() === tipo.toLowerCase()
                          ? 'border-[#545464] bg-[#e4d794] text-[#545464] dark:border-primary dark:bg-[#2a2a37] dark:text-foreground'
                          : 'border-[#c8bf91] bg-white text-[#625f55] hover:bg-[#e4d794]/50 dark:border-[#363646] dark:bg-[#2a2a37] dark:text-[#c8c093] dark:hover:bg-[#363646]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        checked={formData.Tipo.toLowerCase() === tipo.toLowerCase()}
                        onChange={() => setFormData({...formData, Tipo: tipo.toLowerCase()})}
                        className="hidden"
                      />
                      <span className="text-[12.5px] font-medium">{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prioridad (Toggle Pills) */}
              <div className="space-y-3">
                <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Prioridad</label>
                <div className="inline-flex items-center gap-[3px] rounded-full border border-[#c8bf91] dark:border-[#363646] bg-card p-[3px]">
                  {[
                    { value: 'baja', label: 'Baja', bg: 'var(--info)', text: '#e5ddb0' },
                    { value: 'media', label: 'Media', bg: '#f9d791', text: 'var(--foreground)' },
                    { value: 'alta', label: 'Alta', bg: 'var(--destructive)', text: '#e5ddb0' }
                  ].map((pri) => (
                    <button
                      key={pri.value}
                      type="button"
                      onClick={() => setFormData({...formData, Prioridad: pri.value})}
                      className="rounded-full px-4 py-1.5 font-mono text-[12px] font-semibold transition-colors duration-150"
                      style={
                        formData.Prioridad === pri.value
                          ? { backgroundColor: pri.bg, color: pri.text }
                          : { color: '#43436c' }
                      }
                    >
                      {pri.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Estado y Recurrencia */}
            <section className="space-y-5">
              <div className="mb-2 flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-[16px] font-semibold text-foreground">Estado y recurrencia</h3>
              </div>

              {/* Estado (Toggle Buttons) */}
              <div className="flex flex-col gap-3">
                <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Estado actual</label>
                <div className="flex rounded-full border border-[#c8bf91] dark:border-[#363646] bg-card p-[3px]">
                  {[
                    { value: 'pendiente', label: 'Pendiente', bg: '#f9d791', text: 'var(--foreground)' },
                    { value: 'pagado', label: 'Pagado', bg: 'var(--success)', text: '#e5ddb0' },
                    { value: 'vencido', label: 'Vencido', bg: 'var(--destructive)', text: '#e5ddb0' }
                  ].map((estado) => (
                    <button
                      key={estado.value}
                      type="button"
                      onClick={() => setFormData({...formData, Estado: estado.value})}
                      className="flex-1 rounded-full py-1.5 text-[12.5px] font-semibold transition-colors duration-150"
                      style={
                        formData.Estado === estado.value
                          ? { backgroundColor: estado.bg, color: estado.text }
                          : { color: '#43436c' }
                      }
                    >
                      {estado.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurrente (Toggle Switch) */}
              <div className="flex items-center justify-between rounded-md border border-[#c8bf91] dark:border-[#363646] bg-white dark:bg-[#2a2a37] p-4">
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-medium text-foreground">Pago recurrente</span>
                  <span className="text-[11.5px] text-[#625f55] dark:text-[#c8c093]">Se generará automáticamente cada período</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.Recurrente}
                  onClick={() => setFormData({...formData, Recurrente: !formData.Recurrente})}
                  className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150"
                  style={{ background: formData.Recurrente ? 'var(--success)' : '#d8d6cf' }}
                >
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white dark:bg-[#2a2a37] transition-all duration-150"
                    style={{ left: formData.Recurrente ? '18px' : '2px' }}
                  />
                </button>
              </div>

              {/* Frecuencia (solo si es recurrente) */}
              {formData.Recurrente && (
                <div className="grid grid-cols-3 gap-2.5 pl-1">
                  {['Semanal', 'Mensual', 'Anual'].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFormData({...formData, FrecuenciaRecurrencia: freq.toLowerCase()})}
                      className={`flex items-center justify-center gap-1.5 rounded-sm border py-2.5 text-[12.5px] font-medium transition-all ${
                        formData.FrecuenciaRecurrencia === freq.toLowerCase()
                          ? 'border-primary bg-[#e4d794] font-semibold text-primary dark:bg-[#2a2a37]'
                          : 'border-[#c8bf91] bg-white text-[#625f55] hover:bg-[#e4d794]/50 dark:border-[#363646] dark:bg-[#2a2a37] dark:text-[#c8c093] dark:hover:bg-[#363646]'
                      }`}
                    >
                      {formData.FrecuenciaRecurrencia === freq.toLowerCase() && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      {freq}
                    </button>
                  ))}
                </div>
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
          <div className="sticky bottom-0 z-20 flex items-center justify-end gap-3 border-t border-[#c8bf91] bg-[#e5ddb0] px-6 py-5 dark:border-[#363646] dark:bg-[#181820] sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-sm border border-[#c8bf91] bg-white px-5 py-2.5 text-[13.5px] font-medium text-foreground transition-colors duration-150 hover:bg-[#e4d794] disabled:opacity-50 dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#363646]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] disabled:opacity-50 dark:hover:bg-[#76946a]"
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
