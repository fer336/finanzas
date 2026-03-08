import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// DocField — campo editable con preview de imagen / PDF / link genérico
// ─────────────────────────────────────────────────────────────────────────────
const DocField = ({ label, hint, value, onChange, previewTitle, accentColor }) => {
  const isImage = value && /\.(jpe?g|png|webp|gif|bmp|svg)(\?.*)?$/i.test(value);
  const isPdf   = value && /\.(pdf)(\?.*)?$/i.test(value);

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex flex-col gap-0.5 ml-1">
        <label className="text-white text-sm font-semibold flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5" style={{ color: accentColor }} />
          {label}
        </label>
        {hint && <span className="text-gray-500 text-xs">{hint}</span>}
      </div>

      {/* Input + clear */}
      <div className="flex gap-2">
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-600 text-sm"
          style={{ '--tw-ring-color': `${accentColor}80` }}
          placeholder="https://..."
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
            title={`Quitar ${label.toLowerCase()}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preview */}
      {value && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
          {isImage ? (
            <div className="relative">
              <img
                src={value}
                alt={previewTitle}
                className="w-full max-h-56 object-contain bg-black/40"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg text-white text-xs font-medium hover:bg-black/80 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Ver completo
              </a>
            </div>
          ) : isPdf ? (
            <div className="relative h-64">
              <iframe
                src={value}
                title={previewTitle}
                className="w-full h-full border-0"
              />
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg text-white text-xs font-medium hover:bg-black/80 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir PDF
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${accentColor}1a` }}>
                <FileText className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <p className="text-gray-400 text-xs truncate flex-1">{value}</p>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0"
                style={{ backgroundColor: `${accentColor}1a`, color: accentColor, border: `1px solid ${accentColor}40` }}
              >
                <ExternalLink className="w-3 h-3" />
                Abrir
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * StitchPendingPaymentModal - Modal moderno diseñado con Stitch
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-[#18181b]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          
          {/* Header (Sticky) */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-6 border-b border-white/10 bg-[#18181b]/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="bg-[#10b981]/20 p-2 rounded-lg">
                <Calendar className="w-6 h-6 text-[#10b981]" />
              </div>
              <h2 className="text-white text-xl font-bold">
                {payment ? 'Editar Pago Pendiente' : 'Nuevo Pago Pendiente'}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>

          {/* Content (Scrollable) */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
            
            {/* Información Básica */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-[#10b981]" />
                <h3 className="text-white font-semibold text-lg">Información Básica</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-sm font-medium ml-1">Nombre del Pago</label>
                  <input
                    type="text"
                    value={formData.Nombre}
                    onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981] transition-all placeholder:text-gray-600"
                    placeholder="Ej: Netflix, Alquiler, Luz..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-sm font-medium ml-1">Descripción</label>
                  <textarea
                    value={formData.Descripcion}
                    onChange={(e) => setFormData({...formData, Descripcion: e.target.value})}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 transition-all placeholder:text-gray-600 resize-none"
                    placeholder="Añadir una nota o descripción..."
                    rows={3}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-sm font-medium ml-1">Número de Factura</label>
                  <input
                    type="text"
                    value={formData.num_factura}
                    onChange={(e) => setFormData({...formData, num_factura: e.target.value})}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 placeholder:text-gray-600"
                    placeholder="Ej: 001-00123456"
                  />
                </div>
              </div>
            </section>

            {/* Montos y Fechas */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-[#10b981]" />
                <h3 className="text-white font-semibold text-lg">Montos y Fechas</h3>
              </div>

              <div className="space-y-4">
                {/* Monto */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-sm font-medium ml-1">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.Monto}
                    onChange={(e) => setFormData({...formData, Monto: e.target.value})}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 placeholder:text-gray-600"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Moneda */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-sm font-medium ml-1">Moneda</label>
                  <select
                    value={formData.Moneda}
                    onChange={(e) => setFormData({...formData, Moneda: e.target.value})}
                    className="select-field"
                  >
                    <option value="ARS">ARS - Pesos Argentinos</option>
                    <option value="USD">USD - Dólares</option>
                    <option value="EUR">EUR - Euros</option>
                  </select>
                </div>

                {/* Fecha de Vencimiento */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-sm font-medium ml-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={formData.Fechavencimiento}
                    onChange={(e) => setFormData({...formData, Fechavencimiento: e.target.value})}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 [color-scheme:dark]"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Categorización */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 text-[#10b981]" />
                <h3 className="text-white font-semibold text-lg">Categorización</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-sm font-medium ml-1">Categoría</label>
                  <select
                    value={formData.categorias_id}
                    onChange={(e) => setFormData({...formData, categorias_id: e.target.value})}
                    className="select-field"
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
                  <label className="text-gray-400 text-sm font-medium ml-1">Método de Pago</label>
                  <select
                    value={formData.metodos_pago_id}
                    onChange={(e) => setFormData({...formData, metodos_pago_id: e.target.value})}
                    className="select-field"
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
                <label className="text-gray-400 text-sm font-medium ml-1">Tipo de Gasto</label>
                <div className="flex flex-wrap gap-3">
                  {['Servicio', 'Factura', 'Alquiler', 'Otro'].map((tipo) => (
                    <label 
                      key={tipo}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer transition-colors ${
                        formData.Tipo.toLowerCase() === tipo.toLowerCase()
                          ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        checked={formData.Tipo.toLowerCase() === tipo.toLowerCase()}
                        onChange={() => setFormData({...formData, Tipo: tipo.toLowerCase()})}
                        className="hidden"
                      />
                      <span className="text-sm font-medium">{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prioridad (Toggle Pills) */}
              <div className="space-y-3">
                <label className="text-gray-400 text-sm font-medium ml-1">Prioridad</label>
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                  {[
                    { value: 'baja', label: 'Baja', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                    { value: 'media', label: 'Media', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
                    { value: 'alta', label: 'Alta', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
                  ].map((pri) => (
                    <button
                      key={pri.value}
                      type="button"
                      onClick={() => setFormData({...formData, Prioridad: pri.value})}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        formData.Prioridad === pri.value
                          ? `${pri.color} border`
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {pri.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Estado y Recurrencia */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Repeat className="w-5 h-5 text-[#10b981]" />
                <h3 className="text-white font-semibold text-lg">Estado y Recurrencia</h3>
              </div>

              {/* Estado (Toggle Buttons) */}
              <div className="flex flex-col gap-3">
                <label className="text-gray-400 text-sm font-medium ml-1">Estado actual</label>
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                  {[
                    { value: 'pendiente', label: 'Pendiente', color: 'bg-[#10b981] text-white' },
                    { value: 'pagado', label: 'Pagado', color: 'bg-[#10b981] text-white' },
                    { value: 'vencido', label: 'Vencido', color: 'bg-red-500 text-white' }
                  ].map((estado) => (
                    <button
                      key={estado.value}
                      type="button"
                      onClick={() => setFormData({...formData, Estado: estado.value})}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        formData.Estado === estado.value
                          ? `${estado.color} shadow-lg`
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {estado.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurrente (Toggle Switch) */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Pago Recurrente</span>
                  <span className="text-gray-500 text-xs">Se generará automáticamente cada período</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.Recurrente}
                    onChange={(e) => setFormData({...formData, Recurrente: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
                </label>
              </div>

              {/* Frecuencia (solo si es recurrente) */}
              {formData.Recurrente && (
                <div className="grid grid-cols-3 gap-3 pl-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {['Semanal', 'Mensual', 'Anual'].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFormData({...formData, FrecuenciaRecurrencia: freq.toLowerCase()})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.FrecuenciaRecurrencia === freq.toLowerCase()
                          ? 'border-[#10b981]/50 bg-[#10b981]/10 text-[#10b981] font-bold'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {formData.FrecuenciaRecurrencia === freq.toLowerCase() && (
                        <Check className="w-4 h-4" />
                      )}
                      {freq}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Documentos */}
            <section className="space-y-6 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#10b981]" />
                <h3 className="text-white font-semibold text-lg">Documentos</h3>
              </div>

              {/* ── FACTURA ORIGINAL (url_pdf) ── */}
              <DocField
                label="Factura original"
                hint="El PDF o imagen de la factura/servicio a pagar"
                value={formData.url_pdf}
                onChange={(val) => setFormData({ ...formData, url_pdf: val })}
                previewTitle="Factura"
                accentColor="#6366f1"
              />

              {/* ── COMPROBANTE DE PAGO (comprobante) ── */}
              <DocField
                label="Comprobante de pago"
                hint="El ticket o recibo que prueba que ya pagaste"
                value={formData.comprobante}
                onChange={(val) => setFormData({ ...formData, comprobante: val })}
                previewTitle="Comprobante"
                accentColor="#10b981"
              />
            </section>
          </form>

          {/* Footer (Sticky) */}
          <div className="sticky bottom-0 z-20 px-8 py-6 border-t border-white/10 bg-[#18181b]/80 backdrop-blur-md flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-bold shadow-lg shadow-[#10b981]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .select-field {
          background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: white;
          width: 100%;
          outline: none;
          transition: border-color .15s, box-shadow .15s, background .15s;
        }
        .select-field:focus {
          border-color: rgba(16, 185, 129, 0.7);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
          background: linear-gradient(180deg, rgba(16,185,129,0.14), rgba(16,185,129,0.06));
        }
        .select-field option { background: #18181b; color: white; }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
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
