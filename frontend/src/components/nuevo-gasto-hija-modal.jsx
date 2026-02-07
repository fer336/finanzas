import React, { useState, useEffect } from 'react';
import { Plus, Heart, Check, AlertTriangle, X as IconX } from 'lucide-react';
import { ComprobanteUploader } from './comprobante-uploader';
import apiServices from '../services/api';

// Re-estructurando para un diseño más limpio
const FormRow = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
const Field = ({ label, htmlFor, children }) => (
  <div className="space-y-2 flex flex-col">
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
);
const Label = ({ htmlFor, children }) => <label htmlFor={htmlFor} className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{children}</label>;
const Input = (props) => <input {...props} className={`w-full px-4 py-2.5 bg-zinc-800 border-2 border-zinc-700 rounded-lg font-medium text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none ${props.className}`} />;
const Select = ({ children, ...props }) => <select {...props} className={`w-full px-4 py-2.5 bg-zinc-800 border-2 border-zinc-700 rounded-lg font-medium text-sm text-white focus:border-blue-500 focus:outline-none ${props.className}`}>{children}</select>;
const Textarea = (props) => <textarea {...props} rows={3} className={`w-full px-4 py-2.5 bg-zinc-800 border-2 border-zinc-700 rounded-lg font-medium text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none ${props.className}`} />;
const Dialog = ({ open, onOpenChange, children }) => open ? <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={() => onOpenChange(false)}><div onClick={e => e.stopPropagation()}>{children}</div></div> : null;
const DialogTrigger = ({ children }) => children;
const DialogContent = ({ children, className }) => <div className={`bg-zinc-900 border-2 border-zinc-800 rounded-2xl shadow-2xl ${className}`}>{children}</div>;
const DialogHeader = ({ children, className }) => <div className={`p-6 pb-4 ${className}`}>{children}</div>;
const DialogTitle = ({ children, className }) => <h2 className={`flex items-center gap-3 text-white text-xl font-bold ${className}`}>{children}</h2>;
const DialogDescription = ({ children, className }) => <p className={`text-zinc-400 text-sm ${className}`}>{children}</p>;
const DialogFooter = ({ children, className }) => <div className={`p-6 bg-zinc-800/50 border-t-2 border-zinc-800 flex justify-end gap-3 ${className}`}>{children}</div>;
const Button = ({ children, variant, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold text-sm transition-all";
  const variants = {
    primary: "bg-green-500 text-black hover:bg-green-600",
    secondary: "bg-zinc-700 text-zinc-200 hover:bg-zinc-600",
    ghost: "bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
  };
  return <button {...props} className={`${baseStyle} ${variants[variant] || variants.secondary}`}>{children}</button>;
};


export function NuevoGastoHijaModal({ onGastoCreado, trigger }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [comprobante, setComprobante] = useState(null);

  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    moneda: 'ARS',
    categoria: '',
    metodoPago: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    tipo: 'gasto',
    estadoPago: 'total', // total, parcial, impago
    montoPagado: '' // solo si es pago parcial
  });

  const categoriasHija = [
    { id: 'alimentacion-hija', nombre: 'Alimentación Hija', color: '#FF6B6B' },
    { id: 'ropa-hija', nombre: 'Ropa Hija', color: '#4ECDC4' },
    { id: 'salud-hija', nombre: 'Salud Hija', color: '#45B7D1' },
    { id: 'educacion-hija', nombre: 'Educación Hija', color: '#96CEB4' },
    { id: 'colegio-matricula', nombre: 'Colegio - Matrícula', color: '#74B9FF' },
    { id: 'colegio-mensualidad', nombre: 'Colegio - Mensualidad', color: '#0984E3' },
    { id: 'colegio-actividades', nombre: 'Colegio - Actividades Extraescolares', color: '#6C5CE7' },
    { id: 'colegio-materiales', nombre: 'Colegio - Materiales Escolares', color: '#A29BFE' },
    { id: 'colegio-uniformes', nombre: 'Colegio - Uniformes', color: '#FD79A8' },
    { id: 'colegio-transporte', nombre: 'Colegio - Transporte Escolar', color: '#FDCB6E' },
    { id: 'colegio-otros', nombre: 'Colegio - Otros Gastos', color: '#E17055' },
    { id: 'recreacion-hija', nombre: 'Recreación Hija', color: '#FFEAA7' },
    { id: 'transporte-hija', nombre: 'Transporte Hija', color: '#DDA0DD' },
    { id: 'otros-hija', nombre: 'Otros Gastos Hija', color: '#98D8C8' }
  ];

  useEffect(() => {
    if (open) {
      cargarDatos();
    }
  }, [open]);

  const cargarDatos = async () => {
    try {
      const { categoriasApi, metodosPagoApi } = apiServices;
      
      const [categoriasRes, metodosRes] = await Promise.all([
        categoriasApi.getAll(),
        metodosPagoApi.getAll()
      ]);

      setCategorias(categoriasRes.list || []);
      setMetodosPago(metodosRes.list || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-completar descripción cuando se selecciona una categoría de colegio
      if (field === 'categoria') {
        const categoriaSeleccionada = categoriasHija.find(cat => cat.id === value);
        if (categoriaSeleccionada && categoriaSeleccionada.id.startsWith('colegio-')) {
          const mesActual = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
          let descripcionSugerida = '';
          
          switch (categoriaSeleccionada.id) {
            case 'colegio-matricula':
              descripcionSugerida = `Pago de matrícula escolar - ${mesActual}`;
              break;
            case 'colegio-mensualidad':
              descripcionSugerida = `Pago de mensualidad escolar - ${mesActual}`;
              break;
            case 'colegio-actividades':
              descripcionSugerida = `Pago de actividades extraescolares - ${mesActual}`;
              break;
            case 'colegio-materiales':
              descripcionSugerida = `Pago de materiales escolares - ${mesActual}`;
              break;
            case 'colegio-uniformes':
              descripcionSugerida = `Pago de uniformes escolares - ${mesActual}`;
              break;
            case 'colegio-transporte':
              descripcionSugerida = `Pago de transporte escolar - ${mesActual}`;
              break;
            case 'colegio-otros':
              descripcionSugerida = `Pago de gastos escolares - ${mesActual}`;
              break;
            default:
              break;
          }
          
          if (descripcionSugerida && !newData.descripcion) {
            newData.descripcion = descripcionSugerida;
          }
        }
      }

      return newData;
    });
  };

  const handleComprobanteUpload = (fileData) => {
    setComprobante(fileData);
  };

  // Funciones auxiliares para obtener IDs de relaciones
  const obtenerCategoriaGastosHija = async () => {
    try {
      const { categoriasApi } = apiServices;
      const categoriasData = await categoriasApi.getAll();
      const categoriaGastosHija = categoriasData.list?.find(cat => 
        cat.Nombre?.toLowerCase().includes('gastos con hija') || 
        cat.Nombre?.toLowerCase().includes('hija')
      );
      return categoriaGastosHija?.Id || null;
    } catch (error) {
      console.error('Error obteniendo categoría Gastos con Hija:', error);
      return null;
    }
  };

  const obtenerMetodoPagoPorDefecto = async () => {
    try {
      const { metodosPagoApi } = apiServices;
      const metodosData = await metodosPagoApi.getAll();
      const metodoPorDefecto = metodosData.list?.[0]; // Primer método disponible
      return metodoPorDefecto?.Id || null;
    } catch (error) {
      console.error('Error obteniendo método de pago por defecto:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { transaccionesApi } = apiServices;

      // Preparar información del estado de pago
      let estadoPagoInfo = '';
      switch (formData.estadoPago) {
        case 'total':
          estadoPagoInfo = '[PAGO_TOTAL]';
          break;
        case 'parcial':
          estadoPagoInfo = `[PAGO_PARCIAL:${formData.montoPagado}]`;
          break;
        case 'impago':
          estadoPagoInfo = '[IMPAGO]';
          break;
        default:
          estadoPagoInfo = '[PAGO_TOTAL]';
          break;
      }

      // Usar solo las notas del usuario y estado de pago, sin tags de cuota alimentaria
      let notas = '';
      if (estadoPagoInfo !== '[PAGO_TOTAL]') {
        notas += estadoPagoInfo;
      }
      if (formData.notas.trim()) {
        notas += (notas ? ' ' : '') + formData.notas.trim();
      }
      notas = notas.trim();

      // Preparar datos de la transacción - estructura consistente con create-transaction-modal
      const transaccionData = {
        Descripcion: formData.descripcion,
        Monto: parseFloat(formData.monto),
        Moneda: formData.moneda,
        MontoArs: formData.moneda === 'ARS' ? parseFloat(formData.monto) : parseFloat(formData.monto) * 1000,
        TasaCambio: formData.moneda === 'ARS' ? 1 : 1000,
        FechaTransaccion: new Date(formData.fecha),
        Tipo: 'gasto',
        EsRecurrente: false,
        FechaCreacion: new Date(),
        FechaActualizacion: new Date(),
        // Campos específicos para cuota alimentaria - gastos de hija siempre son compartidos al 50%
        IncluirEnCuotaAlimentaria: false, // Los gastos no usan este campo
        GastoCompartido: true, // Los gastos con hija siempre son compartidos
        // Solo incluir notas si hay algo que poner
        ...(notas && { Notas: notas }),
        // Relaciones requeridas - buscar categoría "Gastos con Hija"
        categorias_id: await obtenerCategoriaGastosHija(),
        metodos_pago_id: await obtenerMetodoPagoPorDefecto()
      };

      // Crear la transacción
      const response = await transaccionesApi.create(transaccionData);

      if (response) {
        // Resetear formulario
        setFormData({
          descripcion: '',
          monto: '',
          moneda: 'ARS',
          categoria: '',
          metodoPago: '',
          fecha: new Date().toISOString().split('T')[0],
          notas: '',
          tipo: 'gasto',
          estadoPago: 'total',
          montoPagado: ''
        });
        setComprobante(null);
        setOpen(false);

        // Notificar al componente padre
        if (onGastoCreado) {
          onGastoCreado(response);
        }
      }
    } catch (error) {
      console.error('Error creando gasto:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTrigger asChild>
        {trigger || (
          <button className="px-4 py-3 bg-pink-500 border-2 border-pink-600 rounded-lg text-white font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(219,39,119,0.3)] hover:bg-pink-600 transition-all flex items-center justify-center gap-2">
            <Plus size={16} strokeWidth={3} />
            Nuevo Gasto
          </button>
        )}
      </DialogTrigger>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>
              <Heart className="h-6 w-6 text-pink-400" />
            Nuevo Gasto con tu Hija
          </DialogTitle>
          <DialogDescription>
            Registra un gasto relacionado con tu hija. Se calculará automáticamente el 50% para anotar.
          </DialogDescription>
        </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 space-y-4 overflow-y-auto flex-1">
            <FormRow>
              <Field label="Descripción *">
              <Input
                id="descripcion"
                placeholder="Ej: Almuerzo en restaurante"
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                required
              />
              </Field>

              <Field label="Monto *">
              <div className="flex gap-2">
                <Select
                  value={formData.moneda}
                    onChange={(e) => handleInputChange('moneda', e.target.value)}
                    className="w-24"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                </Select>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={(e) => handleInputChange('monto', e.target.value)}
                  required
                  className="flex-1"
                />
              </div>
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Categoría">
              <Select
                value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasHija.filter(cat => !cat.id.startsWith('colegio-')).map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                  <optgroup label="GASTOS DE COLEGIO">
                    {categoriasHija.filter(cat => cat.id.startsWith('colegio-')).map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                  </optgroup>
                  {categorias.length > 0 && <optgroup label="OTRAS CATEGORÍAS">
                    {categorias.filter(c => c.Tipo?.toLowerCase() === 'gasto').map(cat => <option key={cat.Id} value={cat.Id}>{cat.Nombre}</option>)}
                  </optgroup>}
              </Select>
              </Field>

              <Field label="Método de Pago">
              <Select
                value={formData.metodoPago}
                  onChange={(e) => handleInputChange('metodoPago', e.target.value)}
                >
                  <option value="">Selecciona método</option>
                  {metodosPago.map(metodo => <option key={metodo.Id} value={metodo.Id}>{metodo.Nombre}</option>)}
              </Select>
              </Field>
            </FormRow>

            <Field label="Fecha">
            <Input
              id="fecha"
              type="date"
              value={formData.fecha}
              onChange={(e) => handleInputChange('fecha', e.target.value)}
              required
            />
            </Field>

            <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg border-2 border-zinc-700">
              <Label>Estado del Pago (Cuota Alimentaria)</Label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => handleInputChange('estadoPago', 'total')} className={`p-3 rounded-lg border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.estadoPago === 'total' ? 'bg-green-500/20 border-green-500 text-green-300' : 'border-zinc-600 text-zinc-400 hover:bg-zinc-700'}`}>
                  <Check size={14} /> Pago Total
                </button>
                <button type="button" onClick={() => handleInputChange('estadoPago', 'parcial')} className={`p-3 rounded-lg border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.estadoPago === 'parcial' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 'border-zinc-600 text-zinc-400 hover:bg-zinc-700'}`}>
                  <AlertTriangle size={14} /> Pago Parcial
                </button>
                <button type="button" onClick={() => handleInputChange('estadoPago', 'impago')} className={`p-3 rounded-lg border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.estadoPago === 'impago' ? 'bg-red-500/20 border-red-500 text-red-300' : 'border-zinc-600 text-zinc-400 hover:bg-zinc-700'}`}>
                  <IconX size={14} /> Impago
                </button>
              </div>

              {formData.estadoPago === 'parcial' && (
                <Field label="Monto Pagado">
                    <Input
                      id="montoPagado"
                      type="number"
                      placeholder="0.00"
                      value={formData.montoPagado}
                      onChange={(e) => handleInputChange('montoPagado', e.target.value)}
                  />
                </Field>
              )}
          </div>

            <Field label="Notas adicionales">
            <Textarea
              id="notas"
              placeholder="Información adicional sobre el gasto..."
              value={formData.notas}
              onChange={(e) => handleInputChange('notas', e.target.value)}
              />
            </Field>

            <Field label="Comprobante">
              <ComprobanteUploader onFileUpload={handleComprobanteUpload} existingFile={comprobante} />
            </Field>
        </form>

        <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading || !formData.descripcion || !formData.monto}>
            {loading ? 'Guardando...' : 'Guardar Gasto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}