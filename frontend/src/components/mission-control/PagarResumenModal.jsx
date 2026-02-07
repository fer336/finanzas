import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, DollarSign, Calendar, Check, AlertCircle, Trash2 } from 'lucide-react';
import apiServices from '../../services/api';

const PagarResumenModal = ({ isOpen, onClose, deudaData, onSuccess }) => {
  const [selectedTransacciones, setSelectedTransacciones] = useState([]);
  const [metodoPagoId, setMetodoPagoId] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loadingMetodos, setLoadingMetodos] = useState(false);
  const [modalTransactions, setModalTransactions] = useState([]);

  const pendingTransactions = deudaData?.transacciones?.filter(t => !t.fecha_pago_real) || [];

  useEffect(() => {
    if (isOpen) {
      // Cargar métodos de pago
      loadMetodosPago();
      // Pre-seleccionar todas las transacciones
      const normalized = pendingTransactions.map(t => ({
        ...t,
        id: t.id || t.Id
      }));
      setModalTransactions(normalized);
      setSelectedTransacciones(normalized.map(t => t.id).filter(Boolean));
    }
  }, [isOpen, deudaData, pendingTransactions.length]);

  const loadMetodosPago = async () => {
    try {
      setLoadingMetodos(true);
      const response = await apiServices.metodosPagoApi.getAll();
      setMetodosPago(response.list || []);
    } catch (error) {
      console.error('Error loading metodos pago:', error);
    } finally {
      setLoadingMetodos(false);
    }
  };

  const toggleTransaccion = (transaccionId) => {
    setSelectedTransacciones(prev => {
      if (prev.includes(transaccionId)) {
        return prev.filter(id => id !== transaccionId);
      } else {
        return [...prev, transaccionId];
      }
    });
  };

  const toggleAll = () => {
    if (selectedTransacciones.length === modalTransactions.length) {
      setSelectedTransacciones([]);
    } else {
      setSelectedTransacciones(modalTransactions.map(t => t.id));
    }
  };

  const calcularTotalSeleccionado = () => {
    return modalTransactions
      .filter(t => selectedTransacciones.includes(t.id))
      .reduce((sum, t) => sum + Math.abs(t.monto), 0);
  };

  const handleDeleteTransaccion = async (transaccion) => {
    if (!window.confirm('¿Eliminar este gasto de crédito? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      setLoading(true);
      const transaccionId = transaccion.id || transaccion.Id;
      if (!transaccionId) {
        throw new Error('ID inválido');
      }
      await apiServices.transaccionesApi.delete(transaccionId);
      setModalTransactions(prev => prev.filter(t => t.id !== transaccionId));
      setSelectedTransacciones(prev => prev.filter(id => id !== transaccionId));
    } catch (error) {
      console.error('Error deleting credit transaction:', error);
      alert('Error al eliminar el gasto de crédito: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async () => {
    if (selectedTransacciones.length === 0) {
      alert('Debes seleccionar al menos una transacción');
      return;
    }

    if (!metodoPagoId) {
      alert('Debes seleccionar un método de pago');
      return;
    }

    try {
      setLoading(true);
      
      const totalSeleccionado = calcularTotalSeleccionado();
      
      await apiServices.tarjetasApi.pagarResumen({
        transaccion_ids: selectedTransacciones,
        fecha_pago: fechaPago,
        monto_total: totalSeleccionado,
        metodo_pago_id: metodoPagoId,
        notas: notas || `Pago resumen tarjeta - ${selectedTransacciones.length} transacciones`
      });

      alert(`✅ Resumen pagado exitosamente: $${totalSeleccionado.toLocaleString()}`);
      onSuccess && onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error pagando resumen:', error);
      alert('Error al pagar el resumen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !deudaData) return null;

  const totalSeleccionado = calcularTotalSeleccionado();

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0a0e13] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600/20 to-orange-600/20 p-4 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-full transition-colors z-10"
            disabled={loading}
          >
            <X size={18} className="text-white" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="text-4xl">💳</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">Pagar Resumen de Tarjeta</h2>
              <p className="text-xs text-zinc-400">
                Selecciona las transacciones que deseas pagar
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(88vh - 220px)' }}>
          
          {/* Resumen de Selección */}
          <div className="bg-zinc-900/50 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Transacciones seleccionadas</p>
              <p className="text-lg font-bold text-white">
                {selectedTransacciones.length} de {modalTransactions.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Total a pagar</p>
              <p className="text-xl font-bold text-red-400">
                ${totalSeleccionado.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Lista de Transacciones */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white">Transacciones Pendientes</h3>
              <button
                onClick={toggleAll}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {selectedTransacciones.length === modalTransactions.length ? 'Deseleccionar' : 'Seleccionar'} todas
              </button>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {modalTransactions.map((transaccion) => {
                const isSelected = selectedTransacciones.includes(transaccion.id);
                
                return (
                  <label
                    key={transaccion.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTransaccion(transaccion.id)}
                      className="w-4 h-4 rounded border-blue-500/30 bg-zinc-900 text-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {transaccion.descripcion || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(transaccion.fecha_transaccion).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-400">
                      ${Math.abs(transaccion.monto).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteTransaccion(transaccion);
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Eliminar gasto de crédito"
                      aria-label="Eliminar gasto de crédito"
                    >
                      <Trash2 size={14} />
                    </button>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Datos del Pago */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">Datos del Pago</h3>
            
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Método de Pago
              </label>
              <select
                value={metodoPagoId}
                onChange={(e) => setMetodoPagoId(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                disabled={loadingMetodos}
              >
                <option value="">Seleccionar método...</option>
                {metodosPago.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.icono} {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Fecha de Pago
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Notas (Opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Agrega notas sobre este pago..."
                className="w-full px-3 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none resize-none"
                rows={2}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/50">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handlePagar}
              disabled={loading || selectedTransacciones.length === 0 || !metodoPagoId}
              className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Confirmar (${totalSeleccionado.toLocaleString()})
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PagarResumenModal;

