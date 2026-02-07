import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, AlertCircle, Save, Loader2 } from 'lucide-react';
import apiServices from '../../services/api';

const BudgetModal = ({ isOpen, onClose, onSuccess, editingBudget = null }) => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    monto_limite: '',
    periodo: 'mensual',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    alerta_porcentaje: 80,
    categoria_id: '',
    color: '#4CAF50'
  });

  useEffect(() => {
    if (isOpen) {
      loadCategorias();
      
      if (editingBudget) {
        setFormData({
          nombre: editingBudget.nombre || '',
          descripcion: editingBudget.descripcion || '',
          monto_limite: editingBudget.monto_limite || '',
          periodo: editingBudget.periodo || 'mensual',
          fecha_inicio: editingBudget.fecha_inicio || '',
          fecha_fin: editingBudget.fecha_fin || '',
          alerta_porcentaje: editingBudget.alerta_porcentaje || 80,
          categoria_id: editingBudget.categoria_id || '',
          color: editingBudget.color || '#4CAF50'
        });
      } else {
        // Auto-calculate fecha_fin based on periodo
        calculateFechaFin('mensual');
      }
    }
  }, [isOpen, editingBudget]);

  const loadCategorias = async () => {
    try {
      const response = await apiServices.categoriasApi.getAll();
      setCategorias(response.list || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const calculateFechaFin = (periodo, fechaInicio = formData.fecha_inicio) => {
    const start = new Date(fechaInicio);
    let end = new Date(start);
    
    switch (periodo) {
      case 'semanal':
        end.setDate(start.getDate() + 6);
        break;
      case 'mensual':
        end.setMonth(start.getMonth() + 1);
        end.setDate(0); // Last day of month
        break;
      case 'anual':
        end.setFullYear(start.getFullYear() + 1);
        end.setDate(end.getDate() - 1);
        break;
      default:
        // personalizado - no calcular
        return;
    }
    
    setFormData(prev => ({
      ...prev,
      fecha_fin: end.toISOString().split('T')[0]
    }));
  };

  const handlePeriodoChange = (periodo) => {
    setFormData(prev => ({ ...prev, periodo }));
    if (periodo !== 'personalizado') {
      calculateFechaFin(periodo);
    }
  };

  const handleFechaInicioChange = (fecha) => {
    setFormData(prev => ({ ...prev, fecha_inicio: fecha }));
    if (formData.periodo !== 'personalizado') {
      calculateFechaFin(formData.periodo, fecha);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.monto_limite) {
      alert('Por favor completa nombre y monto límite');
      return;
    }

    setLoading(true);

    try {
      const budgetData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        monto_limite: parseFloat(formData.monto_limite),
        periodo: formData.periodo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        alerta_porcentaje: parseInt(formData.alerta_porcentaje),
        categoria_id: formData.categoria_id || null,
        color: formData.color,
        estado: 'activo'
      };

      if (editingBudget) {
        await apiServices.presupuestosApi.update(editingBudget.id, budgetData);
      } else {
        await apiServices.presupuestosApi.create(budgetData);
      }

      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        monto_limite: '',
        periodo: 'mensual',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: '',
        alerta_porcentaje: 80,
        categoria_id: '',
        color: '#4CAF50'
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Error guardando presupuesto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#09090b] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#09090b]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </h2>
            <p className="text-zinc-400 mt-0.5 text-sm">Define límites de gasto para mantener el control</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Nombre del Presupuesto *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="ej: Alimentación Enero 2024"
                className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Monto Límite */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Monto Límite *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-base font-bold text-purple-400">$</span>
                <input
                  type="number"
                  value={formData.monto_limite}
                  onChange={(e) => setFormData(prev => ({ ...prev, monto_limite: e.target.value }))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-lg font-bold text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
                  step="0.01"
                />
              </div>
            </div>

            {/* Categoría (opcional) */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Categoría (opcional)</label>
              <select
                value={formData.categoria_id}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">Presupuesto General (todas las categorías)</option>
                {categorias.filter(c => c.tipo === 'gasto').map(c => (
                  <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 mt-1">Si no seleccionas categoría, será un presupuesto general</p>
            </div>

            {/* Período */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Período</label>
              <div className="grid grid-cols-4 gap-2">
                {['semanal', 'mensual', 'anual', 'personalizado'].map((periodo) => (
                  <button
                    key={periodo}
                    onClick={() => handlePeriodoChange(periodo)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      formData.periodo === periodo
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Fecha Inicio</label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => handleFechaInicioChange(e.target.value)}
                  className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Fecha Fin</label>
                <input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                  disabled={formData.periodo !== 'personalizado'}
                  className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Alerta */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Alerta al alcanzar {formData.alerta_porcentaje}%</label>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={formData.alerta_porcentaje}
                onChange={(e) => setFormData(prev => ({ ...prev, alerta_porcentaje: e.target.value }))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Descripción (opcional)</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Detalles adicionales..."
                rows={2}
                className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#09090b] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white font-medium hover:bg-white/5 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.nombre.trim() || !formData.monto_limite}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            {editingBudget ? 'Guardar' : 'Crear Presupuesto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetModal;

