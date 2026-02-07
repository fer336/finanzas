import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Target, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import apiServices from '../../services/api';

const { transaccionesApi, objetivosApi } = apiServices;

const ObjetivoDetailModal = ({ objetivo, isOpen, onClose, onAportar }) => {
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [objetivoData, setObjetivoData] = useState(objetivo);

  useEffect(() => {
    if (isOpen && objetivo) {
      loadData();
    }
  }, [isOpen, objetivo]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos actualizados del objetivo
      const objetivoActualizado = await objetivosApi.getById(objetivo.id);
      setObjetivoData(objetivoActualizado);
      
      // Cargar todas las transacciones
      const allTransacciones = await transaccionesApi.getAll({ limit: 1000 });
      
      // Filtrar solo las que pertenecen a este objetivo
      const transaccionesObjetivo = (allTransacciones.list || []).filter(
        t => t.objetivo_id === objetivo.id
      );
      
      setTransacciones(transaccionesObjetivo);
    } catch (error) {
      console.error('Error loading objetivo data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !objetivoData) return null;

  const porcentaje = parseFloat(objetivoData.porcentaje_completado || 0);
  const montoActual = parseFloat(objetivoData.monto_actual || 0);
  const montoObjetivo = parseFloat(objetivoData.monto_objetivo || 0);
  const montoFaltante = montoObjetivo - montoActual;
  const isCompleted = porcentaje >= 100;

  // Calcular proyección
  const calcularProyeccion = () => {
    if (transacciones.length === 0) return null;
    
    // Ordenar por fecha
    const sorted = [...transacciones].sort((a, b) => 
      new Date(a.fecha_transaccion) - new Date(b.fecha_transaccion)
    );
    
    const firstDate = new Date(sorted[0].fecha_transaccion);
    const lastDate = new Date(sorted[sorted.length - 1].fecha_transaccion);
    const diasTranscurridos = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    
    if (diasTranscurridos === 0) return null;
    
    const aportePorDia = montoActual / diasTranscurridos;
    const diasFaltantes = Math.ceil(montoFaltante / aportePorDia);
    
    const fechaProyectada = new Date();
    fechaProyectada.setDate(fechaProyectada.getDate() + diasFaltantes);
    
    return fechaProyectada;
  };

  const fechaProyectada = calcularProyeccion();

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0a0e13] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X size={20} className="text-white" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="text-5xl">{objetivoData.icono || '🎯'}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{objetivoData.nombre}</h2>
              {objetivoData.descripcion && (
                <p className="text-sm text-zinc-400">{objetivoData.descripcion}</p>
              )}
              
              {/* Status Badge */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: isCompleted ? '#10b98120' : '#3b82f620',
                  color: isCompleted ? '#10b981' : '#3b82f6'
                }}>
                {isCompleted ? <CheckCircle2 size={14} /> : <Target size={14} />}
                {isCompleted ? 'Completado' : 'En Progreso'}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          
          {/* Progress Section */}
          <div className="bg-zinc-900/50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-zinc-400">Progreso</span>
              <span className="text-2xl font-bold text-white">{porcentaje.toFixed(1)}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(porcentaje, 100)}%` }}
              />
            </div>
            
            {/* Amounts */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-zinc-500">Actual</p>
                <p className="text-xl font-bold text-green-400">
                  ${montoActual.toLocaleString()} {objetivoData.moneda}
                </p>
              </div>
              <ChevronRight className="text-zinc-600" size={20} />
              <div className="text-right">
                <p className="text-zinc-500">Objetivo</p>
                <p className="text-xl font-bold text-blue-400">
                  ${montoObjetivo.toLocaleString()} {objetivoData.moneda}
                </p>
              </div>
            </div>
            
            {!isCompleted && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Falta</span>
                  <span className="text-lg font-bold text-orange-400">
                    ${montoFaltante.toLocaleString()} {objetivoData.moneda}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Proyección */}
          {!isCompleted && fechaProyectada && transacciones.length > 1 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="text-blue-400" size={20} />
                <div>
                  <p className="text-xs text-blue-300/70">Proyección de cumplimiento</p>
                  <p className="text-sm font-medium text-blue-300">
                    {fechaProyectada.toLocaleDateString('es-AR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transacciones */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign size={20} className="text-green-400" />
                Transacciones Vinculadas
              </h3>
              <button
                onClick={() => onAportar(objetivoData)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Plus size={16} />
                Aportar
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-zinc-500">Cargando...</div>
            ) : transacciones.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-700">
                <AlertCircle className="mx-auto mb-3 text-zinc-600" size={40} />
                <p className="text-zinc-500">Aún no hay transacciones vinculadas</p>
                <p className="text-xs text-zinc-600 mt-1">Haz clic en "Aportar" para empezar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transacciones.map((transaccion) => (
                  <div
                    key={transaccion.id}
                    className="bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 rounded-xl p-4 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {transaccion.descripcion || 'Sin descripción'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(transaccion.fecha_transaccion).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">
                          +${Math.abs(transaccion.monto).toLocaleString()}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {transaccion.moneda}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ObjetivoDetailModal;

