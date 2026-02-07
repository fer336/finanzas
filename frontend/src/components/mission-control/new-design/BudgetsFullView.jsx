import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, DollarSign, Calendar, Tag, Edit2, Trash2, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import apiServices from '../../../services/api';
import BudgetModal from '../../modals/BudgetModal';

export const BudgetsFullView = ({ onBack }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await apiServices.presupuestosApi.getActive();
      setBudgets(response.list || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleDelete = async (budgetId) => {
    try {
      await apiServices.presupuestosApi.delete(budgetId);
      setDeleteConfirm(null);
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Error eliminando presupuesto: ' + error.message);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBudget(null);
  };

  const handleSuccess = () => {
    fetchBudgets();
    handleModalClose();
  };

  const getStatusInfo = (budget) => {
    const porcentaje = budget.porcentaje_usado || 0;
    
    if (porcentaje >= 100) {
      return {
        color: 'red',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        bar: 'bg-red-500',
        border: 'border-red-500/30',
        label: 'Excedido',
        icon: <AlertCircle size={20} />
      };
    }
    if (porcentaje >= 90) {
      return {
        color: 'orange',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        bar: 'bg-orange-500',
        border: 'border-orange-500/30',
        label: 'Crítico',
        icon: <AlertCircle size={20} />
      };
    }
    if (porcentaje >= 70) {
      return {
        color: 'yellow',
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        bar: 'bg-yellow-500',
        border: 'border-yellow-500/30',
        label: 'Alerta',
        icon: <TrendingUp size={20} />
      };
    }
    return {
      color: 'green',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      bar: 'bg-green-500',
      border: 'border-green-500/30',
      label: 'Óptimo',
      icon: <CheckCircle size={20} />
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09090b] to-zinc-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 hover:bg-white/5 rounded-2xl transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Presupuestos</h1>
              <p className="text-zinc-400 mt-1">Administra tus límites de gasto</p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold shadow-lg hover:shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2"
          >
            <Plus size={20} strokeWidth={3} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Nuevo Presupuesto</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded"></div>
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && budgets.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No hay presupuestos activos</h3>
            <p className="text-zinc-400 mb-6">Crea tu primer presupuesto para mantener el control de tus gastos</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl font-bold shadow-lg hover:shadow-purple-500/20 transition-all"
            >
              Crear Presupuesto
            </button>
          </div>
        )}

        {/* Budgets Grid */}
        {!loading && budgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const status = getStatusInfo(budget);
              const porcentaje = budget.porcentaje_usado || 0;
              const diasRestantes = Math.ceil((new Date(budget.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <div
                  key={budget.id}
                  className={`glass-panel p-6 border-2 ${status.border} hover:scale-[1.02] transition-all`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {budget.categoria && (
                          <span className="text-xl">{budget.categoria.icono}</span>
                        )}
                        <h3 className="text-lg font-bold text-white truncate">
                          {budget.categoria?.nombre || 'General'}
                        </h3>
                      </div>
                      <p className="text-sm text-zinc-400">{budget.nombre}</p>
                    </div>
                    
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${status.bg} ${status.text}`}>
                      {status.icon}
                      <span className="text-sm font-bold ml-1">{status.label}</span>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-black text-white">
                        ${budget.monto_gastado?.toLocaleString('es-AR') || 0}
                      </span>
                      <span className="text-sm text-zinc-500">
                        de ${budget.monto_limite?.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={status.text}>
                        {porcentaje.toFixed(1)}% utilizado
                      </span>
                      <span className="text-zinc-400">
                        Disponible: ${budget.monto_disponible?.toLocaleString('es-AR') || 0}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">
                    <div
                      className={`absolute top-0 left-0 h-full ${status.bar} transition-all duration-500`}
                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    />
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{diasRestantes} días restantes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag size={12} />
                      <span className="capitalize">{budget.periodo}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-white/5">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(budget.id)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <BudgetModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        editingBudget={editingBudget}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1050] flex items-center justify-center p-4">
          <div className="bg-[#09090b] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar Presupuesto?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

