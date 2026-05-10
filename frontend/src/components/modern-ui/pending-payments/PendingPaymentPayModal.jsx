import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Calendar, FileUp, Loader2, Upload, X } from 'lucide-react';

const PendingPaymentPayModal = ({
  isOpen,
  payment,
  categories,
  paymentMethods,
  onClose,
  onConfirm
}) => {
  const [formData, setFormData] = useState({
    fecha_pago: new Date().toISOString().split('T')[0],
    categoria_id: '',
    metodo_pago_id: '',
    notas: '',
    comprobante: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const categoriaId =
      payment?.categoria_id ||
      payment?.categorias_id ||
      categories?.[0]?.id ||
      '';

    const metodoPagoId =
      payment?.metodo_pago_id ||
      payment?.metodos_pago_id ||
      paymentMethods?.[0]?.id ||
      '';

    setFormData({
      fecha_pago: new Date().toISOString().split('T')[0],
      categoria_id: categoriaId,
      metodo_pago_id: metodoPagoId,
      notas: `Pago de ${payment?.nombre || 'servicio'}`,
      comprobante: ''
    });
    setSelectedFile(null);
    setError('');
  }, [isOpen, payment, categories, paymentMethods]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen || !payment) return null;

  const uploadToMinIO = async () => {
    if (!selectedFile) return formData.comprobante;

    const backendBaseUrl = import.meta.env.MODE === 'production' ? '' : 'http://localhost:8000';
    const endpoint = `${backendBaseUrl}/api/files/upload?prefix=comprobantes`;

    setUploadingProof(true);
    try {
      const body = new FormData();
      body.append('file', selectedFile);

      const response = await fetch(endpoint, {
        method: 'POST',
        body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'No se pudo subir el comprobante');
      }

      const data = await response.json();
      const fileUrl = data.data?.file_url || data.data?.url || data.file_url || data.url;
      if (!fileUrl) {
        throw new Error('El servidor no devolvió la URL del comprobante');
      }

      setFormData((prev) => ({ ...prev, comprobante: fileUrl }));
      return fileUrl;
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.categoria_id || !formData.metodo_pago_id) {
      setError('Seleccioná categoría y método de pago para registrar el pago.');
      return;
    }

    setSaving(true);
    try {
      const comprobanteUrl = await uploadToMinIO();

      await onConfirm({
        item_id: payment.id || payment.Id,
        monto: payment.monto || payment.Monto || 0,
        moneda: payment.moneda || payment.Moneda || 'ARS',
        fecha_pago: formData.fecha_pago,
        categoria_id: formData.categoria_id,
        metodo_pago_id: formData.metodo_pago_id,
        notas: formData.notas,
        comprobante: comprobanteUrl || formData.comprobante || null
      });
    } catch (submitError) {
      setError(submitError.message || 'No se pudo registrar el pago.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Registrar Pago</h2>
            <p className="text-sm text-gray-400">{payment.nombre} - {(payment.monto || 0).toLocaleString('es-AR')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-white/80">
              <span className="block mb-1">Fecha de pago</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.fecha_pago}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fecha_pago: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#10b981]/40"
                />
              </div>
            </label>

            <label className="text-sm text-white/80">
              <span className="block mb-1">Método de pago</span>
              <select
                value={formData.metodo_pago_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, metodo_pago_id: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#10b981]/40"
              >
                <option value="">Seleccionar...</option>
                {paymentMethods.map((method) => (
                  <option key={method.id || method.Id} value={method.id || method.Id}>
                    {method.nombre || method.Nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-sm text-white/80 block">
            <span className="block mb-1">Categoría</span>
            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoria_id: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#10b981]/40"
            >
              <option value="">Seleccionar...</option>
              {categories.map((category) => (
                <option key={category.id || category.Id} value={category.id || category.Id}>
                  {category.nombre || category.Nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-white/80 block">
            <span className="block mb-1">Comprobante (se sube a MinIO)</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl cursor-pointer hover:border-[#10b981]/40 transition-colors">
                <Upload className="w-4 h-4 text-[#10b981]" />
                <span className="text-sm text-white">Seleccionar archivo</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <span className="text-xs text-gray-400 truncate max-w-xs">{selectedFile.name}</span>
              )}
            </div>
          </label>

          <label className="text-sm text-white/80 block">
            <span className="block mb-1">Notas</span>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#10b981]/40"
            />
          </label>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              disabled={saving || uploadingProof}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploadingProof}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {(saving || uploadingProof) ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              {uploadingProof ? 'Subiendo comprobante a MinIO...' : saving ? 'Guardando...' : 'Confirmar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

PendingPaymentPayModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  payment: PropTypes.object,
  categories: PropTypes.array,
  paymentMethods: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

PendingPaymentPayModal.defaultProps = {
  payment: null,
  categories: [],
  paymentMethods: []
};

export default PendingPaymentPayModal;
