/**
 * ReportesBugsView - Sistema de Reportes y Bugs
 * Crea issues en Linear (proyecto Sistema Finanzas) directamente desde la app.
 * El webhook de Linear notifica automáticamente a Telegram vía n8n.
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
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    activeBg: 'bg-red-500/20',
    activeBorder: 'border-red-500/60',
  },
  {
    id: 'Feature',
    label: 'Feature',
    emoji: '✨',
    icon: Sparkles,
    description: 'Nueva funcionalidad que me gustaría',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    activeBg: 'bg-purple-500/20',
    activeBorder: 'border-purple-500/60',
  },
  {
    id: 'Improvement',
    label: 'Mejora',
    emoji: '🔧',
    icon: Wrench,
    description: 'Algo que podría funcionar mejor',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    activeBg: 'bg-blue-500/20',
    activeBorder: 'border-blue-500/60',
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
  if (stateType === 'completed') return 'bg-green-500/20 text-green-300 border-green-500/30';
  if (stateType === 'canceled') return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
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
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-lg w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-10">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Reporte enviado!</h2>
            <p className="text-white/60 mb-2">
              {resultado.message}
            </p>
            <p className="text-white/40 text-sm mb-8">
              Ya recibí una notificación en Telegram 📱
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-white/40" />
                <span className="text-white/40 text-sm">Issue creado</span>
              </div>
              <p className="text-white font-mono font-bold text-lg">
                {resultado.issue_identifier}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={resultado.issue_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#10b981] hover:bg-[#0d9e6e] text-black font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                Ver en Linear
              </a>
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all duration-200"
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
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">

        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <Bug className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Reportes y Bugs</h1>
              <p className="text-white/50 text-sm">
                Reportá bugs, sugerí mejoras o pedí nuevas funcionalidades
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Formulario (2/3) ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 animate-in fade-in slide-in-from-left-4 duration-500">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Tipo — pills */}
              <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Tipo de reporte *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {TIPOS.map((t) => {
                    const Icon = t.icon;
                    const isActive = tipo === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTipo(t.id)}
                        className={`
                          flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                          ${isActive
                            ? `${t.activeBg} ${t.activeBorder} ${t.color} scale-[1.02]`
                            : `${t.bg} ${t.border} text-white/50 hover:text-white/80 hover:scale-[1.01]`
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-semibold">{t.label}</span>
                        <span className="text-[10px] text-center leading-tight opacity-70 hidden sm:block">
                          {t.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Título */}
              <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">
                    Título *
                  </label>
                  <span className={`text-xs ${charsTitulo > 180 ? 'text-red-400' : 'text-white/30'}`}>
                    {charsTitulo}/200
                  </span>
                </div>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder={`Ej: ${tipo === 'Bug' ? 'Las transacciones no cargan en marzo' : tipo === 'Feature' ? 'Agregar exportación a Excel' : 'Mejorar la velocidad del dashboard'}`}
                  maxLength={200}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#10b981] transition-colors text-sm"
                />
              </div>

              {/* Descripción */}
              <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/70">
                    Descripción detallada *
                  </label>
                  <span className={`text-xs ${charsDesc > 2700 ? 'text-red-400' : 'text-white/30'}`}>
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#10b981] transition-colors text-sm resize-none"
                />
              </div>

              {/* Sección + Prioridad en fila */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Sección */}
                <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Sección *
                  </label>
                  <div className="relative">
                    <select
                      value={seccion}
                      onChange={(e) => setSeccion(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#10b981] transition-colors text-sm appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#1a1a1a]">¿Dónde ocurre?</option>
                      {SECCIONES.map((s) => (
                        <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>

                {/* Prioridad */}
                <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Prioridad
                  </label>
                  <div className="relative">
                    <select
                      value={prioridad}
                      onChange={(e) => setPrioridad(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#10b981] transition-colors text-sm appearance-none cursor-pointer"
                    >
                      {PRIORIDADES.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#1a1a1a]">
                          {p.emoji} {p.label} — {p.description}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Upload imagen */}
              <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Captura de pantalla{' '}
                  <span className="text-white/30 font-normal">(opcional)</span>
                </label>

                {imagenPreview ? (
                  <div className="relative">
                    <img
                      src={imagenPreview}
                      alt="Preview"
                      className="w-full max-h-48 object-contain rounded-lg border border-white/10 bg-white/5"
                    />
                    <button
                      type="button"
                      onClick={removeImagen}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-500/80 border border-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <p className="text-xs text-white/40 mt-2">
                      {imagen?.name} ({(imagen?.size / 1024).toFixed(0)}KB)
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-white/25 rounded-xl p-8 text-center cursor-pointer transition-colors group"
                  >
                    <ImageIcon className="w-8 h-8 text-white/20 group-hover:text-white/40 mx-auto mb-3 transition-colors" />
                    <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                      Clic para adjuntar imagen
                    </p>
                    <p className="text-xs text-white/25 mt-1">
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
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {imagenError}
                  </p>
                )}
              </div>

              {/* Error general */}
              {(status === 'error' || errorMsg) && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-in fade-in duration-300">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{errorMsg}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#10b981] hover:bg-[#0d9e6e] disabled:bg-[#10b981]/40 text-black font-semibold rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:scale-100 text-sm"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando a Linear...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar reporte
                  </>
                )}
              </button>

            </form>
          </div>

          {/* ── Panel lateral (1/3) ──────────────────────────────────────── */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">

            {/* Flujo del reporte */}
            <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#10b981]" />
                <h3 className="text-sm font-semibold text-white">¿Qué pasa al enviar?</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '📋', text: 'Se crea un issue en Linear con todos los detalles' },
                  { icon: '🏷️', text: 'Se asigna automáticamente al proyecto Sistema Finanzas' },
                  { icon: '📱', text: 'Recibo una notificación en Telegram al instante' },
                  { icon: '🔄', text: 'Cuando se resuelva, te enterás por el historial de Linear' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0">{step.icon}</span>
                    <p className="text-white/60 text-xs leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips por tipo */}
            <div className={`border rounded-xl p-5 ${tipoActivo?.bg} ${tipoActivo?.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <Info className={`w-4 h-4 ${tipoActivo?.color}`} />
                <h3 className={`text-sm font-semibold ${tipoActivo?.color}`}>
                  Tips para {tipoActivo?.label}
                </h3>
              </div>
              <ul className="space-y-2">
                {tipo === 'Bug' && [
                  'Describí los pasos para reproducirlo',
                  'Indicá qué esperabas que pase vs qué pasó',
                  'Agregá una captura si podés',
                  'Mencioná si pasa siempre o a veces',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-white/30 text-xs mt-0.5">•</span>
                    <span className="text-white/60 text-xs">{tip}</span>
                  </li>
                ))}
                {tipo === 'Feature' && [
                  'Explicá el caso de uso concreto',
                  'Describí qué problema resuelve',
                  'Si tenés ejemplos de otras apps, mencionálos',
                  'Priorizá urgente solo si es crítico para tu flujo',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-white/30 text-xs mt-0.5">•</span>
                    <span className="text-white/60 text-xs">{tip}</span>
                  </li>
                ))}
                {tipo === 'Improvement' && [
                  'Describí el comportamiento actual',
                  'Explicá cómo debería mejorar',
                  'Indicá qué tanto impacta en tu uso diario',
                  'Ejemplos concretos ayudan mucho',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-white/30 text-xs mt-0.5">•</span>
                    <span className="text-white/60 text-xs">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Link a Linear */}
            <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-white/40" />
                <h3 className="text-sm font-semibold text-white/70">Ver todos los reportes</h3>
              </div>
              <p className="text-white/40 text-xs mb-3">
                Podés ver el estado de todos los reportes enviados directamente en Linear.
              </p>
              <a
                href="https://linear.app/aplicaciones/project/sistema-finanzas-2b89e325c201/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#10b981] hover:text-[#0d9e6e] text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir proyecto en Linear
              </a>
            </div>

            {/* Estado actual */}
            <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400/70" />
                <h3 className="text-sm font-semibold text-white/70">Prioridades actuales</h3>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">
                Los reportes se revisan regularmente. Los marcados como{' '}
                <span className="text-red-400">Urgente</span> o{' '}
                <span className="text-orange-400">Alta</span> se atienden primero.
              </p>
            </div>

          </div>
        </div>

        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Mis reportes en Linear</h2>
                <p className="text-xs text-white/45">
                  Acá ves lo que cargaste y si está resuelto o en progreso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => cargarMisReportes()}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/70 transition-colors"
              >
                Actualizar
              </button>
            </div>

            {reportesLoading ? (
              <div className="flex items-center justify-center py-10 text-white/50 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando reportes...
              </div>
            ) : reportesError ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {reportesError}
              </div>
            ) : misReportes.length === 0 ? (
              <div className="p-6 bg-white/5 border border-white/10 rounded-lg text-white/50 text-sm text-center">
                Todavía no encontramos reportes tuyos en Linear.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wide">
                      <th className="text-left py-3 pr-3">Ticket</th>
                      <th className="text-left py-3 pr-3">Título</th>
                      <th className="text-left py-3 pr-3">Prioridad</th>
                      <th className="text-left py-3 pr-3">Estado</th>
                      <th className="text-left py-3 pr-3">Creado</th>
                      <th className="text-right py-3">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {misReportes.map((r) => (
                      <tr key={r.id} className="border-b border-white/5">
                        <td className="py-3 pr-3 text-white font-mono text-xs">{r.identifier}</td>
                        <td className="py-3 pr-3 text-white/85 max-w-[320px] truncate" title={r.title}>{r.title}</td>
                        <td className="py-3 pr-3 text-white/70">{r.priority_label || 'Normal'}</td>
                        <td className="py-3 pr-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${stateBadge(r.state_type)}`}>
                            {r.resuelto ? 'Resuelto' : (r.state_name || 'Pendiente')}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-white/60">{formatDate(r.created_at)}</td>
                        <td className="py-3 text-right">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#10b981] hover:text-[#0d9e6e] text-xs font-medium"
                          >
                            Ver
                            <ExternalLink className="w-3 h-3" />
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
    </div>
  );
};

export default ReportesBugsView;
