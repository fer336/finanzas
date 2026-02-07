import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Target, TrendingUp, Calendar, DollarSign, Edit, Trash2, PiggyBank } from 'lucide-react';
import apiServices from '../../../services/api';
import { useIsMobile } from '../../../hooks/use-mobile';
import ObjetivoDetailModal from '../ObjetivoDetailModal';

const ObjetivosFullView = ({ onBack, onEdit, onDelete, onCreateTransaction }) => {
  const isMobile = useIsMobile();
  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, en_progreso, completado
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [objetivoToDelete, setObjetivoToDelete] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedObjetivo, setSelectedObjetivo] = useState(null);

  useEffect(() => {
    fetchObjetivos();
  }, [filter]);

  const fetchObjetivos = async () => {
    setLoading(true);
    try {
      const estado = filter === 'all' ? null : filter;
      const response = await apiServices.objetivosApi.getAll(null, estado);
      setObjetivos(response.list || []);
    } catch (error) {
      console.error('Error fetching objetivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (objetivo, e) => {
    e.stopPropagation();
    setObjetivoToDelete(objetivo);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!objetivoToDelete) return;
    
    try {
      await apiServices.objetivosApi.delete(objetivoToDelete.id);
      setObjetivos(prev => prev.filter(obj => obj.id !== objetivoToDelete.id));
      setDeleteModalOpen(false);
      setObjetivoToDelete(null);
    } catch (error) {
      console.error('Error deleting objetivo:', error);
      alert('Error al eliminar el objetivo: ' + error.message);
    }
  };

  const handleObjetivoClick = (objetivo) => {
    setSelectedObjetivo(objetivo);
    setDetailModalOpen(true);
  };

  const handleAportar = (objetivo) => {
    setDetailModalOpen(false);
    // Abrir formulario de transacción con el objetivo pre-seleccionado
    if (onCreateTransaction) {
      onCreateTransaction({ objetivo_id: objetivo.id });
    }
  };

  const getStatusColor = (porcentaje) => {
    if (porcentaje >= 100) return { bg: 'bg-green-500/10', text: 'text-green-400', bar: 'bg-green-500', border: 'border-green-500/20' };
    if (porcentaje >= 75) return { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500', border: 'border-blue-500/20' };
    if (porcentaje >= 50) return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', bar: 'bg-yellow-500', border: 'border-yellow-500/20' };
    return { bg: 'bg-red-500/10', text: 'text-red-400', bar: 'bg-red-500', border: 'border-red-500/20' };
  };

  const formatCurrency = (amount, currency = 'ARS') => {
    const formatted = amount.toLocaleString('es-AR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
    return currency === 'USD' ? `USD ${formatted}` : `$${formatted}`;
  };

  const calculateStats = () => {
    const activos = objetivos.filter(obj => obj.estado === 'en_progreso');
    const completados = objetivos.filter(obj => obj.estado === 'completado');
    const totalObjetivo = activos.reduce((sum, obj) => sum + obj.monto_objetivo, 0);
    const totalAhorrado = activos.reduce((sum, obj) => sum + obj.monto_actual, 0);
    const porcentajeGlobal = totalObjetivo > 0 ? (totalAhorrado / totalObjetivo) * 100 : 0;

    return { activos: activos.length, completados: completados.length, totalObjetivo, totalAhorrado, porcentajeGlobal };
  };

  const stats = calculateStats();

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white pb-24">
        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold">Eliminar Objetivo</h3>
                </div>
                
                <p className="text-white/70">
                  ¿Estás seguro de que deseas eliminar este objetivo? 
                  <br />
                  <span className="text-white font-medium block mt-2">
                    {objetivoToDelete?.nombre}
                  </span>
                  <span className="text-xs text-zinc-500 block mt-1">
                    Se eliminarán también todos los aportes asociados.
                  </span>
                </p>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setObjetivoToDelete(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Objetivos</h1>
          </div>
          <button 
            onClick={() => onEdit && onEdit()}
            className="p-2 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 px-4 mb-4">
          <div className="bg-[#162028] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Activos</p>
            <p className="text-2xl font-bold text-white">{stats.activos}</p>
          </div>
          <div className="bg-[#162028] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Completados</p>
            <p className="text-2xl font-bold text-green-400">{stats.completados}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-zinc-400'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('en_progreso')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'en_progreso' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-zinc-400'
            }`}
          >
            En Progreso
          </button>
          <button
            onClick={() => setFilter('completado')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completado' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-zinc-400'
            }`}
          >
            Completados
          </button>
        </div>

        {/* Objetivos List */}
        <div className="flex-1 px-4 space-y-4 overflow-y-auto">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#162028] border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
                <div className="h-2 bg-white/10 rounded mb-3"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
              </div>
            ))
          ) : objetivos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-zinc-400 mb-4">No hay objetivos</p>
              <button
                onClick={() => onEdit && onEdit()}
                className="px-6 py-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30 font-medium"
              >
                Crear Primer Objetivo
              </button>
            </div>
          ) : (
            objetivos.map((objetivo) => {
              const porcentaje = objetivo.porcentaje_completado || 0;
              const status = getStatusColor(porcentaje);
              const faltante = objetivo.monto_objetivo - objetivo.monto_actual;
              
              return (
                <div
                  key={objetivo.id}
                  className={`bg-[#162028] border ${status.border} rounded-xl p-4 hover:bg-[#1a2830] transition-all cursor-pointer`}
                  onClick={() => handleObjetivoClick(objetivo)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-3xl">{objetivo.icono || '🎯'}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{objetivo.nombre}</h3>
                        {objetivo.tipo && (
                          <p className="text-xs text-zinc-500 capitalize">{objetivo.tipo}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className={`px-3 py-1 rounded-lg ${status.bg} ${status.text} text-xs font-bold`}>
                        {porcentaje.toFixed(0)}%
                      </div>
                      <button
                        onClick={(e) => handleDeleteClick(objetivo, e)}
                        className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                    <div
                      className={`absolute top-0 left-0 h-full ${status.bar} transition-all duration-500`}
                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    />
                  </div>

                  {/* Amounts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Ahorrado:</span>
                      <span className="font-bold text-white">
                        {formatCurrency(objetivo.monto_actual, objetivo.moneda)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Meta:</span>
                      <span className="font-medium text-zinc-300">
                        {formatCurrency(objetivo.monto_objetivo, objetivo.moneda)}
                      </span>
                    </div>
                    {faltante > 0 && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
                        <span className="text-zinc-400">Falta:</span>
                        <span className={`font-bold ${status.text}`}>
                          {formatCurrency(faltante, objetivo.moneda)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fecha objetivo */}
                  {objetivo.fecha_objetivo && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="w-3.5 h-3.5" />
                      Meta: {new Date(objetivo.fecha_objetivo).toLocaleDateString('es-AR')}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Desktop version - Similar structure
  return (
    <div className="min-h-screen bg-background text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Objetivos de Ahorro</h1>
              <p className="text-sm text-zinc-500 mt-1">Gestiona tus metas financieras</p>
            </div>
          </div>
          <button 
            onClick={() => onEdit && onEdit()}
            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/30 flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Objetivo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#162028] border border-white/10 rounded-xl p-4">
          <p className="text-sm text-zinc-500 mb-1">Activos</p>
          <p className="text-3xl font-bold text-white">{stats.activos}</p>
        </div>
        <div className="bg-[#162028] border border-white/10 rounded-xl p-4">
          <p className="text-sm text-zinc-500 mb-1">Completados</p>
          <p className="text-3xl font-bold text-green-400">{stats.completados}</p>
        </div>
        <div className="bg-[#162028] border border-white/10 rounded-xl p-4">
          <p className="text-sm text-zinc-500 mb-1">Total Ahorrado</p>
          <p className="text-2xl font-bold text-blue-400">${stats.totalAhorrado.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-[#162028] border border-white/10 rounded-xl p-4">
          <p className="text-sm text-zinc-500 mb-1">Progreso Global</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.porcentajeGlobal.toFixed(0)}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto flex gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          Todos ({objetivos.length})
        </button>
        <button
          onClick={() => setFilter('en_progreso')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'en_progreso' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          En Progreso
        </button>
        <button
          onClick={() => setFilter('completado')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completado' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          Completados
        </button>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#162028] border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-white/10 rounded mb-4"></div>
              <div className="h-5 bg-white/10 rounded w-1/2"></div>
            </div>
          ))
        ) : objetivos.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-cyan-400" />
            </div>
            <p className="text-zinc-400 mb-6 text-lg">No hay objetivos {filter !== 'all' && `en estado "${filter}"`}</p>
            <button
              onClick={() => onEdit && onEdit()}
              className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl border border-cyan-500/30 font-medium transition-colors"
            >
              Crear Nuevo Objetivo
            </button>
          </div>
        ) : (
          objetivos.map((objetivo) => {
            const porcentaje = objetivo.porcentaje_completado || 0;
            const status = getStatusColor(porcentaje);
            const faltante = objetivo.monto_objetivo - objetivo.monto_actual;
            
            return (
              <div
                key={objetivo.id}
                className={`bg-[#162028] border ${status.border} rounded-xl p-6 hover:bg-[#1a2830] transition-all cursor-pointer`}
                onClick={() => handleObjetivoClick(objetivo)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-4xl">{objetivo.icono || '🎯'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate">{objetivo.nombre}</h3>
                      {objetivo.tipo && (
                        <p className="text-sm text-zinc-500 capitalize">{objetivo.tipo}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(objetivo, e)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Progreso</span>
                    <span className={`text-sm font-bold ${status.text}`}>{porcentaje.toFixed(0)}%</span>
                  </div>
                  <div className="relative w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full ${status.bar} transition-all duration-500`}
                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Amounts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Ahorrado:</span>
                    <span className="font-bold text-white text-lg">
                      {formatCurrency(objetivo.monto_actual, objetivo.moneda)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Meta:</span>
                    <span className="font-medium text-zinc-300">
                      {formatCurrency(objetivo.monto_objetivo, objetivo.moneda)}
                    </span>
                  </div>
                  {faltante > 0 && (
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-sm text-zinc-400">Falta:</span>
                      <span className={`font-bold ${status.text}`}>
                        {formatCurrency(faltante, objetivo.moneda)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {objetivo.fecha_objetivo && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-sm text-zinc-500">
                    <Calendar className="w-4 h-4" />
                    Meta: {new Date(objetivo.fecha_objetivo).toLocaleDateString('es-AR')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Objetivo Detail Modal */}
      <ObjetivoDetailModal
        objetivo={selectedObjetivo}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onAportar={handleAportar}
      />
    </div>
  );
};

export default ObjetivosFullView;

