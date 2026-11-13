import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { formatLocalDateOnly, formatLocalDateDisplay, isPagoPaid, parseLocalDateOnly } from '../../../utils/pendingPaymentStatus';
import { normalizeUploadFile, isAllowedUploadType } from '../../../utils/normalizeUploadFile';

const PendingPaymentPayModal = ({
  isOpen,
  payment,
  categories = [],
  paymentMethods = [],
  onClose,
  onConfirm
}) => {
  const { formatAmount } = useAmountVisibility();
  const [reviewing, setReviewing] = useState(false);
  const reviewSection = useRef(null);
  const returnFocus = useRef(null);
  const [normalizingFile, setNormalizingFile] = useState(false);
  const [formData, setFormData] = useState({
    fecha_pago: formatLocalDateOnly(new Date()),
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
      categories?.[0]?.id || categories?.[0]?.Id ||
      '';

    const metodoPagoId =
      payment?.metodo_pago_id ||
      payment?.metodos_pago_id ||
      paymentMethods?.[0]?.id || paymentMethods?.[0]?.Id ||
      '';

    setFormData({
      fecha_pago: formatLocalDateOnly(new Date()),
      categoria_id: categoriaId,
      metodo_pago_id: metodoPagoId,
      notas: `Pago de ${payment?.nombre || 'servicio'}`,
      comprobante: ''
    });
    setSelectedFile(null);
    setReviewing(false);
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

  useEffect(() => {
    if (reviewing) reviewSection.current?.focus();
  }, [reviewing]);

  if (!isOpen || !payment) return null;

  const handleFileSelect = async (event) => {
    const rawFile = event.target.files?.[0] || null;
    if (!rawFile) {
      setSelectedFile(null);
      return;
    }

    let file;
    setNormalizingFile(true);
    try {
      file = await normalizeUploadFile(rawFile);
    } catch (err) {
      setError(err.message || 'No se pudo convertir la foto HEIC. Probá con JPG o PNG.');
      setSelectedFile(null);
      return;
    } finally {
      setNormalizingFile(false);
    }

    if (!isAllowedUploadType(file)) {
      setError('Tipo de archivo no permitido. Use JPG, PNG, WEBP, GIF, PDF o HEIC.');
      setSelectedFile(null);
      return;
    }

    setError('');
    setSelectedFile(file);
  };

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
    if (saving || uploadingProof || normalizingFile) return;
    setError('');

    const category = categories.find((item) => String(item.id || item.Id) === String(formData.categoria_id));
    const method = paymentMethods.find((item) => String(item.id || item.Id) === String(formData.metodo_pago_id));
    if (!category || !method || !parseLocalDateOnly(formData.fecha_pago)) {
      setError('Seleccioná una fecha válida, categoría y método de pago para registrar el pago.');
      return;
    }
    if (isPagoPaid(payment) || !(payment.id || payment.Id) || !Number.isFinite(Number(payment.monto || payment.Monto)) || Number(payment.monto || payment.Monto) <= 0) {
      setError('Revisá el vencimiento: debe estar sin pagar y tener un importe válido.');
      return;
    }
    if (!reviewing) {
      setReviewing(true);
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

  const busy = saving || uploadingProof || normalizingFile;
  const displayAmount = formatAmount(Number(payment.monto || payment.Monto || 0), { decimals: 2, currency: false });
  const controlClass = 'min-h-11 w-full rounded-sm border border-border bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const category = categories.find((item) => String(item.id || item.Id) === String(formData.categoria_id));
  const method = paymentMethods.find((item) => String(item.id || item.Id) === String(formData.metodo_pago_id));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-lg bg-popover text-foreground sm:max-w-xl motion-reduce:animate-none"
        onOpenAutoFocus={() => { returnFocus.current = document.activeElement; }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
        onEscapeKeyDown={(event) => busy && event.preventDefault()}
        onInteractOutside={(event) => busy && event.preventDefault()}>
        <DialogTitle>{reviewing ? 'Confirmar registro de pago' : 'Registrar pago'}</DialogTitle>
        <DialogDescription>
          Registrás un pago en tus finanzas. No se envía dinero ni se realiza un débito desde esta pantalla.
        </DialogDescription>
        <p className="break-words font-semibold">{payment.nombre || payment.Nombre} · {payment.moneda || payment.Moneda || 'ARS'} {displayAmount}</p>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {reviewing ? (
            <section aria-label="Revisión del registro" className="space-y-3 rounded-md border border-border bg-secondary p-4 text-sm" tabIndex={-1} ref={reviewSection}>
              <p>Se registrará un pago por {payment.moneda || payment.Moneda || 'ARS'} {displayAmount}.</p>
              <p>Fecha: {formatLocalDateDisplay(formData.fecha_pago)}</p>
              <p>{method?.nombre || method?.Nombre} · {category?.nombre || category?.Nombre}</p>
              <p className="break-words">Notas: {formData.notas || 'Sin notas'}</p>
              <p className="break-words">Comprobante: {selectedFile?.name || (formData.comprobante ? 'Archivo subido' : 'Sin comprobante')}</p>
              <button type="button" disabled={busy} onClick={() => { setReviewing(false); setError(''); }} className={`${controlClass} hover:bg-card-hover disabled:opacity-50`}>Volver a editar</button>
            </section>
          ) : (
            <fieldset disabled={busy} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block">Fecha de pago</span>
                  <input type="date" value={formData.fecha_pago}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fecha_pago: e.target.value }))}
                    className={controlClass} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block">Método de pago</span>
                  <select value={formData.metodo_pago_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metodo_pago_id: e.target.value }))}
                    className={controlClass}>
                    <option value="">Seleccionar...</option>
                    {paymentMethods.map((item) => <option key={item.id || item.Id} value={item.id || item.Id}>{item.nombre || item.Nombre}</option>)}
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block">Categoría</span>
                <select value={formData.categoria_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categoria_id: e.target.value }))}
                  className={controlClass}>
                  <option value="">Seleccionar...</option>
                  {categories.map((item) => <option key={item.id || item.Id} value={item.id || item.Id}>{item.nombre || item.Nombre}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block">Seleccionar archivo</span>
                <input type="file" accept="image/*,.pdf,.heic,.heif,image/heic,image/heif"
                  onChange={handleFileSelect} className={controlClass} />
              </label>
              <p className="text-sm text-muted-foreground break-words">{normalizingFile ? 'Preparando comprobante…' : selectedFile?.name || 'Comprobante opcional. Se sube al confirmar el registro.'}</p>
              <label className="block text-sm">
                <span className="mb-1 block">Notas</span>
                <textarea value={formData.notas} rows={3}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
                  className={controlClass} />
              </label>
            </fieldset>
          )}
          {error && <p role="alert" className="rounded-sm border border-destructive bg-accent px-3 py-2 text-sm text-accent-foreground">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} disabled={busy}
              className="min-h-11 rounded-sm border border-border bg-secondary px-4 text-sm hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={busy}
              className="flex min-h-11 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
              {uploadingProof ? 'Subiendo comprobante…' : saving ? 'Guardando…' : reviewing ? 'Confirmar registro' : 'Revisar registro'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
