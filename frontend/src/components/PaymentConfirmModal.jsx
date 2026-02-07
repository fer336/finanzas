import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar,
  CreditCard,
  Tag,
  X,
  Check
} from 'lucide-react';
import apiServices from '../services/api';

const { categoriasApi, metodosPagoApi } = apiServices;

const PaymentConfirmModal = ({ isOpen, onClose, onConfirm, payment }) => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  
  const [formData, setFormData] = useState({
    fechaPago: new Date().toISOString().split('T')[0],
    categoriaId: '',
    metodoPagoId: ''
  });

  // Cargar categorías y métodos de pago
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        const [categoriasResponse, metodosResponse] = await Promise.all([
          categoriasApi.getAll(100, 0),
          metodosPagoApi.getAll(100, 0)
        ]);
        
        const categoriasList = categoriasResponse.list || [];
        const metodosList = metodosResponse.list || [];
        
        setCategorias(categoriasList);
        setMetodosPago(metodosList);
        
        // Intentar preseleccionar valores inteligentes
        if (payment) {
          // Buscar categoría relacionada con el tipo
          let categoriaSeleccionada = '';
          if (payment.tipo) {
            const categoriaMatch = categoriasList.find(cat => {
              const nombre = cat.nombre?.toLowerCase() || '';
              const tipo = payment.tipo?.toLowerCase() || '';
              return nombre.includes(tipo) || tipo.includes(nombre);
            });
            categoriaSeleccionada = categoriaMatch?.id || '';
          }
          
          // Si no encontró, usar "Servicios" como default
          if (!categoriaSeleccionada) {
            const categoriaServicios = categoriasList.find(cat => 
              cat.nombre?.toLowerCase().includes('servicio')
            );
            categoriaSeleccionada = categoriaServicios?.id || categoriasList[0]?.id || '';
          }
          
          // Buscar método de pago "débito" como default
          const metodoDebito = metodosList.find(metodo => {
            const nombre = metodo.nombre?.toLowerCase() || '';
            return nombre.includes('debito') || nombre.includes('débito');
          });
          const metodoPagoSeleccionado = metodoDebito?.id || metodosList[0]?.id || '';
          
          setFormData(prev => ({
            ...prev,
            categoriaId: categoriaSeleccionada,
            metodoPagoId: metodoPagoSeleccionado
          }));
        }
      } catch (error) {
        console.error('Error cargando datos del modal:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, payment]);

  const handleConfirm = () => {
    if (!formData.categoriaId || !formData.metodoPagoId) {
      alert('Por favor selecciona una categoría y un método de pago');
      return;
    }
    
    onConfirm({
      ...formData,
      categoriaId: formData.categoriaId,
      metodoPagoId: formData.metodoPagoId,
      fechaPago: formData.fechaPago
    });
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md rounded-xl shadow-2xl"
        style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between border-b border-green-500/30 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-400/30">
              <DollarSign className="h-5 w-5 text-green-300" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Confirmar Pago
              </h2>
              <p className="text-sm text-green-200">
                Registrar como gasto del mes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors border border-red-400/30"
          >
            <X className="h-5 w-5 text-red-300" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Información del pago */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Descripción:</span>
              <span className="text-white font-semibold">{payment.descripcion || payment.nombre}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Proveedor:</span>
              <span className="text-white">{payment.proveedor || payment.beneficiario || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Monto:</span>
              <span className="text-green-400 font-bold text-lg">
                ${(payment.monto || 0).toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Fecha de Pago */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-white">
              <Calendar className="h-4 w-4 text-blue-400" />
              Fecha de Pago
            </label>
            <input
              type="date"
              value={formData.fechaPago}
              onChange={(e) => setFormData(prev => ({ ...prev, fechaPago: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-white">
              <Tag className="h-4 w-4 text-cyan-400" />
              Categoría
            </label>
            <select
              value={formData.categoriaId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoriaId: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              disabled={loading}
            >
              <option value="">Seleccionar categoría...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icono} {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Método de Pago */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-white">
              <CreditCard className="h-4 w-4 text-pink-400" />
              Método de Pago
            </label>
            <select
              value={formData.metodoPagoId}
              onChange={(e) => setFormData(prev => ({ ...prev, metodoPagoId: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
              disabled={loading}
            >
              <option value="">Seleccionar método...</option>
              {metodosPago.map((metodo) => (
                <option key={metodo.id} value={metodo.id}>
                  {metodo.icono} {metodo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800 rounded-b-xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-semibold hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !formData.categoriaId || !formData.metodoPagoId}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-bold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5" />
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmModal;
