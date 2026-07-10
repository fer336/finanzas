import { useState, useEffect, useCallback } from 'react';
import { X, Bot, Key, Zap, Check, AlertCircle, Eye, EyeOff, ExternalLink, Loader2, CheckCircle, Camera } from 'lucide-react';
import apiServices from '../services/api';

// Debounce helper
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const AIConfigModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [validatingApiKey, setValidatingApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(null);

  const [config, setConfig] = useState(null);
  const [modelos, setModelos] = useState([]);

  const [formData, setFormData] = useState({
    provider: 'openrouter',
    auth_method: 'api_key',
    api_key: '',
    access_token: '',
    refresh_token: '',
    modelo_preferido: 'google/gemini-3-flash-preview',
    modelo_vision: 'google/gemini-pro-vision',
    temperatura: 0.7,
    max_tokens: 4000
  });

  // Debounce credential input
  const activeCredential = formData.auth_method === 'oauth2' ? formData.access_token : formData.api_key;
  const debouncedCredential = useDebounce(activeCredential, 800);

  // 🔒 Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadData();
    } else {
      document.body.style.overflow = '';
      // Reset validation states when closing
      setApiKeyValid(false);
      setApiKeyError(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Validar API key automáticamente cuando cambia
  useEffect(() => {
    if (debouncedCredential && debouncedCredential.length > 10) {
      validateAndLoadModels(debouncedCredential);
    } else {
      setApiKeyValid(false);
      setApiKeyError(null);
      // Cargar modelos por defecto si no hay API key
      if (modelos.length === 0) {
        loadDefaultModels();
      }
    }
  }, [debouncedCredential, formData.provider, formData.auth_method]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar configuración actual
      const configData = await apiServices.aiConfigApi.getConfig();

      if (configData) {
        setConfig(configData);
        setFormData({
          provider: configData.provider || 'openrouter',
          auth_method: configData.auth_method || 'api_key',
          api_key: '',  // No mostramos la API key por seguridad
          access_token: '',
          refresh_token: '',
          modelo_preferido: configData.modelo_preferido,
          modelo_vision: configData.modelo_vision || 'google/gemini-pro-vision',
          temperatura: configData.temperatura,
          max_tokens: configData.max_tokens
        });

        // Marcar como válida si ya tiene configuración
        setApiKeyValid(true);

        if ((configData.provider || 'openrouter') === 'openrouter') {
          console.log('✅ Usuario con OpenRouter configurado, cargando modelos desde backend...');
          await loadModelsFromBackend();
        } else {
          await loadDefaultModels(configData.provider || 'openrouter');
        }
      } else {
        // Sin configuración, cargar modelos por defecto
        await loadDefaultModels(formData.provider);
      }
    } catch (err) {
      console.error('Error loading AI config:', err);
      setError(err.message);
      // Fallback a modelos por defecto
      await loadDefaultModels(formData.provider);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultModels = async (provider = 'openrouter') => {
    const providerModels = {
      openrouter: null,
      openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
      google: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
    };

    if (provider !== 'openrouter') {
      setModelos(providerModels[provider] || []);
      return;
    }

    try {
      const modelosData = await apiServices.aiConfigApi.getModelos();
      setModelos(modelosData.modelos || []);
    } catch (err) {
      console.error('Error loading models:', err);
    }
  };

  const loadModelsFromBackend = async () => {
    try {
      // Usar el nuevo método getMyModels que carga desde la API key del usuario
      const data = await apiServices.aiConfigApi.getMyModels();

      if (data.modelos && data.modelos.length > 0) {
        setModelos(data.modelos);
        console.log(`✅ ${data.modelos.length} modelos cargados desde tu cuenta de OpenRouter (source: ${data.source})`);
      } else {
        console.log('⚠️ No se obtuvieron modelos, usando por defecto');
        await loadDefaultModels();
      }
    } catch (err) {
      console.error('Error loading models from backend:', err);
      // Fallback a modelos por defecto
      await loadDefaultModels();
    }
  };

  const validateAndLoadModels = async (credential) => {
    const provider = formData.provider;
    const authMethod = formData.auth_method;

    if (authMethod === 'oauth2' && credential.length < 20) {
      setApiKeyError('Access token OAuth2 inválido o demasiado corto');
      setApiKeyValid(false);
      return;
    }

    if (authMethod === 'api_key') {
      const keyPatterns = {
        openrouter: /^sk-or-v1-[a-zA-Z0-9_-]{20,}$/,
        openai: /^sk-[a-zA-Z0-9_-]{20,}$/,
        google: /^(AIza[0-9A-Za-z_-]{20,}|ya29\.[0-9A-Za-z._-]{20,})$/,
        anthropic: /^sk-ant-[a-zA-Z0-9_-]{20,}$/,
      };
      const pattern = keyPatterns[provider];
      if (pattern && !pattern.test(credential)) {
        setApiKeyError(`Formato inválido para ${provider}`);
        setApiKeyValid(false);
        return;
      }
    }

    setValidatingApiKey(true);
    setApiKeyError(null);
    setApiKeyValid(false);

    try {
      if (provider === 'openrouter') {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credential}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Credencial inválida o sin permisos en OpenRouter');
        }

        const data = await response.json();
        const modelosRelevantes = data.data
          .filter(m =>
            m.id.includes('gemini') ||
            m.id.includes('claude') ||
            m.id.includes('gpt') ||
            m.id.includes('llama') ||
            m.id.includes('qwen')
          )
          .map(m => m.id)
          .sort();
        setModelos(modelosRelevantes);
      } else {
        await loadDefaultModels(provider);
      }

      setApiKeyValid(true);
      setApiKeyError(null);

      console.log(`✅ Credencial válida para ${provider}`);
    } catch (err) {
      console.error('Error validating API key:', err);
      setApiKeyError(err.message || 'No se pudo validar la API key');
      setApiKeyValid(false);

      // Cargar modelos por defecto en caso de error
      await loadDefaultModels(provider);
    } finally {
      setValidatingApiKey(false);
    }
  };

  const handleSave = async () => {
    const credential = formData.auth_method === 'oauth2' ? formData.access_token : formData.api_key;

    if (!credential && !config) {
      setError('Debes ingresar una credencial (API key o access token OAuth2)');
      return;
    }

    if (credential && !apiKeyValid) {
      setError('Esperá a que se valide la credencial');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const dataToSend = {
        provider: formData.provider,
        auth_method: formData.auth_method,
        modelo_preferido: formData.modelo_preferido,
        temperatura: parseFloat(formData.temperatura),
        max_tokens: parseInt(formData.max_tokens)
      };

      if (formData.auth_method === 'oauth2') {
        if (formData.access_token) {
          dataToSend.access_token = formData.access_token;
        }
        if (formData.refresh_token) {
          dataToSend.refresh_token = formData.refresh_token;
        }
      } else if (formData.api_key) {
        dataToSend.api_key = formData.api_key;
      }

      if (config) {
        // Actualizar configuración existente
        await apiServices.aiConfigApi.update(dataToSend);
      } else {
        // Crear nueva configuración (requiere API key)
        if (!credential) {
          setError('Debes ingresar una credencial para crear la configuración');
          setSaving(false);
          return;
        }
        await apiServices.aiConfigApi.create(dataToSend);
      }

      setSuccess(true);

      // Recargar configuración
      await loadData();

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar tu configuración de IA? Volverás a usar la API del sistema.')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apiServices.aiConfigApi.delete();
      setSuccess(true);
      setConfig(null);
      setFormData({
        provider: 'openrouter',
        auth_method: 'api_key',
        api_key: '',
        access_token: '',
        refresh_token: '',
        modelo_preferido: 'google/gemini-3-flash-preview',
        modelo_vision: 'google/gemini-pro-vision',
        temperatura: 0.7,
        max_tokens: 4000
      });
      setApiKeyValid(false);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al eliminar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(32,36,44,.4)] p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="m-auto my-8 w-full max-w-2xl rounded-md border border-[#ddd5c2] bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ddd5c2] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-sm bg-[#f0ead9] p-2">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-[20px] font-semibold text-foreground">Configuración de IA</h2>
              <p className="text-[12.5px] text-[#8a8677]">Personalizá tu asistente Lucy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-2 text-[#8a8677] transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="rounded-sm border border-[#ddd5c2] bg-[#f0ead9] p-4">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#3d5a80]" />
                  <div className="flex-1">
                    <p className="text-[13px] text-[#5d6470]">
                      {config ? (
                        <>
                          ✅ <strong className="text-foreground">Tenés credenciales de IA configuradas.</strong> Podés operar con OpenRouter u otros providers (OpenAI, Google, Anthropic) según el modo elegido.
                        </>
                      ) : (
                        <>
                          Configurá credenciales por provider (API key u OAuth2 token) para elegir el modelo de IA que quieras usar.
                        </>
                      )}
                    </p>
                    {!config && (
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#3d5a80] transition-colors hover:underline"
                      >
                        OpenRouter keys <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Provider + Auth Method */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12.5px] font-medium text-[#5d6470]">
                    Provider
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => {
                      const nextProvider = e.target.value;
                      setFormData({
                        ...formData,
                        provider: nextProvider,
                        modelo_preferido:
                          nextProvider === 'openrouter'
                            ? 'google/gemini-3-flash-preview'
                            : nextProvider === 'openai'
                              ? 'gpt-4o-mini'
                              : nextProvider === 'google'
                                ? 'gemini-2.0-flash'
                                : 'claude-3-5-sonnet-latest'
                      });
                      setModelos([]);
                      setApiKeyValid(false);
                      setApiKeyError(null);
                    }}
                    className="w-full rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="openrouter">OpenRouter</option>
                    <option value="openai">OpenAI</option>
                    <option value="google">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[12.5px] font-medium text-[#5d6470]">
                    Método de autenticación
                  </label>
                  <select
                    value={formData.auth_method}
                    onChange={(e) => {
                      setFormData({ ...formData, auth_method: e.target.value });
                      setApiKeyValid(false);
                      setApiKeyError(null);
                    }}
                    className="w-full rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="api_key">API Key</option>
                    <option value="oauth2">OAuth2 Token</option>
                  </select>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="mb-2 block text-[12.5px] font-medium text-[#5d6470]">
                  <Key className="mr-1.5 inline h-3.5 w-3.5" />
                  {formData.auth_method === 'oauth2' ? 'Access Token OAuth2' : `API Key de ${formData.provider}`}
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={formData.auth_method === 'oauth2' ? formData.access_token : formData.api_key}
                    onChange={(e) => {
                      if (formData.auth_method === 'oauth2') {
                        setFormData({ ...formData, access_token: e.target.value });
                      } else {
                        setFormData({ ...formData, api_key: e.target.value });
                      }
                      setApiKeyValid(false);
                      setApiKeyError(null);
                    }}
                    placeholder={
                      formData.auth_method === 'oauth2'
                        ? 'oauth2 access token...'
                        : formData.provider === 'openrouter'
                          ? 'sk-or-v1-...'
                          : formData.provider === 'openai'
                            ? 'sk-...'
                            : formData.provider === 'anthropic'
                              ? 'sk-ant-...'
                              : 'AIza...'
                    }
                    className="w-full rounded-sm border border-[#ddd5c2] bg-white py-2.5 pl-3.5 pr-20 text-[13.5px] text-foreground placeholder:text-[#8a8677] transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                    {/* Loading/Success/Error indicator */}
                    {validatingApiKey && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#3d5a80]" />
                    )}
                    {!validatingApiKey && apiKeyValid && (formData.auth_method === 'oauth2' ? formData.access_token : formData.api_key) && (
                      <CheckCircle className="h-4 w-4 text-[#476442]" />
                    )}
                    {!validatingApiKey && apiKeyError && (formData.auth_method === 'oauth2' ? formData.access_token : formData.api_key) && (
                      <AlertCircle className="h-4 w-4 text-[#a04a34]" />
                    )}

                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[#8a8677] hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Validation feedback */}
                {validatingApiKey && (formData.auth_method === 'oauth2' ? formData.access_token : formData.api_key) && (
                  <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#3d5a80]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Validando credencial y cargando modelos...
                  </p>
                )}
                {!validatingApiKey && apiKeyValid && (formData.auth_method === 'oauth2' ? formData.access_token : formData.api_key) && (
                  <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#476442]">
                    <CheckCircle className="h-3 w-3" />
                    Credencial válida. {modelos.length} modelos disponibles.
                  </p>
                )}
                {!validatingApiKey && apiKeyError && (formData.auth_method === 'oauth2' ? formData.access_token : formData.api_key) && (
                  <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#a04a34]">
                    <AlertCircle className="h-3 w-3" />
                    {apiKeyError}
                  </p>
                )}
                {config && !formData.api_key && (
                  <p className="mt-1 text-[11.5px] text-[#8a8677]">
                    Dejá vacío para mantener tu API key actual ({config.api_key_preview})
                  </p>
                )}
              </div>

              {formData.auth_method === 'oauth2' && (
                <div>
                  <label className="mb-2 block text-[12.5px] font-medium text-[#5d6470]">
                    Refresh Token (opcional)
                  </label>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.refresh_token}
                    onChange={(e) => setFormData({ ...formData, refresh_token: e.target.value })}
                    placeholder="refresh token..."
                    className="w-full rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#8a8677] transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {/* Modelo */}
              <div>
                <label className="mb-2 block text-[12.5px] font-medium text-[#5d6470]">
                  <Zap className="mr-1.5 inline h-3.5 w-3.5" />
                  Modelo de IA {modelos.length > 0 && `(${modelos.length} disponibles)`}
                </label>
                <select
                  value={formData.modelo_preferido}
                  onChange={(e) => setFormData({ ...formData, modelo_preferido: e.target.value })}
                  className="w-full rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  disabled={modelos.length === 0}
                >
                  {modelos.length === 0 ? (
                    <option value="">Cargando modelos...</option>
                  ) : (
                    modelos.map((modelo) => (
                      <option key={modelo} value={modelo}>
                        {modelo}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-1 text-[11.5px] text-[#8a8677]">
                  {apiKeyValid && (formData.auth_method === 'oauth2' ? formData.access_token : formData.api_key)
                    ? `Modelos cargados para ${formData.provider}`
                    : formData.provider === 'openrouter'
                      ? 'Modelos con :free son gratuitos. Los demás tienen costo según OpenRouter.'
                      : 'Lista base de modelos del provider seleccionado.'
                  }
                </p>
              </div>

              {/* Modelo de Visión (OCR) */}
              <div>
                <label className="mb-2 block text-[12.5px] font-medium text-[#5d6470]">
                  <Camera className="mr-1.5 inline h-3.5 w-3.5" />
                  Modelo de Visión (para procesar tickets)
                </label>
                <select
                  value={formData.modelo_vision}
                  onChange={(e) => setFormData({ ...formData, modelo_vision: e.target.value })}
                  className="w-full rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="google/gemini-pro-vision">
                    Google Gemini Pro Vision (Recomendado)
                  </option>
                  <option value="google/gemini-flash-1.5-8b-exp-vision">
                    Google Gemini Flash Vision (Rápido)
                  </option>
                  <option value="anthropic/claude-3-5-sonnet">
                    Anthropic Claude 3.5 Sonnet (Premium, mejor calidad)
                  </option>
                  <option value="openai/gpt-4o-mini">
                    OpenAI GPT-4o Mini (Económico)
                  </option>
                  <option value="openai/gpt-4o">
                    OpenAI GPT-4o (Mejor calidad)
                  </option>
                </select>
                <p className="mt-1 text-[11.5px] text-[#8a8677]">
                  📸 Modelo para leer tickets y extraer gastos automáticamente
                </p>
              </div>

              {/* Opciones avanzadas */}
              <details className="group">
                <summary className="cursor-pointer text-[12.5px] font-medium text-[#5d6470] transition-colors hover:text-foreground">
                  Opciones avanzadas (opcional)
                </summary>
                <div className="mt-4 space-y-4 border-l-2 border-[#ddd5c2] pl-4">
                  {/* Temperatura */}
                  <div>
                    <label className="mb-2 block text-[12.5px] text-[#5d6470]">
                      Temperatura: {formData.temperatura}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.temperatura}
                      onChange={(e) => setFormData({ ...formData, temperatura: parseFloat(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <p className="mt-1 text-[11px] text-[#8a8677]">
                      Más bajo = respuestas más predecibles. Más alto = más creatividad.
                    </p>
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <label className="mb-2 block text-[12.5px] text-[#5d6470]">
                      Máximo de tokens
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="32000"
                      step="100"
                      value={formData.max_tokens}
                      onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                      className="w-full rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2 text-[13.5px] text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="mt-1 text-[11px] text-[#8a8677]">
                      Más tokens = respuestas más largas (pero más costosas).
                    </p>
                  </div>
                </div>
              </details>

              {/* Error/Success Messages */}
              {error && (
                <div className="rounded-sm border border-[#a04a34]/40 bg-[#a04a34]/5 p-4 text-[13px] text-[#a04a34]">
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-sm border border-[#5a7d52]/40 bg-[#5a7d52]/5 p-4 text-[13px] text-[#476442]">
                  <Check className="h-4 w-4" />
                  ¡Configuración guardada exitosamente!
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#ddd5c2] p-6">
          <div>
            {config && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-sm px-4 py-2 text-[13px] text-[#a04a34] transition-colors hover:bg-[#a04a34]/10 disabled:opacity-50"
              >
                Eliminar configuración
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-sm border border-[#ddd5c2] bg-white px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-[#f0ead9] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || validatingApiKey}
              className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
