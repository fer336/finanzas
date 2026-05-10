import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FileText,
  Upload,
  Download,
  Eye,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useIsMobile } from '../../../hooks/use-mobile';
import FileUpload from '../../FileUpload/FileUpload';
import apiServices from '../../../services/api';

const { resumenesBancariosApi } = apiServices;

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount, currency = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const normalizeResumen = (r) => {
  const ciclo = r.ciclo_facturacion || {};
  const totales = r.totales || {};
  const estadoRaw = r.minimo_pagado || r.total_pagado ? 'pagado' : 'pendiente';
  return {
    id: r.id,
    banco: r.banco || 'Banco',
    tipoTarjeta: r.tipo_tarjeta || r.tipoTarjeta || '—',
    periodo: ciclo.periodo || ciclo.periodo_facturacion || r.periodo || '—',
    cierre: ciclo.cierre_actual || ciclo.fecha_cierre || r.fecha_cierre || null,
    vencimiento: ciclo.vencimiento_actual || ciclo.fecha_vencimiento || r.fecha_vencimiento || null,
    saldoPesos: parseFloat(totales.saldo_actual_pesos || totales.saldo_pesos || r.saldo_pesos || 0),
    saldoDolares: parseFloat(totales.saldo_actual_dolares || totales.saldo_dolares || r.saldo_dolares || 0),
    pagoMinimoPesos: parseFloat(totales.pago_minimo_pesos || totales.pago_minimo || r.pago_minimo_pesos || 0),
    estado: (r.estado || estadoRaw).toString().toLowerCase(),
    urlPDF: r.url_factura || r.url_pdf || r.urlPDF || null,
    // raw para edición
    _raw: r,
  };
};

// ─── Edit Modal ──────────────────────────────────────────────────────────────

const EditModal = ({ resumen, onClose, onSaved }) => {
  const [form, setForm] = useState({
    banco: resumen.banco || '',
    tipoTarjeta: resumen.tipoTarjeta || '',
    periodo: resumen.periodo === '—' ? '' : resumen.periodo || '',
    cierre: resumen.cierre ? resumen.cierre.split('T')[0] : '',
    vencimiento: resumen.vencimiento ? resumen.vencimiento.split('T')[0] : '',
    saldoPesos: resumen.saldoPesos || 0,
    pagoMinimoPesos: resumen.pagoMinimoPesos || 0,
    saldoDolares: resumen.saldoDolares || 0,
    estado: resumen.estado || 'pendiente',
    urlPDF: resumen.urlPDF || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.banco.trim()) { setError('El banco es requerido'); return; }
    try {
      setSaving(true);
      setError('');

      // Reconstruct JSONB structure expected by backend
      const raw = resumen._raw || {};
      const cicloActual = raw.ciclo_facturacion || {};
      const totalesActual = raw.totales || {};

      const payload = {
        banco: form.banco.trim(),
        tipo_tarjeta: form.tipoTarjeta.trim(),
        ciclo_facturacion: {
          ...cicloActual,
          periodo: form.periodo,
          cierre_actual: form.cierre || null,
          vencimiento_actual: form.vencimiento || null,
        },
        totales: {
          ...totalesActual,
          saldo_actual_pesos: parseFloat(form.saldoPesos) || 0,
          pago_minimo_pesos: parseFloat(form.pagoMinimoPesos) || 0,
          saldo_actual_dolares: parseFloat(form.saldoDolares) || 0,
        },
        url_factura: form.urlPDF || null,
        minimo_pagado: form.estado === 'pagado',
        total_pagado: form.estado === 'pagado',
      };

      await resumenesBancariosApi.update(resumen.id, payload);
      onSaved();
      onClose();
    } catch (err) {
      setError('Error al guardar: ' + (err.message || 'Intente de nuevo'));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 bg-[#0b0b0f] border border-white/8 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10 focus:outline-none transition-all';
  const labelCls = 'text-xs font-medium text-zinc-400 mb-1 block';

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[radial-gradient(circle_at_top,rgba(24,27,38,0.97)_0%,rgba(9,9,11,0.99)_60%)] rounded-t-3xl md:rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[92dvh] z-[10000]">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#18181b]/80 backdrop-blur-md rounded-t-3xl md:rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="bg-cyan-400/10 p-1.5 rounded-lg">
              <Pencil className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-none">Editar Resumen</h2>
              <p className="text-zinc-500 text-xs mt-0.5">{resumen.banco} · {resumen.tipoTarjeta}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Sección 1 — Info básica */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-3">Información básica</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Banco</label>
                <input type="text" value={form.banco} onChange={e => set('banco', e.target.value)} className={inputCls} placeholder="Ej: Galicia" />
              </div>
              <div>
                <label className={labelCls}>Tipo de tarjeta</label>
                <input type="text" value={form.tipoTarjeta} onChange={e => set('tipoTarjeta', e.target.value)} className={inputCls} placeholder="Ej: VISA GOLD" />
              </div>
              <div>
                <label className={labelCls}>Período</label>
                <input type="text" value={form.periodo} onChange={e => set('periodo', e.target.value)} className={inputCls} placeholder="Ej: Febrero 2026" />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <div className="flex gap-2 mt-1">
                  {['pendiente', 'pagado'].map(op => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => set('estado', op)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        form.estado === op
                          ? op === 'pagado'
                            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                            : 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300'
                          : 'bg-white/3 border-white/8 text-zinc-500 hover:text-white'
                      }`}
                    >
                      {op.charAt(0).toUpperCase() + op.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Sección 2 — Fechas */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-3">Fechas</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha de cierre</label>
                <input type="date" value={form.cierre} onChange={e => set('cierre', e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
              </div>
              <div>
                <label className={labelCls}>Fecha de vencimiento</label>
                <input type="date" value={form.vencimiento} onChange={e => set('vencimiento', e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
              </div>
            </div>
          </section>

          {/* Sección 3 — Montos */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-3">Montos</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Saldo (ARS)</label>
                <input type="number" value={form.saldoPesos} onChange={e => set('saldoPesos', e.target.value)} className={inputCls} placeholder="0" min="0" step="0.01" />
              </div>
              <div>
                <label className={labelCls}>Pago mínimo (ARS)</label>
                <input type="number" value={form.pagoMinimoPesos} onChange={e => set('pagoMinimoPesos', e.target.value)} className={inputCls} placeholder="0" min="0" step="0.01" />
              </div>
              <div>
                <label className={labelCls}>Saldo (USD)</label>
                <input type="number" value={form.saldoDolares} onChange={e => set('saldoDolares', e.target.value)} className={inputCls} placeholder="0" min="0" step="0.01" />
              </div>
            </div>
          </section>

          {/* Sección 4 — PDF */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-3">Archivo PDF</p>
            <FileUpload
              onFileUploaded={(fileData) => set('urlPDF', fileData.url)}
              onFileRemoved={() => set('urlPDF', '')}
              currentFileUrl={form.urlPDF}
              prefix="resumenes"
              maxSizeMB={20}
              allowedTypes={['application/pdf', 'image/jpeg', 'image/png']}
              showPreview={true}
            />
            {form.urlPDF && (
              <a
                href={form.urlPDF}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Eye className="w-3 h-3" />
                Ver PDF actual
              </a>
            )}
          </section>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-white/8 bg-[#18181b]/80 backdrop-blur-md flex items-center justify-end gap-3 rounded-b-3xl md:rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm ──────────────────────────────────────────────────────────

const DeleteConfirm = ({ resumen, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await resumenesBancariosApi.delete(resumen.id);
      onDeleted();
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl z-[10000] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Eliminar resumen</h3>
            <p className="text-zinc-500 text-xs">{resumen.banco} · {resumen.tipoTarjeta}</p>
          </div>
        </div>
        <p className="text-zinc-400 text-sm mb-5">¿Estás seguro? Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const ModernResumenesView = ({ resumenes = [], onUploadResumen }) => {
  const [selectedEstado, setSelectedEstado] = useState('all');
  const [editingResumen, setEditingResumen] = useState(null);
  const [deletingResumen, setDeletingResumen] = useState(null);
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.resumenes]);
  const isMobile = useIsMobile();

  const allResumenes = resumenes.map(normalizeResumen);

  const filteredResumenes = selectedEstado === 'all'
    ? allResumenes
    : allResumenes.filter(r => r.estado === selectedEstado);

  const stats = {
    total: allResumenes.length,
    pendientes: allResumenes.filter(r => r.estado === 'pendiente').length,
    pagados: allResumenes.filter(r => r.estado === 'pagado').length,
    deudaTotal: allResumenes
      .filter(r => r.estado === 'pendiente')
      .reduce((s, r) => s + r.saldoPesos, 0),
  };

  const handleSaved = () => refresh();
  const handleDeleted = () => refresh();

  // ── Mobile layout ──
  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Header mobile */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Resúmenes Bancarios</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {stats.total} total · {stats.pendientes} pendientes
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onUploadResumen}
              className="h-8 px-3 flex items-center gap-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/25 rounded-xl text-cyan-300 text-xs font-medium transition-all"
            >
              <Upload className="w-3 h-3" />
              Subir PDF
            </button>
          </div>
        </div>

        {/* Stats pills mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: 'Total', value: stats.total, color: 'text-zinc-300' },
            { label: 'Pendientes', value: stats.pendientes, color: 'text-yellow-400' },
            { label: 'Pagados', value: stats.pagados, color: 'text-emerald-400' },
            { label: formatCurrency(stats.deudaTotal), value: null, color: 'text-red-400', prefix: 'Deuda ' },
          ].map((s) => (
            <div key={s.label} className="shrink-0 px-3 py-1.5 bg-white/5 border border-white/8 rounded-full flex items-center gap-1.5">
              <span className="text-zinc-500 text-xs">{s.prefix || ''}{s.label}</span>
              {s.value !== null && <span className={`text-xs font-bold ${s.color}`}>{s.value}</span>}
              {s.value === null && <span className={`text-xs font-bold ${s.color}`}></span>}
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {[['all', 'Todos'], ['pendiente', 'Pendientes'], ['pagado', 'Pagados']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSelectedEstado(val)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedEstado === val
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Cards mobile */}
        <div className="space-y-2">
          {filteredResumenes.map((r) => (
            <div key={r.id} className="bg-[#18181b] border border-white/6 rounded-2xl p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.banco}</p>
                  <p className="text-[11px] text-zinc-500">{r.tipoTarjeta} · {r.periodo}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  r.estado === 'pagado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {r.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="bg-white/3 rounded-lg p-2">
                  <p className="text-zinc-600 uppercase tracking-wide text-[9px]">Cierre</p>
                  <p className="text-zinc-300 font-medium mt-0.5">{formatDate(r.cierre)}</p>
                </div>
                <div className="bg-white/3 rounded-lg p-2">
                  <p className="text-zinc-600 uppercase tracking-wide text-[9px]">Vencimiento</p>
                  <p className="text-zinc-300 font-medium mt-0.5">{formatDate(r.vencimiento)}</p>
                </div>
                <div className="bg-white/3 rounded-lg p-2">
                  <p className="text-zinc-600 uppercase tracking-wide text-[9px]">Saldo</p>
                  <p className="text-red-400 font-bold mt-0.5">{formatCurrency(r.saldoPesos)}</p>
                </div>
                <div className="bg-white/3 rounded-lg p-2">
                  <p className="text-zinc-600 uppercase tracking-wide text-[9px]">Pago mín.</p>
                  <p className="text-yellow-400 font-bold mt-0.5">{formatCurrency(r.pagoMinimoPesos)}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-end gap-1">
                {r.urlPDF ? (
                  <a href={r.urlPDF} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors" title="Ver PDF">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  </a>
                ) : (
                  <button disabled className="p-1.5 rounded-lg opacity-25 cursor-not-allowed">
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                )}
                <button onClick={() => setEditingResumen(r)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white" title="Editar">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeletingResumen(r)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-zinc-500 hover:text-red-400" title="Eliminar">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredResumenes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-zinc-400 text-sm font-medium">Sin resúmenes</p>
            <p className="text-zinc-600 text-xs mt-1">Subí un PDF para comenzar</p>
          </div>
        )}

        {editingResumen && (
          <EditModal resumen={editingResumen} onClose={() => setEditingResumen(null)} onSaved={handleSaved} />
        )}
        {deletingResumen && (
          <DeleteConfirm resumen={deletingResumen} onClose={() => setDeletingResumen(null)} onDeleted={handleDeleted} />
        )}
      </div>
    );
  }

  // ── Desktop layout ──
  return (
    <div className="space-y-4 px-6 py-4">

      {/* Fila 1 — Título + botones */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white leading-none">Resúmenes Bancarios</h1>
          <p className="text-xs text-zinc-500 mt-1">Resúmenes de tarjetas de crédito</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refresh}
            disabled={isRefreshing}
            title="Actualizar"
            className="h-8 w-8 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onUploadResumen}
            className="h-8 px-3.5 flex items-center gap-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/25 rounded-xl text-cyan-300 text-xs font-semibold transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Subir Resumen PDF
          </button>
        </div>
      </div>

      {/* Fila 2 — Stats pills + filtros separados */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        {/* Stats pills */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-white/5 border border-white/8 rounded-full text-xs text-zinc-400 font-medium">
            {stats.total} total
          </span>
          {stats.pendientes > 0 && (
            <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-400 font-semibold">
              ● {stats.pendientes} pendientes
            </span>
          )}
          {stats.pagados > 0 && (
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-semibold">
              ● {stats.pagados} pagados
            </span>
          )}
          {stats.deudaTotal > 0 && (
            <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-400 font-semibold">
              {formatCurrency(stats.deudaTotal)} deuda
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1">
          {[
            ['all', `Todos (${stats.total})`],
            ['pendiente', `Pendientes (${stats.pendientes})`],
            ['pagado', `Pagados (${stats.pagados})`],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSelectedEstado(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedEstado === val
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla rediseñada */}
      {filteredResumenes.length > 0 ? (
        <GlassCard className="overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Banco / Tarjeta</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Período</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Cierre / Vence</th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Saldo</th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Pago mín.</th>
                <th className="text-center px-4 py-2.5 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Estado</th>
                <th className="text-center px-4 py-2.5 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredResumenes.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-white/[0.025] transition-colors group"
                >
                  {/* Banco + tipo fusionados */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                        <CreditCard className="w-3.5 h-3.5 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white leading-none">{r.banco}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{r.tipoTarjeta}</p>
                      </div>
                    </div>
                  </td>

                  {/* Período */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-zinc-400">{r.periodo}</p>
                  </td>

                  {/* Cierre + vencimiento fusionados */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-zinc-400 leading-none">
                      <span className="text-zinc-600 text-[10px]">Cierre </span>
                      {formatDate(r.cierre)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 leading-none">
                      <span className="text-zinc-600 text-[10px]">Vence </span>
                      {formatDate(r.vencimiento)}
                    </p>
                  </td>

                  {/* Saldo */}
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-bold text-red-400">{formatCurrency(r.saldoPesos)}</p>
                    {r.saldoDolares > 0 && (
                      <p className="text-[10px] text-zinc-600 mt-0.5">+ {formatCurrency(r.saldoDolares, 'USD')}</p>
                    )}
                  </td>

                  {/* Pago mínimo */}
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold text-yellow-400">{formatCurrency(r.pagoMinimoPesos)}</p>
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      r.estado === 'pagado'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {r.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-0.5">
                      {/* Ver PDF */}
                      {r.urlPDF ? (
                        <a
                          href={r.urlPDF}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-cyan-400/10 transition-colors"
                          title="Ver PDF"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        </a>
                      ) : (
                        <button disabled className="p-1.5 rounded-lg opacity-20 cursor-not-allowed" title="Sin PDF">
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                        </button>
                      )}

                      {/* Descargar PDF */}
                      {r.urlPDF && (
                        <a
                          href={r.urlPDF}
                          download
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
                        </a>
                      )}

                      {/* Editar */}
                      <button
                        onClick={() => setEditingResumen(r)}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-zinc-500 hover:text-white"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={() => setDeletingResumen(r)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-zinc-500 hover:text-red-400"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-zinc-300 font-semibold text-sm">Sin resúmenes bancarios</p>
          <p className="text-zinc-600 text-xs mt-1 mb-5">Subí un PDF para que el sistema los procese automáticamente</p>
          <button
            onClick={onUploadResumen}
            className="h-8 px-4 flex items-center gap-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/25 rounded-xl text-cyan-300 text-xs font-semibold transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Subir Resumen PDF
          </button>
        </div>
      )}

      {/* Modales */}
      {editingResumen && (
        <EditModal resumen={editingResumen} onClose={() => setEditingResumen(null)} onSaved={handleSaved} />
      )}
      {deletingResumen && (
        <DeleteConfirm resumen={deletingResumen} onClose={() => setDeletingResumen(null)} onDeleted={handleDeleted} />
      )}
    </div>
  );
};

ModernResumenesView.propTypes = {
  resumenes: PropTypes.array,
  onUploadResumen: PropTypes.func,
};

export default ModernResumenesView;
