import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Calendar, FileUp, Loader2, Upload, X } from 'lucide-react';

/**
 * PrestamoPayModal — marcar un préstamo como devuelto. Mismo flujo que
 * PendingPaymentPayModal: sube comprobante a MinIO y llama a
 * onConfirm con item_type='prestamo', precargando el monto con
 * monto_a_devolver (no monto_prestado).
 */
const PrestamoPayModal = ({
  isOpen,
  prestamo,
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

    setFormData({
      fecha_pago: new Date().toISOString().split('T')[0],
      categoria_id: categories?.[0]?.id || '',
      metodo_pago_id: paymentMethods?.[0]?.id || '',
      notas: `Devolución de préstamo — ${prestamo?.nombre_fuente || ''}`,
      comprobante: ''
    });
    setSelectedFile(null);
    setError('');
  }, [isOpen, prestamo, categories, paymentMethods]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen || !prestamo) return null;

  const fieldClassName = 'w-full rounded-sm border border-[#ddd5c2] bg-white px-3 py-2.5 text-[13px] text-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#2e3844] dark:bg-[#212836] dark:text-foreground dark:placeholder:text-[#93a0af]';

  const uploadToMinIO = async () => {
    if (!selectedFile) return formData.comprobante;

    const backendBaseUrl = import.meta.env.MODE === 'production' ? '' : 'http://localhost:8000';
    const endpoint = `${backendBaseUrl}/api/files/upload?prefix=comprobantes`;

    setUploadingProof(true);
    try {
      const body = new FormData();
      body.append('file', selectedFile);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(endpoint, {
        method: 'POST',
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
      setError('Seleccioná categoría y método de pago para registrar la devolución.');
      return;
    }

    setSaving(true);
    try {
      const comprobanteUrl = await uploadToMinIO();

      await onConfirm({
        item_id: prestamo.id,
        monto: prestamo.monto_a_devolver || 0,
        moneda: prestamo.moneda || 'ARS',
        fecha_pago: formData.fecha_pago,
        categoria_id: formData.categoria_id,
        metodo_pago_id: formData.metodo_pago_id,
        notas: formData.notas,
        comprobante: comprobanteUrl || formData.comprobante || null
      });
    } catch (submitError) {
      setError(submitError.message || 'No se pudo registrar la devolución.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(32,36,44,.4)' }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-[12px] border border-[#ddd5c2] dark:border-[#2e3844] bg-[#faf7ef] dark:bg-[#1a2029]">
        <div className="flex items-center justify-between border-b border-[#e7e0cf] dark:border-[#2e3844] p-5">
          <div>
            <h2 className="font-serif text-[20px] font-bold text-foreground">Registrar devolución</h2>
            <p className="mt-0.5 text-[12.5px] text-[#5d6470] dark:text-[#93a0af]">
              {prestamo.nombre_fuente} · <span className="font-mono">{(prestamo.monto_a_devolver || 0).toLocaleString('es-AR')}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-2 transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
            type="button"
          >
            <X className="w-5 h-5 text-[#8a8677] dark:text-[#93a0af]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-[12.5px] text-[#5d6470] dark:text-[#93a0af]">
              <span className="block mb-1">Fecha de devolución</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8677] dark:text-[#93a0af]" />
                <input
                  type="date"
                  value={formData.fecha_pago}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fecha_pago: e.target.value }))}
                  className={`${fieldClassName} pl-10 font-mono`}
                />
              </div>
            </label>

            <label className="text-[12.5px] text-[#5d6470] dark:text-[#93a0af]">
              <span className="block mb-1">Método de pago</span>
              <select
                value={formData.metodo_pago_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, metodo_pago_id: e.target.value }))}
                className={fieldClassName}
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

          <label className="text-[12.5px] text-[#5d6470] dark:text-[#93a0af] block">
            <span className="block mb-1">Categoría</span>
            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoria_id: e.target.value }))}
              className={fieldClassName}
            >
              <option value="">Seleccionar...</option>
              {categories.map((category) => (
                <option key={category.id || category.Id} value={category.id || category.Id}>
                  {category.nombre || category.Nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="text-[12.5px] text-[#5d6470] dark:text-[#93a0af] block">
            <span className="block mb-1">Comprobante (se sube a MinIO)</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#ddd5c2] rounded-sm cursor-pointer transition-colors duration-150 hover:bg-[#f0ead9] dark:border-[#2e3844] dark:bg-[#212836] dark:hover:bg-[#2e3844]">
                <Upload className="w-4 h-4 text-[#5a7d52]" />
                <span className="text-[13px] text-foreground">Seleccionar archivo</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <span className="text-[12px] text-[#8a8677] dark:text-[#93a0af] truncate max-w-xs">{selectedFile.name}</span>
              )}
            </div>
          </label>

          <label className="text-[12.5px] text-[#5d6470] dark:text-[#93a0af] block">
            <span className="block mb-1">Notas</span>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
              rows={3}
              className={`${fieldClassName} text-[13.5px]`}
            />
          </label>

          {error && (
            <div className="text-[12.5px] text-[#a04a34] bg-[#fdf6e3] border border-[#e0c98a] rounded-sm px-3 py-2 dark:border-[#d8ac5a] dark:bg-[rgba(216,172,90,0.14)] dark:text-[#c26a52]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-[#ddd5c2] bg-white px-[15px] py-[8px] text-[13px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9] disabled:opacity-50 dark:border-[#2e3844] dark:bg-[#212836] dark:hover:bg-[#2e3844]"
              disabled={saving || uploadingProof}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploadingProof}
              className="flex items-center gap-2 rounded-sm bg-primary px-[15px] py-[8px] text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047] disabled:opacity-50 dark:hover:bg-[#7d9970]"
            >
              {(saving || uploadingProof) ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              {uploadingProof ? 'Subiendo comprobante a MinIO...' : saving ? 'Guardando...' : 'Confirmar devolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

PrestamoPayModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  prestamo: PropTypes.object,
  categories: PropTypes.array,
  paymentMethods: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

PrestamoPayModal.defaultProps = {
  prestamo: null,
  categories: [],
  paymentMethods: []
};

export default PrestamoPayModal;
