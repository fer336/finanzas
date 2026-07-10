/**
 * ReportesBugsView - Sistema de Reportes y Bugs
 * Crea issues en Linear (proyecto Sistema Finanzas) directamente desde la app.
 * El webhook de Linear notifica automáticamente a Telegram vía n8n.
 *
 * Tema "Papel": vive como sub-sección embebida dentro de Ajustes (ver
 * design_handoff_rediseno_papel/README.md "7. Ajustes"), por eso no trae
 * fondo de página propio.
 */

import { useEffect, useState, useRef } from 'react';
import {
  Bug,
  Sparkles,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
  X,
  ExternalLink,
  Loader2,
  ChevronDown,
  ImageIcon,
  Info,
  Zap,
  MessageSquare,
  Tag,
} from 'lucide-react';
import apiServices from '../../../services/api';

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = [
  {
    id: 'Bug',
    label: 'Bug',
    emoji: '🐛',
    icon: Bug,
    description: 'Algo no funciona como debería',
    color: '#a04a34',
  },
  {
    id: 'Feature',
    label: 'Feature',
    emoji: '✨',
    icon: Sparkles,
    description: 'Nueva funcionalidad que me gustaría',
    color: '#8a6fa0',
  },
  {
    id: 'Improvement',
    label: 'Mejora',
    emoji: '🔧',
    icon: Wrench,
    description: 'Algo que podría funcionar mejor',
    color: '#3d5a80',
  },
];

const PRIORIDADES = [
  { id: 'urgent', label: 'Urgente', emoji: '🔴', description: 'Bloquea el uso del sistema' },
  { id: 'high',   label: 'Alta',    emoji: '🟠', description: 'Impacto significativo' },
  { id: 'normal', label: 'Normal',  emoji: '🟡', description: 'Afecta la experiencia' },
  { id: 'low',    label: 'Baja',    emoji: '🟢', description: 'Mejora menor' },
];

const SECCIONES = [
  'Dashboard',
  'Transacciones',
  'Presupuestos',
  'Objetivos de Ahorro',
  'Tarjetas de Crédito',
  'CEDEARs',
  'Cotización Dólar',
  'Categorías',
  'Métodos de Pago',
  'Pagos Pendientes',
  'Lucy (IA)',
  'Monedas',
  'Configuración',
  'Login / Autenticación',
  'Otro',
];

const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const stateBadge = (stateType) => {
  if (stateType === 'completed') return 'border-[#5a7d52] bg-[#5a7d52]/10 text-[#476442]';
  if (stateType === 'canceled') return 'border-[#ddd5c2] bg-[#f0ead9] text-[#8a8677]';
  return 'border-[#e0c98a] bg-[#fdf6e3] text-[#8a6a1f]';
};

// ─── Componente principal ─────────────────────────────────────────────────────

const ReportesBugsView = () => {
  // Form state
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('Bug');
  const [prioridad, setPrioridad] = useState('normal');
  const [seccion, setSeccion] = useState('');
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);

  // UI state
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [resultado, setResultado] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [imagenError, setImagenError] = useState('');
  const [misReportes, setMisReportes] = useState([]);
  const [reportesLoading, setReportesLoading] = useState(true);
  const [reportesError, setReportesError] = useState('');

  const fileInputRef = useRef(null);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleImagenChange = (e) => {
    const file = e.target.files?.[0];
    setImagenError('');
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImagenError('Tipo no permitido. Usá JPG, PNG, WEBP o GIF.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setImagenError(`La imagen supera el máximo de ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    setImagen(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagenPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImagen = () => {
    setImagen(null);
    setImagenPreview(null);
    setImagenError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setTipo('Bug');
    setPrioridad('normal');
    setSeccion('');
    removeImagen();
    setStatus('idle');
    setResultado(null);
    setErrorMsg('');
  };

  const cargarMisReportes = async ({ silent = false } = {}) => {
    if (!silent) setReportesLoading(true);
    setReportesError('');

    try {
      const data = await apiServices.reportesApi.listarMis(50);
      setMisReportes(data.reportes || []);
    } catch (err) {
      setReportesError(err.message || 'No pude cargar tus reportes por ahora.');
    } finally {
      if (!silent) setReportesLoading(false);
    }
  };

  useEffect(() => {
    cargarMisReportes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!titulo.trim() || titulo.trim().length < 5) {
      setErrorMsg('El título debe tener al menos 5 caracteres.');
      return;
    }
    if (!descripcion.trim() || descripcion.trim().length < 10) {
      setErrorMsg('La descripción debe tener al menos 10 caracteres.');
      return;
    }
    if (!seccion) {
      setErrorMsg('Seleccioná la sección donde ocurre el problema.');
      return;
    }

    setErrorMsg('');
    setStatus('loading');

    try {
      const formData = new FormData();
      formData.append('titulo', titulo.trim());
      formData.append('descripcion', descripcion.trim());
      formData.append('tipo', tipo);
      formData.append('prioridad', prioridad);
      formData.append('seccion', seccion);
      if (imagen) formData.append('imagen', imagen);

      const data = await apiServices.reportesApi.crear(formData);
      setResultado(data);
      setStatus('success');
      cargarMisReportes({ silent: true });
    } catch (err) {
      setErrorMsg(err.message || 'Error al enviar el reporte. Intentá de nuevo.');
      setStatus('error');
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

  const tipoActivo = TIPOS.find((t) => t.id === tipo);
  const charsTitulo = titulo.length;
  const charsDesc = descripcion.length;

  // ─── Success state ────────────────────────────────────────────────────────
  if (status === 'success' && resultado) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-full max-w-lg text-center">
          <div className="rounded-md border border-[#ddd5c2] bg-white p-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#5a7d52] bg-[#5a7d52]/10">
              <CheckCircle2 className="h-8 w-8 text-[#476442]" />
            </div>
            <h2 className="mb-2 font-serif text-[20px] font-semibold text-foreground">¡Reporte enviado!</h2>
            <p className="mb-1 text-[13.5px] text-[#5d6470]">{resultado.message}</p>
            <p className="mb-6 text-[12px] text-[#8a8677]">Ya recibí una notificación en Telegram 📱</p>

            <div className="mb-6 rounded-sm border border-[#ddd5c2] bg-[#f0ead9] p-4 text-left">
              <div className="mb-2 flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-[#8a8677]" />
                <span className="text-[11px] uppercase tracking-[.06em] text-[#8a8677]">Issue creado</span>
              </div>
              <p className="font-mono text-[15px] font-semibold text-foreground">{resultado.issue_identifier}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={resultado.issue_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-sm bg-primary px-5 py-[9px] text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047]"
              >
                <ExternalLink className="h-4 w-4" />
                Ver en Linear
              </a>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-sm border border-[#ddd5c2] bg-white px-5 py-[9px] text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-[#f0ead9]"
              >
                Enviar otro reporte
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────
  return (
    <div>
      <p className="mb-4 text-[12.5px] text-[#8a8677]">
        Reportá bugs, sugerí mejoras o pedí nuevas funcionalidades — se crea un issue en Linear al instante.
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Formulario (2/3) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Tipo — pills */}
            <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
              <label className="mb-3 block text-[12.5px] font-medium text-[#5d6470]">
                Tipo de reporte *
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {TIPOS.map((t) => {
                  const Icon = t.icon;
                  const isActive = tipo === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipo(t.id)}
                      className="flex flex-col items-center gap-1.5 rounded-sm border p-3 transition-colors duration-150"
                      style={{
                        borderColor: isActive ? t.color : '#ddd5c2',
                        backgroundColor: isActive ? `${t.color}1a` : '#ffffff',
                        color: isActive ? t.color : '#8a8677',
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[12px] font-semibold">{t.label}</span>
                      <span className="hidden text-center text-[10px] leading-tight opacity-80 sm:block">
                        {t.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Título */}
            <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[12.5px] font-medium text-[#5d6470]">Título *</label>
                <span className={`font-mono text-[11px] ${charsTitulo > 180 ? 'text-[#a04a34]' : 'text-[#8a8677]'}`}>
                  {charsTitulo}/200
                </span>
              </div>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={`Ej: ${tipo === 'Bug' ? 'Las transacciones no cargan en marzo' : tipo === 'Feature' ? 'Agregar exportación a Excel' : 'Mejorar la velocidad del dashboard'}`}
                maxLength={200}
                className="w-full rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#8a8677] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Descripción */}
            <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[12.5px] font-medium text-[#5d6470]">Descripción detallada *</label>
                <span className={`font-mono text-[11px] ${charsDesc > 2700 ? 'text-[#a04a34]' : 'text-[#8a8677]'}`}>
                  {charsDesc}/3000
                </span>
              </div>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={
                  tipo === 'Bug'
                    ? 'Describí qué estabas haciendo, qué pasó y qué esperabas que pase...'
                    : tipo === 'Feature'
                    ? 'Describí la funcionalidad que querés y por qué sería útil...'
                    : 'Describí qué mejoraría y cómo debería funcionar...'
                }
                maxLength={3000}
                rows={6}
                className="w-full resize-none rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#8a8677] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Sección + Prioridad en fila */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Sección */}
              <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
                <label className="mb-2 block text-[12.5px] font-medium text-[#5d6470]">Sección *</label>
                <div className="relative">
                  <select
                    value={seccion}
                    onChange={(e) => setSeccion(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">¿Dónde ocurre?</option>
                    {SECCIONES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8677]" />
                </div>
              </div>

              {/* Prioridad */}
              <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
                <label className="mb-2 block text-[12.5px] font-medium text-[#5d6470]">Prioridad</label>
                <div className="relative">
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {PRIORIDADES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.emoji} {p.label} — {p.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8677]" />
                </div>
              </div>
            </div>

            {/* Upload imagen */}
            <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
              <label className="mb-3 block text-[12.5px] font-medium text-[#5d6470]">
                Captura de pantalla <span className="font-normal text-[#8a8677]">(opcional)</span>
              </label>

              {imagenPreview ? (
                <div className="relative">
                  <img
                    src={imagenPreview}
                    alt="Preview"
                    className="max-h-48 w-full rounded-sm border border-[#ddd5c2] bg-[#f0ead9] object-contain"
                  />
                  <button
                    type="button"
                    onClick={removeImagen}
                    className="absolute right-2 top-2 rounded-sm border border-[#ddd5c2] bg-white/90 p-1.5 transition-colors hover:bg-[#a04a34]/10"
                  >
                    <X className="h-4 w-4 text-[#a04a34]" />
                  </button>
                  <p className="mt-2 text-[11px] text-[#8a8677]">
                    {imagen?.name} ({(imagen?.size / 1024).toFixed(0)}KB)
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer rounded-sm border-2 border-dashed border-[#ddd5c2] p-8 text-center transition-colors duration-150 hover:border-[#8a8677]"
                >
                  <ImageIcon className="mx-auto mb-3 h-7 w-7 text-[#8a8677] transition-colors group-hover:text-foreground" />
                  <p className="text-[13px] text-[#8a8677] transition-colors group-hover:text-foreground">
                    Clic para adjuntar imagen
                  </p>
                  <p className="mt-1 text-[11px] text-[#8a8677]">
                    JPG, PNG, WEBP o GIF — máx {MAX_IMAGE_SIZE_MB}MB
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={handleImagenChange}
                className="hidden"
              />

              {imagenError && (
                <p className="mt-2 flex items-center gap-1 text-[11.5px] text-[#a04a34]">
                  <XCircle className="h-3 w-3" />
                  {imagenError}
                </p>
              )}
            </div>

            {/* Error general */}
            {(status === 'error' || errorMsg) && (
              <div className="flex items-start gap-2.5 rounded-sm border border-[#a04a34]/40 bg-[#a04a34]/5 p-3.5">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#a04a34]" />
                <p className="text-[12.5px] text-[#a04a34]">{errorMsg}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 text-[13.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando a Linear...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Enviar reporte
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Panel lateral (1/3) ──────────────────────────────────────── */}
        <div className="space-y-3.5">
          {/* Flujo del reporte */}
          <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <h3 className="font-serif text-[14px] font-semibold text-foreground">¿Qué pasa al enviar?</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: '📋', text: 'Se crea un issue en Linear con todos los detalles' },
                { icon: '🏷️', text: 'Se asigna automáticamente al proyecto Sistema Finanzas' },
                { icon: '📱', text: 'Recibo una notificación en Telegram al instante' },
                { icon: '🔄', text: 'Cuando se resuelva, te enterás por el historial de Linear' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 text-[13px]">{step.icon}</span>
                  <p className="text-[11.5px] leading-relaxed text-[#5d6470]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips por tipo */}
          <div
            className="rounded-sm border p-4"
            style={{ borderColor: tipoActivo?.color, backgroundColor: `${tipoActivo?.color}0d` }}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <Info className="h-3.5 w-3.5" style={{ color: tipoActivo?.color }} />
              <h3 className="font-serif text-[14px] font-semibold" style={{ color: tipoActivo?.color }}>
                Tips para {tipoActivo?.label}
              </h3>
            </div>
            <ul className="space-y-1.5">
              {tipo === 'Bug' && [
                'Describí los pasos para reproducirlo',
                'Indicá qué esperabas que pase vs qué pasó',
                'Agregá una captura si podés',
                'Mencioná si pasa siempre o a veces',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[11px] text-[#8a8677]">•</span>
                  <span className="text-[11.5px] text-[#5d6470]">{tip}</span>
                </li>
              ))}
              {tipo === 'Feature' && [
                'Explicá el caso de uso concreto',
                'Describí qué problema resuelve',
                'Si tenés ejemplos de otras apps, mencionálos',
                'Priorizá urgente solo si es crítico para tu flujo',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[11px] text-[#8a8677]">•</span>
                  <span className="text-[11.5px] text-[#5d6470]">{tip}</span>
                </li>
              ))}
              {tipo === 'Improvement' && [
                'Describí el comportamiento actual',
                'Explicá cómo debería mejorar',
                'Indicá qué tanto impacta en tu uso diario',
                'Ejemplos concretos ayudan mucho',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[11px] text-[#8a8677]">•</span>
                  <span className="text-[11.5px] text-[#5d6470]">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Link a Linear */}
          <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-[#8a8677]" />
              <h3 className="font-serif text-[14px] font-semibold text-foreground">Ver todos los reportes</h3>
            </div>
            <p className="mb-2.5 text-[11.5px] text-[#8a8677]">
              Podés ver el estado de todos los reportes enviados directamente en Linear.
            </p>
            <a
              href="https://linear.app/aplicaciones/project/sistema-finanzas-2b89e325c201/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#3d5a80] transition-colors hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir proyecto en Linear
            </a>
          </div>

          {/* Estado actual */}
          <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[#8a6a1f]" />
              <h3 className="font-serif text-[14px] font-semibold text-foreground">Prioridades actuales</h3>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[#8a8677]">
              Los reportes se revisan regularmente. Los marcados como{' '}
              <span className="text-[#a04a34]">Urgente</span> o <span className="text-[#8a6a1f]">Alta</span> se
              atienden primero.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="rounded-sm border border-[#ddd5c2] bg-white p-4">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-[15px] font-semibold text-foreground">Mis reportes en Linear</h2>
              <p className="text-[11.5px] text-[#8a8677]">
                Acá ves lo que cargaste y si está resuelto o en progreso.
              </p>
            </div>
            <button
              type="button"
              onClick={() => cargarMisReportes()}
              className="rounded-sm border border-[#ddd5c2] bg-white px-3 py-[7px] text-[12px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9]"
            >
              Actualizar
            </button>
          </div>

          {reportesLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#8a8677]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando reportes...
            </div>
          ) : reportesError ? (
            <div className="rounded-sm border border-[#a04a34]/40 bg-[#a04a34]/5 p-3.5 text-[12.5px] text-[#a04a34]">
              {reportesError}
            </div>
          ) : misReportes.length === 0 ? (
            <p className="py-8 text-center text-[13.5px] italic text-[#8a8677]">
              Todavía no encontramos reportes tuyos en Linear.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead>
                  <tr className="border-b-2 border-[#ddd5c2] text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#8a8677]">
                    <th className="py-2.5 pr-3 font-medium">Ticket</th>
                    <th className="py-2.5 pr-3 font-medium">Título</th>
                    <th className="py-2.5 pr-3 font-medium">Prioridad</th>
                    <th className="py-2.5 pr-3 font-medium">Estado</th>
                    <th className="py-2.5 pr-3 font-medium">Creado</th>
                    <th className="py-2.5 text-right font-medium">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {misReportes.map((r) => (
                    <tr key={r.id} className="border-b border-[#e7e0cf] transition-colors duration-150 hover:bg-[#f0ead9]">
                      <td className="py-2.5 pr-3 font-mono text-[12px] text-foreground">{r.identifier}</td>
                      <td className="max-w-[320px] truncate py-2.5 pr-3 text-foreground" title={r.title}>{r.title}</td>
                      <td className="py-2.5 pr-3 text-[#5d6470]">{r.priority_label || 'Normal'}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-[3px] font-mono text-[10.5px] uppercase ${stateBadge(r.state_type)}`}>
                          {r.resuelto ? 'Resuelto' : (r.state_name || 'Pendiente')}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11.5px] text-[#8a8677]">{formatDate(r.created_at)}</td>
                      <td className="py-2.5 text-right">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3d5a80] hover:underline"
                        >
                          Ver
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportesBugsView;
