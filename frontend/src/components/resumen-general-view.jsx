import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  Calendar, 
  AlertCircle,
  FileText,
  Eye,
  Search,
  Filter,
  DollarSign,
  Trash2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import apiServices from '../services/api';
import { DollarQuoteWidget } from './mission-control/DollarQuoteWidget';

// 🔧 DEBUG CONFIG - Control de logs en producción
const IS_PRODUCTION = import.meta.env.MODE === 'production';
const debugLog = IS_PRODUCTION ? () => {} : console.log;
const debugError = IS_PRODUCTION ? () => {} : console.error;
const debugWarn = IS_PRODUCTION ? () => {} : console.warn;

const { resumenBancarioApi, transaccionesApi, categoriasApi, metodosPagoApi } = apiServices;

export function ResumenGeneralView() {
  const [resumenes, setResumenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [creatingTransaction, setCreatingTransaction] = useState(null);
  const [pagosProcesados, setPagosProcesados] = useState(new Set());
  const [selectedResumen, setSelectedResumen] = useState(null);
  const [showResumenModal, setShowResumenModal] = useState(false);
  const [categoriaYMetodoCacheados, setCategoriaYMetodoCacheados] = useState(null);

  // Cargar resúmenes bancarios
  useEffect(() => {
    const cargarResumenes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        debugLog('🏦 Cargando resúmenes bancarios...');
        const response = await resumenBancarioApi.getAll(50, 0);
        const resumenesList = response.list || [];
        
        debugLog('🏦 Resúmenes cargados:', resumenesList.length);
        setResumenes(resumenesList);
        
        // Reset pagos procesados cuando cambia el período
        setPagosProcesados(new Set());
      } catch (error) {
        debugError('Error cargando resúmenes bancarios:', error);
        setError('Error al cargar los resúmenes bancarios: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarResumenes();
  }, [selectedMonth, selectedYear]);

  // Función para revertir pago completamente (reset + eliminar transacción)
  const revertirPago = async (resumen, tipoPago) => {
    // Debug: mostrar el estado actual del resumen
    debugLog('🔍 REVERTIR PAGO - Estado actual del resumen:', {
      id: resumen.id,
      banco: resumen.banco,
      minimo_pagado: resumen.minimo_pagado,
      total_pagado: resumen.total_pagado,
      transaccion_minimo_id: resumen.transaccion_minimo_id,
      transaccion_total_id: resumen.transaccion_total_id
    });

    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas REVERTIR el pago ${tipoPago}?\n\n` +
      `Esto hará lo siguiente:\n` +
      `• Marcará el pago como NO PAGADO\n` +
      `• ELIMINARÁ la transacción creada\n` +
      `• Esta acción NO se puede deshacer\n\n` +
      `¿Continuar?`
    );

    if (!confirmacion) return;

    try {
      // Obtener el ID de la transacción a eliminar
      const transaccionId = tipoPago === 'Mínimo' ? 
        resumen.transaccion_minimo_id : 
        resumen.transaccion_total_id;

      debugLog(`🗑️ ELIMINANDO transacción para pago ${tipoPago}:`, transaccionId);

      // 1. Eliminar la transacción si existe
      if (transaccionId) {
        try {
          await transaccionesApi.delete(transaccionId);
          debugLog('✅ Transacción eliminada:', transaccionId);
        } catch (deleteError) {
          debugError('⚠️ Error eliminando transacción (continuando):', deleteError);
          // Continuamos aunque no se pueda eliminar la transacción
        }
      } else {
        debugWarn('⚠️ No se encontró ID de transacción para eliminar');
      }

      // 2. Resetear el estado del pago
      const campoReset = tipoPago === 'Mínimo' ? 
        { 
          minimo_pagado: false, 
          fecha_pago_minimo: null,
          transaccion_minimo_id: null 
        } :
        { 
          total_pagado: false, 
          fecha_pago_total: null,
          transaccion_total_id: null 
        };

      // Actualizar en NocoDB
      await resumenBancarioApi.update(resumen.id, campoReset);
      debugLog('✅ Estado de pago revertido en BD:', campoReset);
      
      // Actualizar el estado local
      setResumenes(prev => prev.map(r => 
        r.id === resumen.id ? { ...r, ...campoReset } : r
      ));
      
      // También limpiar del estado local por si acaso
      const pagoId = `${resumen.id}-${tipoPago}`;
      setPagosProcesados(prev => {
        const newSet = new Set(prev);
        newSet.delete(pagoId);
        return newSet;
      });

      alert(`✅ Pago ${tipoPago} REVERTIDO completamente:\n• Estado: No pagado\n• Transacción: Eliminada`);
      
    } catch (error) {
      debugError('❌ Error revirtiendo pago:', error);
      
      // Detectar problemas de conectividad
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        alert(`🌐 Error de conectividad: No se puede conectar al servidor.\n\nPor favor:\n• Verifica tu conexión a internet\n• Intenta nuevamente en unos segundos\n\nEl pago NO ha sido revertido.`);
      } else {
        alert(`❌ Error al revertir el pago: ${error.message}`);
      }
    }
  };

  // Función para eliminar un resumen bancario
  const eliminarResumen = async (resumen) => {
    const confirmacion = window.confirm(
      `⚠️ ¿Estás seguro de que deseas ELIMINAR este resumen bancario?\n\n` +
      `Banco: ${resumen.banco || 'Sin nombre'}\n` +
      `Tipo: ${resumen.tipo_tarjeta || 'N/A'}\n` +
      `Saldo Total: $${(resumen.saldo_total_cierre || 0).toLocaleString('es-AR')}\n\n` +
      `⚠️ ADVERTENCIA: Esta acción NO se puede deshacer.\n\n` +
      `¿Continuar?`
    );

    if (!confirmacion) return;

    try {
      debugLog('🗑️ ELIMINANDO resumen bancario:', resumen.id);

      // Eliminar el resumen usando el API
      await resumenBancarioApi.delete(resumen.id);
      debugLog('✅ Resumen bancario eliminado exitosamente');

      // Actualizar el estado local removiendo el resumen eliminado
      setResumenes(prev => prev.filter(r => r.id !== resumen.id));

      alert(`✅ Resumen bancario eliminado exitosamente:\n• Banco: ${resumen.banco || 'Sin nombre'}\n• ID: ${resumen.id}`);
      
    } catch (error) {
      debugError('❌ Error eliminando resumen bancario:', error);
      
      // Detectar problemas de conectividad
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        alert(`🌐 Error de conectividad: No se puede conectar al servidor.\n\nPor favor:\n• Verifica tu conexión a internet\n• Intenta nuevamente en unos segundos\n\nEl resumen NO ha sido eliminado.`);
      } else {
        alert(`❌ Error al eliminar el resumen: ${error.message}`);
      }
    }
  };

  // Función para obtener IDs de categoría y método de pago (con caché)
  const obtenerIdsCategoriaYMetodo = async () => {
    // Si ya están cacheados, devolverlos
    if (categoriaYMetodoCacheados) {
      return categoriaYMetodoCacheados;
    }

    try {
      debugLog('🏦 DEBUG - Buscando categoría y método de pago...');
      
      // Buscar categoría "Pago tarjeta de crédito"
      const categorias = await categoriasApi.getAll(100, 0);
      const categoriasList = categorias.list || [];
      
      // Buscar con múltiples variantes del nombre
      const categoriaPagoTC = categoriasList.find(cat => {
        const nombre = cat.nombre?.toLowerCase() || '';
        return (nombre.includes('pago') && nombre.includes('tarjeta')) ||
               (nombre.includes('tarjeta') && nombre.includes('credito')) ||
               (nombre.includes('pago') && nombre.includes('tc')) ||
               nombre.includes('pago tarjeta');
      });

      // Buscar método de pago "débito"
      const metodosPago = await metodosPagoApi.getAll(100, 0);
      const metodosPagoList = metodosPago.list || [];
      
      const metodoDebito = metodosPagoList.find(metodo => {
        const nombre = metodo.nombre?.toLowerCase() || '';
        return nombre.includes('debito') || 
               nombre.includes('débito') || 
               nombre.includes('tarjeta debito') ||
               nombre === 'debito';
      });

      debugLog('🏦 DEBUG - Categoría encontrada:', categoriaPagoTC);
      debugLog('🏦 DEBUG - Método de pago encontrado:', metodoDebito);
      debugLog('🏦 DEBUG - Total categorías:', categoriasList.length);
      debugLog('🏦 DEBUG - Total métodos pago:', metodosPagoList.length);

      const resultado = {
        categoria_id: categoriaPagoTC?.id,
        metodo_pago_id: metodoDebito?.id
      };

      // Cachear el resultado
      setCategoriaYMetodoCacheados(resultado);
      
      return resultado;
    } catch (error) {
      debugError('❌ Error obteniendo categoría y método de pago:', error);
      return {
        categoria_id: null,
        metodo_pago_id: null
      };
    }
  };

  // Función para crear transacción de pago
  const crearTransaccionPago = async (resumen, tipoPago, monto) => {
    setCreatingTransaction(`${resumen.id}-${tipoPago}`);
    try {
      // Obtener los IDs de categoría y método de pago
      const { categoria_id, metodo_pago_id } = await obtenerIdsCategoriaYMetodo();

      const fechaTransaccion = new Date().toISOString().split('T')[0];
      const banco = resumen.banco || 'Banco no especificado';
      const numeroResumen = resumen.numero_resumen || '';
      const numeroCuenta = resumen.numero_cuenta ? ` - Cta: ${resumen.numero_cuenta}` : '';
      
      const nuevaTransaccion = {
        monto: monto,
        moneda: 'ARS',
        monto_ars: monto,
        tasa_cambio: 1,
        descripcion: `Pago ${tipoPago} - ${banco} ${numeroResumen}${numeroCuenta}`.trim(),
        fecha_transaccion: fechaTransaccion,
        tipo: 'gasto',
        notas: `Pago ${tipoPago} de tarjeta de crédito - ${banco}${numeroCuenta}`,
        archivo_adjunto: resumen.url_factura || '',
        IncluirEnCuotaAlimentaria: false,
        GastoCompartido: false,
        categoria_id: categoria_id,
        metodo_pago_id: metodo_pago_id
      };

      debugLog('🏦 Creando transacción de pago:', nuevaTransaccion);
      
      // Verificar que se hayan encontrado la categoría y método de pago
      if (!categoria_id) {
        debugWarn('⚠️ No se encontró la categoría "Pago tarjeta de crédito"');
      }
      if (!metodo_pago_id) {
        debugWarn('⚠️ No se encontró el método de pago "débito"');
      }

      // Crear la transacción primero
      const transaccionCreada = await transaccionesApi.create(nuevaTransaccion);
      debugLog('✅ Transacción creada:', transaccionCreada);
      
      // Verificar que tenemos el ID de la transacción
      if (!transaccionCreada?.id) {
        throw new Error('Error: La transacción fue creada pero no se recibió el ID');
      }
      debugLog('🔗 ID de transacción recibido:', transaccionCreada.id);

      // Marcar el pago como procesado en la base de datos
      const ahora = new Date().toISOString();
      const campoActualizacion = tipoPago === 'Mínimo' ? 
        { 
          minimo_pagado: true, 
          fecha_pago_minimo: ahora,
          transaccion_minimo_id: transaccionCreada.id // Guardar ID de la transacción
        } :
        { 
          total_pagado: true, 
          fecha_pago_total: ahora,
          transaccion_total_id: transaccionCreada.id // Guardar ID de la transacción
        };
      
      debugLog('📝 Datos que se guardarán en resumen_bancario:', campoActualizacion);

      try {
        // Actualizar el estado en NocoDB
        await resumenBancarioApi.update(resumen.id, campoActualizacion);
        debugLog('✅ Estado de pago actualizado en BD:', campoActualizacion);
        
        // Actualizar el estado local
        setResumenes(prev => prev.map(r => 
          r.id === resumen.id ? { ...r, ...campoActualizacion } : r
        ));
        
      } catch (updateError) {
        debugError('❌ Error actualizando estado de pago en BD:', updateError);
        
        // Si falla la actualización del resumen, intentar eliminar la transacción creada
        try {
          await transaccionesApi.delete(transaccionCreada.id);
          debugLog('🔄 Transacción eliminada por error en actualización de resumen');
        } catch (deleteError) {
          debugError('❌ Error eliminando transacción de fallback:', deleteError);
        }
        
        throw new Error('No se pudo actualizar el estado del resumen bancario');
      }
      
      // Mostrar mensaje de éxito con información adicional
      let mensajeExito = `✅ Transacción creada exitosamente: Pago ${tipoPago} por $${monto.toLocaleString('es-AR')}`;
      if (categoria_id && metodo_pago_id) {
        mensajeExito += '\n📂 Categoría: Pago tarjeta de crédito\n💳 Método: Débito';
      }
      alert(mensajeExito);
      
    } catch (error) {
      debugError('❌ Error creando transacción de pago:', error);
      
      // Detectar problemas de conectividad
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        alert(`🌐 Error de conectividad: No se puede conectar al servidor.\n\nPor favor:\n• Verifica tu conexión a internet\n• Intenta nuevamente en unos segundos\n\nEl pago NO ha sido procesado.`);
      } else {
        alert(`❌ Error al crear la transacción: ${error.message}`);
      }
    } finally {
      setCreatingTransaction(null);
    }
  };

  // Función para extraer montos del resumen (mejorada con logging)
  const extraerMontos = (resumen) => {
    debugLog('🔍 DEBUG EXTRAER MONTOS - Procesando resumen:', resumen.banco || 'Sin banco');
    debugLog('🔍 DEBUG - Estructura disponible:', {
      totales: !!resumen.totales,
      cargos: !!resumen.cargos,
      movimientos: !!resumen.movimientos,
      limites: !!resumen.limites
    });

    let pagoMinimo = 0;
    let saldoTotal = 0;
    
    // Función auxiliar para buscar montos con más variantes
    const buscarMonto = (obj, tipo) => {
      if (!obj || typeof obj !== 'object') return null;
      
      const entries = Object.entries(obj);
      debugLog(`🔍 DEBUG - Buscando ${tipo} en:`, entries);
      
      for (const [key, value] of entries) {
        const keyLower = key.toLowerCase();
        
        if (tipo === 'minimo') {
          // Buscar pago mínimo con múltiples variantes
          if ((keyLower.includes('minimo') || 
               keyLower.includes('minimum') || 
               keyLower.includes('pago_minimo') ||
               keyLower.includes('pagoMinimo') ||
               keyLower.includes('min_payment') ||
               keyLower === 'min' ||
               keyLower.includes('cuota_minima')) && 
               typeof value === 'number' && value > 0) {
            debugLog(`✅ ENCONTRADO pago mínimo: ${key} = ${value}`);
            return value;
          }
        } else if (tipo === 'total') {
          // Buscar saldo total con múltiples variantes
          if ((keyLower.includes('saldo') || 
               keyLower.includes('total') || 
               keyLower.includes('adeudado') ||
               keyLower.includes('balance') ||
               keyLower.includes('deuda') ||
               keyLower.includes('current_balance') ||
               keyLower.includes('saldo_actual') ||
               keyLower.includes('totalDeuda')) && 
               typeof value === 'number' && value > 0) {
            debugLog(`✅ ENCONTRADO saldo total: ${key} = ${value}`);
            return value;
          }
        }
      }
      return null;
    };
    
    // Buscar en totales primero (nueva estructura)
    if (resumen.totales) {
      const totales = typeof resumen.totales === 'string' 
        ? JSON.parse(resumen.totales) 
        : resumen.totales;
      
      debugLog('🔍 DEBUG - Analizando TOTALES:', totales);
      pagoMinimo = buscarMonto(totales, 'minimo') || pagoMinimo;
      saldoTotal = buscarMonto(totales, 'total') || saldoTotal;
    }
    
    // Buscar en límites si no se encontró
    if ((!pagoMinimo || !saldoTotal) && resumen.limites) {
      const limites = typeof resumen.limites === 'string' 
        ? JSON.parse(resumen.limites) 
        : resumen.limites;
      
      debugLog('🔍 DEBUG - Analizando LÍMITES:', limites);
      pagoMinimo = pagoMinimo || buscarMonto(limites, 'minimo');
      saldoTotal = saldoTotal || buscarMonto(limites, 'total');
    }
    
    // Buscar en cargos si no se encontró en totales
    if ((!pagoMinimo || !saldoTotal) && resumen.cargos) {
      const cargos = typeof resumen.cargos === 'string' 
        ? JSON.parse(resumen.cargos) 
        : resumen.cargos;
      
      debugLog('🔍 DEBUG - Analizando CARGOS:', cargos);
      pagoMinimo = pagoMinimo || buscarMonto(cargos, 'minimo');
      saldoTotal = saldoTotal || buscarMonto(cargos, 'total');
    }
    
    // Fallback: buscar en movimientos si no se encontró nada
    if ((!pagoMinimo || !saldoTotal) && resumen.movimientos) {
      const movimientos = typeof resumen.movimientos === 'string' 
        ? JSON.parse(resumen.movimientos) 
        : resumen.movimientos;
      
      debugLog('🔍 DEBUG - Analizando MOVIMIENTOS:', movimientos);
      pagoMinimo = pagoMinimo || buscarMonto(movimientos, 'minimo');
      saldoTotal = saldoTotal || buscarMonto(movimientos, 'total');
    }
    
    debugLog(`🎯 RESULTADO FINAL - ${resumen.banco}: Pago Mínimo = ${pagoMinimo}, Saldo Total = ${saldoTotal}`);
    
    return { pagoMinimo, saldoTotal };
  };

  // Filtrar resúmenes por búsqueda y fecha
  const filteredResumenes = resumenes.filter(resumen => 
    resumen.banco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resumen.numero_resumen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resumen.tipo_tarjeta?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para formatear objetos JSON para mostrar
  const formatJsonField = (field, fallback = 'No disponible') => {
    if (!field) return fallback;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return parsed;
      } catch {
        return field;
      }
    }
    return field;
  };

  // Función para renderizar datos estructurados
  const renderStructuredData = (data, title, colorClass = 'bg-zinc-800 border-zinc-600') => {
    const formattedData = formatJsonField(data);
    if (!formattedData || formattedData === 'No disponible') return null;

    const renderValue = (value, key = '') => {
      if (Array.isArray(value)) {
        // Manejar arrays (como opciones de financiamiento) de forma más organizada
        if (key.toLowerCase().includes('financiamiento') || key.toLowerCase().includes('opciones')) {
          return (
            <div className="space-y-2">
              {value.slice(0, 3).map((item, index) => (
                <div key={index} className="bg-zinc-700 border border-zinc-600 p-3 border-l-4 border-l-blue-400">
                  {typeof item === 'object' ? (
                    <div className="space-y-2">
                      {Object.entries(item).map(([subKey, subValue]) => (
                        <div key={subKey} className="flex justify-between items-center">
                          <span className="text-sm font-bold text-zinc-300 capitalize">
                            {subKey.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-sm font-black text-white">
                            {renderValue(subValue, subKey)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-white">{String(item)}</span>
                  )}
                </div>
              ))}
              {value.length > 3 && (
                <div className="text-center">
                  <span className="text-sm text-zinc-400 bg-zinc-700 px-3 py-1 rounded-none border border-zinc-600">
                    +{value.length - 3} opciones más
                  </span>
                </div>
              )}
            </div>
          );
        }
        
        // Para otros arrays, mostrar de forma compacta
        return (
          <div className="space-y-1">
            {value.slice(0, 5).map((item, index) => (
              <div key={index} className="text-sm bg-zinc-700 border border-zinc-600 px-2 py-1 rounded-none">
                {renderValue(item)}
              </div>
            ))}
            {value.length > 5 && (
              <span className="text-xs text-zinc-400">... y {value.length - 5} más</span>
            )}
          </div>
        );
      }
      
      if (typeof value === 'object' && value !== null) {
        // Limitar la profundidad de objetos anidados para evitar "choclos"
        const entries = Object.entries(value);
        if (entries.length > 5) {
          return (
            <div className="space-y-2">
              {entries.slice(0, 3).map(([subKey, subValue]) => (
                <div key={subKey} className="flex justify-between items-start">
                  <span className="font-bold text-sm capitalize text-zinc-300 flex-shrink-0 w-1/3">
                    {subKey.replace(/_/g, ' ')}: 
                  </span>
                  <span className="text-sm text-right flex-grow ml-2 text-white">{renderValue(subValue, subKey)}</span>
                </div>
              ))}
              <div className="text-center pt-2 border-t border-zinc-600">
                <span className="text-xs text-zinc-400 bg-zinc-700 px-2 py-1 rounded-none border border-zinc-600">
                  +{entries.length - 3} campos más
                </span>
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-2">
            {entries.map(([subKey, subValue]) => (
              <div key={subKey} className="flex justify-between items-start">
                <span className="font-bold text-sm capitalize text-zinc-300 flex-shrink-0 w-1/3">
                  {subKey.replace(/_/g, ' ')}: 
                </span>
                <span className="text-sm text-right flex-grow ml-2 text-white">{renderValue(subValue, subKey)}</span>
              </div>
            ))}
          </div>
        );
      }
      
      // Formatear valores específicos
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(value).toLocaleDateString('es-ES');
      }
      
      // Formatear montos y pagos
      if (typeof value === 'number' && (
        key.toLowerCase().includes('monto') ||
        key.toLowerCase().includes('pago') ||
        key.toLowerCase().includes('total') ||
        key.toLowerCase().includes('limite') ||
        key.toLowerCase().includes('saldo') ||
        key.toLowerCase().includes('cuota') ||
        key.toLowerCase().includes('minimo')
      )) {
        const formatted = new Intl.NumberFormat('es-AR', { 
          style: 'currency', 
          currency: 'ARS' 
        }).format(value);
        
        // Resaltar pagos mínimos con estilo especial
        if (key.toLowerCase().includes('minimo') || key.toLowerCase().includes('pago_minimo')) {
          return (
            <span className="px-3 py-2 bg-red-500 border-2 border-red-400 text-white rounded-none font-black text-lg shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
              {formatted}
            </span>
          );
        }
        
        // Resaltar saldos adeudados
        if (key.toLowerCase().includes('saldo') || key.toLowerCase().includes('adeudado')) {
          return (
            <span className="px-3 py-2 bg-orange-500 border-2 border-orange-400 text-white rounded-none font-black text-lg shadow-[2px_2px_0px_0px_rgba(249,115,22,1)]">
              {formatted}
            </span>
          );
        }
        
        return <span className="font-mono font-bold text-lg text-green-400">{formatted}</span>;
      }
      
      // Formatear porcentajes
      if (typeof value === 'number' && key.toLowerCase().includes('tasa')) {
        return <span className="font-mono text-yellow-400 font-bold">{value}%</span>;
      }
      
      return String(value);
    };

    return (
      <div className={`p-4 ${colorClass} border-2 rounded-none shadow-[4px_4px_0px_0px_rgba(63,63,70,1)]`}>
        <h4 className="font-black text-lg mb-4 flex items-center text-white">
          {title}
        </h4>
        <div className="space-y-3">
          {typeof formattedData === 'object' ? (
            Object.entries(formattedData).map(([key, value]) => (
              <div key={key} className="flex flex-col space-y-2">
                <span className="font-bold text-sm capitalize text-zinc-300 uppercase tracking-wide">
                  {key.replace(/_/g, ' ')}:
                </span>
                <div className="text-white">
                  {renderValue(value, key)}
                </div>
              </div>
            ))
          ) : (
            <span className="text-sm text-white">
              {renderValue(formattedData)}
            </span>
          )}
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <main className="flex-1 p-6 overflow-y-auto min-h-screen" style={{background: '#1a1a1a'}}>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 bg-blue-500 border-2 border-white animate-bounce flex items-center justify-center rounded-none">
            <Building2 size={32} className="text-white" strokeWidth={3} />
        </div>
      </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-6 overflow-y-auto min-h-screen" style={{background: '#1a1a1a'}}>
        <div className="bg-red-500 border-2 border-red-400 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] p-6">
          <div className="flex items-center gap-3 text-white">
            <AlertCircle size={20} strokeWidth={3} />
            <span className="font-bold">{error}</span>
            </div>
      </div>
      </main>
    );
  }

  return (
      <main className="min-h-full p-6 pb-32 md:pb-6" style={{background: '#000000'}}>
      {/* Header */}
      <header className="mb-6">
        {/* Título con ícono moderno */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Resumen General</h1>
            <p className="text-zinc-400 text-sm">Gestión de resúmenes y estados de tarjetas de crédito</p>
          </div>
        </div>

        {/* Search and filters - Diseño moderno */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4">
          <div className="flex flex-col gap-3">
            {/* Buscador */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por banco, número o tipo de tarjeta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 placeholder-zinc-500 text-sm transition-all"
              />
            </div>
            
            {/* Filtro de período */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-zinc-400">
                <Filter size={16} />
                <span className="text-sm font-medium">Período:</span>
              </div>
              
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
              >
                <option value={0}>Enero</option>
                <option value={1}>Febrero</option>
                <option value={2}>Marzo</option>
                <option value={3}>Abril</option>
                <option value={4}>Mayo</option>
                <option value={5}>Junio</option>
                <option value={6}>Julio</option>
                <option value={7}>Agosto</option>
                <option value={8}>Septiembre</option>
                <option value={9}>Octubre</option>
                <option value={10}>Noviembre</option>
                <option value={11}>Diciembre</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Widget de Cotización del Dólar */}
      <div className="mb-6">
        <DollarQuoteWidget />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Total Resúmenes */}
        <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-bold uppercase">Total Resúmenes</p>
              <p className="text-3xl font-bold text-white mt-1">{resumenes.length}</p>
              <p className="text-xs text-zinc-500 mt-1">registros cargados</p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center rounded-lg">
              <FileText size={20} className="text-green-400" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Bancos Únicos */}
        <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-bold uppercase">Bancos Únicos</p>
              <p className="text-3xl font-bold text-white mt-1">
                {new Set(resumenes.map(r => r.banco).filter(Boolean)).size}
              </p>
              <p className="text-xs text-zinc-500 mt-1">instituciones diferentes</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center rounded-lg">
              <Building2 size={20} className="text-blue-400" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Tarjetas */}
        <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-bold uppercase">Tarjetas</p>
              <p className="text-3xl font-bold text-white mt-1">
                {resumenes.filter(r => r.tipo_tarjeta).length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">con tipo definido</p>
            </div>
            <div className="w-10 h-10 bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center rounded-lg">
              <CreditCard size={20} className="text-purple-400" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Más Recientes */}
        <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-bold uppercase">Más Recientes</p>
              <p className="text-3xl font-bold text-white mt-1">
                {resumenes.filter(r => {
                  const fecha = new Date(r.fecha_carga || r.created_at);
                  const unMesAtras = new Date();
                  unMesAtras.setMonth(unMesAtras.getMonth() - 1);
                  return fecha > unMesAtras;
                }).length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">último mes</p>
            </div>
            <div className="w-10 h-10 bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center rounded-lg">
              <Calendar size={20} className="text-orange-400" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Pago Rápido */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 border-2 border-black flex items-center justify-center rounded-none">
            <DollarSign size={16} className="text-white" strokeWidth={3} />
          </div>
          <h3 className="text-xl font-black text-white">Pagos Rápidos</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumenes.map((resumen) => {
            const { pagoMinimo, saldoTotal } = extraerMontos(resumen);
            
            // Debug logging para cada tarjeta
            debugLog(`💳 CARD DEBUG - ${resumen.banco || 'Sin banco'}:`, {
              pagoMinimo,
              saldoTotal,
              showCard: !!(pagoMinimo || saldoTotal)
            });
            
            if (!pagoMinimo && !saldoTotal) {
              debugLog(`⚠️ CARD OCULTA - ${resumen.banco}: No se encontraron montos válidos`);
              return null;
            }
            
            const pagoMinimoId = `${resumen.id}-Mínimo`;
            const pagoTotalId = `${resumen.id}-Total`;
            
      // Verificar estado desde la BD y fallback al estado local
      const minimoYaPagado = resumen.minimo_pagado || pagosProcesados.has(pagoMinimoId);
      const totalYaPagado = resumen.total_pagado || pagosProcesados.has(pagoTotalId);
      
      // Debug: mostrar IDs de transacciones si existen
      if (resumen.transaccion_minimo_id) {
        debugLog('🔗 Transacción mínimo ID:', resumen.transaccion_minimo_id);
      }
      if (resumen.transaccion_total_id) {
        debugLog('🔗 Transacción total ID:', resumen.transaccion_total_id);
      }
            const algunPagado = minimoYaPagado || totalYaPagado;
            
            return (
              <div key={`pago-${resumen.id}`} 
                   className={`bg-zinc-900 border-2 rounded-lg transition-all duration-300 ${
                       algunPagado 
                       ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
                       : 'border-zinc-700'
                   }`}
                   style={{background: 'hsl(0 0% 9%)'}}>
                
                <div className="p-4">
                {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center rounded-md">
                        <CreditCard size={16} className="text-green-400" strokeWidth={2} />
                    </div>
                      <div>
                        <h4 className="text-white font-bold text-md">
                        {resumen.banco || 'Banco'}
                    </h4>
                        <p className="text-zinc-400 text-xs">
                          Última actualización: {resumen.fecha_carga ? new Date(resumen.fecha_carga).toLocaleDateString('es-ES') : 'N/A'}
                        </p>
                    </div>
                    </div>
                    <Badge className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md border border-zinc-700">
                      {resumen.tipo_tarjeta || 'TC'}
                        </Badge>
                  </div>

                  {/* Montos principales */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black/50 border border-zinc-800 rounded-lg p-3 text-center">
                    <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Pago Mínimo</p>
                      <p className={`font-bold text-lg ${minimoYaPagado ? 'text-zinc-500 line-through' : 'text-white'}`}>
                        ${pagoMinimo.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="bg-black/50 border border-zinc-800 rounded-lg p-3 text-center">
                    <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Saldo Total</p>
                      <p className={`font-bold text-lg ${totalYaPagado ? 'text-zinc-500 line-through' : 'text-green-400'}`}>
                        ${saldoTotal.toLocaleString('es-AR')}
                      </p>
                    </div>
                    </div>
                  </div>
                  
                {/* Footer con acciones */}
                <div className="bg-black/20 border-t-2 border-zinc-700 px-4 py-3">
                  <div className="flex gap-2 mb-2">
                    <Button
                      className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs px-2 py-2 hover:bg-zinc-700 hover:text-white"
                      onClick={() => {
                        setSelectedResumen(resumen);
                        setShowResumenModal(true);
                      }}
                    >
                      <Eye size={12} className="mr-1" strokeWidth={2} />
                      Ver Detalle
                    </Button>

                    <Button
                      className="bg-red-600/50 border border-red-500/50 text-white text-xs px-3 py-2 hover:bg-red-700 transition-all"
                      onClick={() => eliminarResumen(resumen)}
                      title="Eliminar resumen bancario"
                    >
                      <Trash2 size={12} strokeWidth={2} />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {!minimoYaPagado && (
                      <Button
                        className="flex-1 bg-red-600/50 border border-red-500/50 text-white font-bold uppercase text-xs py-2 transition-all hover:bg-red-600/80"
                      onClick={() => crearTransaccionPago(resumen, 'Mínimo', pagoMinimo)}
                        disabled={creatingTransaction === pagoMinimoId || !pagoMinimo}
                      >
                        {creatingTransaction === pagoMinimoId ? 'Pagando...' : 'Pagar Mínimo'}
                    </Button>
                    )}
                    
                    {!totalYaPagado && (
                    <Button
                        className="flex-1 bg-green-600/50 border border-green-500/50 text-white font-bold uppercase text-xs py-2 transition-all hover:bg-green-600/80"
                      onClick={() => crearTransaccionPago(resumen, 'Total', saldoTotal)}
                        disabled={creatingTransaction === pagoTotalId || !saldoTotal}
                      >
                        {creatingTransaction === pagoTotalId ? 'Pagando...' : 'Pagar Total'}
                    </Button>
                    )}
                  </div>
                  
                    {algunPagado && (
                    <div className="flex gap-1 mt-2 justify-end">
                        {minimoYaPagado && (
                          <Button
                          className="bg-zinc-800 border border-zinc-700 text-red-400 text-xs px-2 py-1 hover:bg-zinc-700"
                            onClick={() => revertirPago(resumen, 'Mínimo')}
                          title="Revertir pago mínimo"
                          >
                          Revertir Mínimo
                          </Button>
                        )}
                        {totalYaPagado && (
                          <Button
                          className="bg-zinc-800 border border-zinc-700 text-red-400 text-xs px-2 py-1 hover:bg-zinc-700"
                            onClick={() => revertirPago(resumen, 'Total')}
                          title="Revertir pago total"
                          >
                          Revertir Total
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Resumen Detallado */}
      {showResumenModal && selectedResumen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-zinc-900 border-2 border-zinc-700 shadow-[8px_8px_0px_0px_rgba(63,63,70,1)] max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            {/* Header del modal */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 border-2 border-black flex items-center justify-center rounded-none">
                  <Building2 size={16} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
              {selectedResumen?.banco || 'Resumen General'}
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    {selectedResumen?.numero_resumen || 'Sin número'} - {selectedResumen?.tipo_tarjeta}
                  </p>
                </div>
              </div>
              <Button
                className="bg-red-500 border-2 border-red-400 text-white font-bold text-xs px-3 py-2 hover:bg-red-600"
                onClick={() => setShowResumenModal(false)}
              >
                ✕ Cerrar
              </Button>
            </div>

            {/* Contenido del modal */}
            <div className="space-y-6">
              {/* INFORMACIÓN PRINCIPAL DEL TITULAR */}
              {selectedResumen.titular && renderStructuredData(
                selectedResumen.titular,
                "👤 Información del Titular",
                "bg-zinc-800 border-blue-500"
              )}

              {/* CICLO DE FACTURACIÓN */}
              {selectedResumen.ciclo_facturacion && renderStructuredData(
                selectedResumen.ciclo_facturacion,
                "📅 Ciclo de Facturación",
                "bg-zinc-800 border-purple-500"
              )}

              {/* TOTALES Y PAGOS - La información más importante */}
              {selectedResumen.totales && renderStructuredData(
                selectedResumen.totales,
                "💰 Totales y Pagos",
                "bg-zinc-800 border-green-500"
              )}

              {/* LÍMITES DE CRÉDITO */}
              {selectedResumen.limites && renderStructuredData(
                selectedResumen.limites,
                "🚫 Límites de Crédito",
                "bg-zinc-800 border-orange-500"
              )}

              {/* TASAS DE INTERÉS */}
              {selectedResumen.tasas && renderStructuredData(
                selectedResumen.tasas,
                "📈 Tasas de Interés",
                "bg-zinc-800 border-red-500"
              )}

              {/* MOVIMIENTOS */}
              {selectedResumen.movimientos && renderStructuredData(
                selectedResumen.movimientos,
                "🔄 Resumen de Movimientos",
                "bg-zinc-800 border-yellow-500"
              )}

              {/* CARGOS ADICIONALES */}
              {selectedResumen.cargos && renderStructuredData(
                selectedResumen.cargos,
                "💳 Cargos Adicionales",
                "bg-zinc-800 border-gray-500"
              )}

              {/* Información adicional */}
              <div className="bg-zinc-800 border-2 border-zinc-600 p-4">
                <h4 className="font-black text-white mb-4">ℹ️ Información Adicional</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-bold text-zinc-300">Número de Cuenta:</span>
                    <div className="text-white font-mono">
                      {selectedResumen.numero_cuenta || 'No especificado'}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-300">Fecha de carga:</span>
                    <div className="text-white">
                      {selectedResumen.fecha_carga ? new Date(selectedResumen.fecha_carga).toLocaleDateString('es-ES') : 'No especificada'}
                    </div>
                  </div>
                </div>

                {/* URL de la factura si está disponible */}
                {selectedResumen.url_factura && (
                  <div className="pt-4">
                    <span className="font-bold text-zinc-300 block mb-2">Factura:</span>
                    <a 
                      href={selectedResumen.url_factura} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-500 border-2 border-blue-400 text-white font-bold uppercase text-xs px-3 py-2 shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(59,130,246,1)] transition-all"
                    >
                      <FileText size={12} strokeWidth={3} />
                      Ver Factura
                    </a>
                  </div>
                )}
              </div>
            </div>
              </div>
            </div>
          )}

      {/* Espaciador extra para móvil */}
      <div className="h-8 md:hidden"></div>

    </main>
  );
}