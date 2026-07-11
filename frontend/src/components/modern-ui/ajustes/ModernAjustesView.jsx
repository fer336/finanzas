import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import ModernCategoriesView from '../categories/ModernCategoriesView';
import ModernPaymentMethodsView from '../payment-methods/ModernPaymentMethodsView';
import LoadingSpinner from '../common/LoadingSpinner';
import apiServices from '../../../services/api';
import { useIsMobile } from '../../../hooks/use-mobile';

/**
 * ModernAjustesView — container "Ajustes" del tema "Papel".
 * Tab "General" agrupa Widgets del dashboard + Modo de balance;
 * "Categorías" y "Métodos de pago" viven
 * en tabs propios (mismo patrón de tabs que ModernInversionesView) en
 * vez de apilarse como secciones verticales — la lista larga resultaba
 * confusa. El reporte de bugs/Linear se sacó de acá (feature dada de
 * baja).
 */
const AJUSTES_TAB_KEY = 'ajustes_tab';

const TABS = [
  { value: 'general', label: 'General' },
  { value: 'categorias', label: 'Categorías' },
  { value: 'metodos-pago', label: 'Métodos de pago' },
];

const loadTab = () => {
  try {
    const saved = localStorage.getItem(AJUSTES_TAB_KEY);
    if (TABS.some((t) => t.value === saved)) return saved;
  } catch { /* ignore */ }
  return 'general';
};

// Switch on/off — track 36×20px radius 999px, off #d8d6cf, on #5a7d52,
// thumb blanco 16px (ver DESIGN.md "Components" > Switch). `ui/toggle.jsx`
// del proyecto es un toggle-button de Radix (estado on/off visual distinto,
// pensado para grupos de botones), no un switch — por eso se arma acá un
// componente chico propio en vez de forzarlo.
const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150"
    style={{ background: checked ? '#5a7d52' : '#d8d6cf' }}
  >
    <span
      className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-150"
      style={{ left: checked ? '18px' : '2px' }}
    />
  </button>
);

Switch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
};

// Toggle de pills — mismo patrón visual que Mensual/Acumulado en
// ModernTransactionsView (activa en azul #3d5a80, es un modo de "scope").
const PillToggle = ({ options, value, onChange }) => (
  <div className="inline-flex items-center gap-[3px] rounded-full border border-[#ddd5c2] bg-card p-[3px]">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`rounded-full px-4 py-1.5 font-mono text-[12px] transition-colors duration-150 ${
          value === opt.value
            ? 'bg-[#3d5a80] font-semibold text-[#faf7ef]'
            : 'text-[#5d6470] hover:text-foreground'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

PillToggle.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

// Tabs de sección — mismo patrón que ModernInversionesView (fondo oscuro
// #20242c en la pill activa, porque estos tabs cambian de contenido
// completo en vez de filtrar un rango).
const SectionTabs = ({ options, value, onChange }) => (
  <div className="inline-flex items-center gap-[3px] rounded-full border border-[#ddd5c2] bg-card p-[3px]">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`rounded-full px-4 py-1.5 font-mono text-[12px] transition-colors duration-150 ${
          value === opt.value
            ? 'bg-[#20242c] font-semibold text-[#f4f0e6]'
            : 'text-[#5d6470] hover:text-foreground'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

SectionTabs.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

// ─── Section shell — card estándar con título Fraunces ─────────────────────
const Section = ({ title, description, children }) => (
  <section className="rounded-md border border-[#ddd5c2] bg-card p-5">
    <h2 className="font-serif text-[17px] font-semibold text-foreground">{title}</h2>
    {description && <p className="mt-1 text-[12.5px] text-[#8a8677]">{description}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

Section.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node,
};

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return null;
  }
};

// Sección de API keys — acceso externo para scripts/agentes vía token
// de larga duración (fk_live_...), en paralelo al login JWT normal.
const ApiKeysSection = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [creating, setCreating] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiServices.apiKeysApi.list();
      setKeys(data || []);
    } catch (err) {
      setError(err.message || 'No pude cargar las API keys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setCreating(true);
    setError('');
    try {
      const response = await apiServices.apiKeysApi.create(nombre.trim());
      setJustCreatedKey(response);
      setNombre('');
      setShowCreateForm(false);
      loadKeys();
    } catch (err) {
      setError(err.message || 'Error al crear la API key.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('¿Revocar esta API key? No se podrá volver a usar.')) return;
    try {
      await apiServices.apiKeysApi.revoke(id);
      loadKeys();
    } catch (err) {
      setError(err.message || 'Error al revocar la API key.');
    }
  };

  const handleCopy = () => {
    if (!justCreatedKey?.key) return;
    navigator.clipboard.writeText(justCreatedKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingSpinner message="Cargando…" fullScreen={false} />;
  }

  return (
    <div>
      {justCreatedKey && (
        <div className="mb-4 rounded-sm border border-[#e9c46a] bg-[#fdf6e3] p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#8a6a1f]" />
            <p className="font-serif text-[14px] font-semibold text-[#8a6a1f]">
              Guardá esta key ahora — no se va a volver a mostrar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={justCreatedKey.key}
              onClick={(e) => e.target.select()}
              className="w-full rounded-sm border border-[#e9c46a] bg-white px-3 py-2 font-mono text-[12.5px] text-[#20242c]"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-sm border border-[#e9c46a] bg-white px-3 py-2 font-sans text-[12.5px] font-medium text-[#8a6a1f] transition-colors duration-150 hover:bg-[#f0ead9]"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-[#8a6a1f]">
            Por seguridad, esta es la única vez que vas a poder ver el token completo.
          </p>
          <button
            type="button"
            onClick={() => setJustCreatedKey(null)}
            className="mt-3 rounded-sm border border-[#e9c46a] bg-white px-3 py-[6px] font-sans text-[11.5px] text-[#8a6a1f] transition-colors duration-150 hover:bg-[#f0ead9]"
          >
            Ya la guardé, cerrar
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-sm border border-[#a04a34]/40 bg-[#a04a34]/5 p-3 text-[12.5px] text-[#a04a34]">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-[12.5px] text-[#8a8677]">Cada key da acceso completo a tu cuenta vía la API.</p>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3.5 py-[7px] font-sans text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047]"
        >
          <Plus className="h-3.5 w-3.5" />
          Generar token
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="mb-4 flex items-center gap-2 rounded-sm border border-[#ddd5c2] bg-white p-3">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Agente Lucy externo"
            maxLength={100}
            autoFocus
            className="w-full rounded-sm border border-[#ddd5c2] bg-white px-3 py-2 text-[13.5px] text-foreground placeholder:text-[#8a8677] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={creating || !nombre.trim()}
            className="shrink-0 rounded-sm bg-primary px-3.5 py-2 font-sans text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Creando…' : 'Crear'}
          </button>
        </form>
      )}

      <div className="overflow-hidden overflow-x-auto rounded-md border border-[#ddd5c2] bg-card">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b-2 border-[#ddd5c2]">
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>Nombre</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>Prefijo</th>
              <th className="hidden px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677] sm:table-cell" style={{ letterSpacing: '.08em' }}>Creado</th>
              <th className="hidden px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677] sm:table-cell" style={{ letterSpacing: '.08em' }}>Último uso</th>
              <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>Estado</th>
              <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677]" style={{ letterSpacing: '.08em' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <p className="text-[13.5px] italic text-muted-foreground">Sin API keys creadas.</p>
                </td>
              </tr>
            ) : (
              keys.map((k) => {
                const isRevoked = Boolean(k.revocado_en);
                return (
                  <tr key={k.id} className="group border-b border-[#e7e0cf] transition-colors hover:bg-[#f0ead9]">
                    <td className="px-3.5 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#f0ead9]">
                          <KeyRound className="h-4 w-4 text-[#8a8677]" />
                        </div>
                        <span className="truncate font-serif text-[14.5px] font-semibold text-foreground">{k.nombre}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="font-mono text-[12px] text-[#5d6470]">{k.key_prefix}…</span>
                    </td>
                    <td className="hidden px-3.5 py-2.5 font-mono text-[11.5px] text-[#8a8677] sm:table-cell">
                      {formatDate(k.creado_en) || '—'}
                    </td>
                    <td className="hidden px-3.5 py-2.5 font-mono text-[11.5px] text-[#8a8677] sm:table-cell">
                      {formatDate(k.ultimo_uso) || 'Nunca'}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-[2px] font-mono text-[10.5px] uppercase tracking-[.04em] ${
                          isRevoked ? 'border-[#ddd5c2] text-[#8a8677]' : 'border-[#5a7d52] text-[#476442]'
                        }`}
                      >
                        {isRevoked ? 'Revocada' : 'Activa'}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {!isRevoked && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(k.id)}
                            className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-[#8a8677] opacity-0 transition-colors group-hover:opacity-100 hover:bg-black/5 hover:text-[#a04a34]"
                            title="Revocar API key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="text-[11.5px]">Revocar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ModernAjustesView = ({
  dashboardSettings,
  onDashboardSettingsChange,
  onNewCategory,
  onEditCategory,
  onDeleteCategory,
  paymentMethods,
  onNewPaymentMethod,
  onEditPaymentMethod,
  onDeletePaymentMethod,
}) => {
  const isMobile = useIsMobile();
  const settings = dashboardSettings || {};
  const [tab, setTab] = useState(loadTab);

  const handleTabChange = (value) => {
    setTab(value);
    try {
      localStorage.setItem(AJUSTES_TAB_KEY, value);
    } catch { /* ignore */ }
  };

  const setBalanceMode = (mode) => {
    onDashboardSettingsChange && onDashboardSettingsChange({ ...settings, balanceMode: mode });
  };

  const balanceMode = settings.balanceMode === 'accumulated' ? 'accumulated' : 'monthly';

  return (
    <div className="min-h-screen bg-background">
      <div className={`mx-auto max-w-[1100px] ${isMobile ? 'px-4 py-4' : 'px-[34px] py-[28px]'}`}>
        {/* Cabecera (mismo patrón que Movimientos / Vencimientos / Inversiones) */}
        <div
          className={`flex items-end justify-between gap-5 border-b-[3px] border-double border-[#cfc6ae] ${
            isMobile ? 'mb-3 pb-3' : 'mb-[22px] pb-[18px]'
          }`}
        >
          <h1 className={`font-serif font-bold leading-none text-foreground ${isMobile ? 'text-[26px]' : 'text-[42px]'}`}>
            Ajustes
          </h1>
        </div>

        {/* Tabs internos */}
        <div className="mb-5">
          <SectionTabs options={TABS} value={tab} onChange={handleTabChange} />
        </div>

        {tab === 'general' && (
          <div className="flex flex-col gap-4">
            {/* Modo de balance */}
            <Section
              title="Modo de balance"
              description="Definí si el saldo del período muestra solo el mes actual o el acumulado histórico."
            >
              <PillToggle
                options={[
                  { value: 'monthly', label: 'Mensual' },
                  { value: 'accumulated', label: 'Acumulado' },
                ]}
                value={balanceMode}
                onChange={setBalanceMode}
              />
            </Section>

            {/* Acceso API externo */}
            <Section
              title="Acceso API externo"
              description="Generá un token de larga duración para conectar un agente o script externo a tu cuenta."
            >
              <ApiKeysSection />
            </Section>
          </div>
        )}

        {tab === 'categorias' && (
          <Section title="Categorías">
            <ModernCategoriesView
              onNewCategory={onNewCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
            />
          </Section>
        )}

        {tab === 'metodos-pago' && (
          <Section title="Métodos de pago">
            <ModernPaymentMethodsView
              paymentMethods={paymentMethods}
              onNewPaymentMethod={onNewPaymentMethod}
              onEditPaymentMethod={onEditPaymentMethod}
              onDeletePaymentMethod={onDeletePaymentMethod}
            />
          </Section>
        )}
      </div>
    </div>
  );
};

ModernAjustesView.propTypes = {
  dashboardSettings: PropTypes.object,
  onDashboardSettingsChange: PropTypes.func,
  onNewCategory: PropTypes.func,
  onEditCategory: PropTypes.func,
  onDeleteCategory: PropTypes.func,
  paymentMethods: PropTypes.array,
  onNewPaymentMethod: PropTypes.func,
  onEditPaymentMethod: PropTypes.func,
  onDeletePaymentMethod: PropTypes.func,
};

export default ModernAjustesView;
