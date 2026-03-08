import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import FloatingActionButton from '../common/FloatingActionButton';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';

/**
 * ModernMonedasView - Vista de Gestión de Monedas
 */
const ModernMonedasView = ({
  monedas = [],
  onNewMoneda,
  onEditMoneda,
  onDeleteMoneda,
  onToggleActive,
  onReorder,
  onInitializeDefault
}) => {
  // Normalizar monedas del backend
  const normalizedMonedas = monedas.map(m => ({
    id: m.id || m.Id,
    codigo: m.codigo || m.Codigo || 'N/A',
    nombre: m.nombre || m.Nombre || 'Sin nombre',
    simbolo: m.simbolo || m.Simbolo || '$',
    color: m.color || m.Color || 'from-gray-500 to-gray-600',
    icono: m.icono || m.Icono,
    activa: m.activa !== undefined ? m.activa : (m.Activa !== undefined ? m.Activa : true),
    esPredeterminada: m.es_predeterminada || m.EsPredeterminada || false,
    tasaCambioARS: parseFloat(m.tasa_cambio_a_ars || m.TasaCambioARS || 1),
    orden: m.orden || m.Orden || 0
  }));

  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.monedas]);
  const activasCount = normalizedMonedas.filter(m => m.activa).length;
  const inactivasCount = normalizedMonedas.filter(m => !m.activa).length;
  const personalizadasCount = normalizedMonedas.filter(m => !m.esPredeterminada).length;

  // Ordenar por campo 'orden'
  const sorted = [...normalizedMonedas].sort((a, b) => a.orden - b.orden);

  const fabActions = [
    { 
      icon: RefreshCw, 
      label: 'Actualizar Tasas', 
      onClick: onInitializeDefault 
    },
    { 
      icon: Plus, 
      label: 'Nueva Moneda', 
      onClick: onNewMoneda 
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 pb-32">
      {/* Barra superior */}
      <div className="flex items-center justify-end mb-4 gap-2">
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 bg-[#18181b] hover:bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50"
          title="Actualizar monedas"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#18181b] rounded-2xl p-5 border border-white/5">
          <p className="text-xs text-gray-500 mb-2">TOTAL MONEDAS</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-white">{normalizedMonedas.length}</p>
            <span className="text-3xl">💰</span>
          </div>
        </div>
        <div className="bg-[#18181b] rounded-2xl p-5 border border-white/5">
          <p className="text-xs text-gray-500 mb-2">ACTIVAS</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-[#10b981]">{activasCount}</p>
            <Eye className="w-8 h-8 text-[#10b981]" />
          </div>
        </div>
        <div className="bg-[#18181b] rounded-2xl p-5 border border-white/5">
          <p className="text-xs text-gray-500 mb-2">INACTIVAS</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-[#ec4899]">{inactivasCount}</p>
            <EyeOff className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-[#18181b] rounded-2xl p-5 border border-white/5">
          <p className="text-xs text-gray-500 mb-2">PERSONALIZADAS</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-white">{personalizadasCount}</p>
            <span className="text-3xl">🎨</span>
          </div>
        </div>
      </div>

      {/* Lista de Monedas */}
      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">💱</span>
          <h3 className="text-xl font-bold text-white mb-2">No hay monedas configuradas</h3>
          <p className="text-gray-400 mb-6">
            Inicializa las monedas predeterminadas o crea una personalizada
          </p>
          <button 
            onClick={onInitializeDefault}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-medium hover:shadow-lg transition-all"
          >
            Inicializar Monedas Predeterminadas
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((moneda) => (
            <div 
              key={moneda.id}
              className={`bg-[#18181b] rounded-2xl p-5 border ${
                moneda.activa ? 'border-white/5' : 'border-white/5 opacity-50'
              } hover:bg-white/5 transition-all`}
            >
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <button className="cursor-move p-2 hover:bg-white/5 rounded-lg">
                  <GripVertical className="w-5 h-5 text-gray-600" />
                </button>

                {/* Icono de Moneda */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${moneda.color} flex items-center justify-center text-2xl font-bold text-white flex-shrink-0`}>
                  {moneda.simbolo}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{moneda.codigo}</h3>
                    <span className="text-sm text-gray-500">{moneda.simbolo}</span>
                    {moneda.esPredeterminada && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full border border-blue-500/20">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{moneda.nombre}</p>
                  {moneda.tasaCambioARS && moneda.tasaCambioARS !== 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      1 {moneda.codigo} = ${moneda.tasaCambioARS.toLocaleString()} ARS
                    </p>
                  )}
                </div>

                {/* Estado */}
                <div className="flex items-center gap-2">
                  {moneda.activa ? (
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                      Activa
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-500/10 text-gray-500 text-xs font-bold rounded-full border border-gray-500/20">
                      Inactiva
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggleActive && onToggleActive(moneda.id)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    title={moneda.activa ? 'Desactivar' : 'Activar'}
                  >
                    {moneda.activa ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-green-400" />
                    )}
                  </button>
                  <button
                    onClick={() => onEditMoneda && onEditMoneda(moneda)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                  {!moneda.esPredeterminada && (
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar moneda ${moneda.codigo}?`)) {
                          onDeleteMoneda && onDeleteMoneda(moneda.id);
                        }
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón Flotante con Acciones */}
      <FloatingActionButton actions={fabActions} />
    </div>
  );
};

ModernMonedasView.propTypes = {
  monedas: PropTypes.array,
  onNewMoneda: PropTypes.func,
  onEditMoneda: PropTypes.func,
  onDeleteMoneda: PropTypes.func,
  onToggleActive: PropTypes.func,
  onReorder: PropTypes.func,
  onInitializeDefault: PropTypes.func,
  loading: PropTypes.bool
};

export default ModernMonedasView;
