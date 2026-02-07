import React from 'react';
import { DollarSign } from 'lucide-react';
import { useBaseModal } from '../ui/base-modal';
import { 
  TextFormField,
  NumberFormField,
  SelectFormField,
  DateFormField,
  TextareaFormField,
  CheckboxFormField
} from '../ui/form-components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import apiServices from '../../services/api';

const { categoriasApi, metodosPagoApi, transaccionesApi } = apiServices;

/**
 * Modal de Transacciones - Implementa herencia del BaseModal
 * Sigue principios SOLID: Single Responsibility, Open/Closed, Dependency Inversion
 */
export function TransactionModal({ 
  visible, 
  onHide, 
  onSuccess,
  defaultType = 'gasto',
  editData = null 
}) {
  // State management usando el hook del modal base
  const [categorias, setCategorias] = React.useState([]);
  const [metodosPago, setMetodosPago] = React.useState([]);
  const [dataLoaded, setDataLoaded] = React.useState(false);

  // Configuración del modal usando Strategy Pattern
  const modalConfig = {
    initialFormData: editData || {
      descripcion: '',
      monto: '',
      moneda: 'ARS',
      tipo: defaultType,
      categoriaId: '',
      metodoPagoId: '',
      fechaTransaccion: new Date().toISOString().split('T')[0],
      notas: '',
      incluirEnCuotaAlimentaria: false,
      gastoCompartido: false
    },

    validateForm: (formData) => {
      const errors = {};
      
      if (!formData.descripcion?.trim()) {
        errors.descripcion = 'La descripción es requerida';
      }
      
      if (!formData.monto || Number(formData.monto) <= 0) {
        errors.monto = 'El monto debe ser mayor a 0';
      }
      
      if (!formData.categoriaId) {
        errors.categoriaId = 'Debe seleccionar una categoría';
      }
      
      if (!formData.metodoPagoId) {
        errors.metodoPagoId = 'Debe seleccionar un método de pago';
      }
      
      return errors;
    },

    onSubmit: async (formData) => {
      // Mapear campos del frontend a los nombres de NocoDB
      const transactionData = {
        Monto: Number(formData.monto),
        Moneda: formData.moneda,
        MontoArs: formData.moneda === 'ARS' ? Number(formData.monto) : Number(formData.monto) * 1000, // Conversión temporal
        TasaCambio: formData.moneda === 'USD' ? 1000 : 1, // Tasa temporal
        Descripcion: formData.descripcion,
        FechaTransaccion: formData.fechaTransaccion,
        Tipo: formData.tipo,
        Notas: formData.notas || '',
        categorias_id: formData.categoriaId,
        MetodosPago: formData.metodoPagoId,
        EsRecurrente: false,
        Etiquetas: {}
      };

      console.log('🔍 DEBUG - Datos a enviar a NocoDB:', transactionData);

      if (editData) {
        return await transaccionesApi.update(editData.id, transactionData);
      } else {
        return await transaccionesApi.create(transactionData);
      }
    },

    onSuccess: (data) => {
      console.log('Transacción guardada:', data);
      if (onSuccess) onSuccess(data);
      onHide();
    },

    onError: (error) => {
      console.error('Error guardando transacción:', error);
      // Aquí podrías mostrar un toast de error
    }
  };

  const {
    formData,
    loading,
    errors,
    handleInputChange,
    handleSubmit,
    isFormValid
  } = useBaseModal(modalConfig);

  // Cargar datos iniciales - Dependency Injection Pattern
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [categoriasData, metodosData] = await Promise.all([
          categoriasApi.getAll(),
          metodosPagoApi.getAll()
        ]);

        setCategorias(categoriasData.list || []);
        setMetodosPago(metodosData.list || []);
        setDataLoaded(true);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      }
    };

    if (visible && !dataLoaded) {
      loadInitialData();
    }
  }, [visible, dataLoaded]);

  // Preparar opciones para los selects - Factory Pattern
  const createSelectOptions = (data, valueField = 'Id', labelField = 'Nombre') => {
    return data.map(item => ({
      value: String(item[valueField]),
      label: item[labelField],
      description: item.Tipo || item.Descripcion
    }));
  };

  const tipoOptions = [
    { value: 'ingreso', label: 'Ingreso' },
    { value: 'gasto', label: 'Gasto' }
  ];

  const monedaOptions = [
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'USD', label: 'USD - Dólar Americano' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'BRL', label: 'BRL - Real Brasileño' },
    { value: 'GBP', label: 'GBP - Libra Esterlina' }
  ];

  const categoriaOptions = createSelectOptions(categorias);
  const metodoPagoOptions = createSelectOptions(metodosPago);

  return (
    <Dialog open={visible} onOpenChange={onHide}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {editData ? 'Editar Transacción' : 'Nueva Transacción'}
          </DialogTitle>
          <DialogDescription>
            {editData 
              ? 'Modifica los datos de la transacción existente.'
              : 'Registra una nueva transacción en tu sistema. Los campos marcados con * son obligatorios.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Descripción */}
          <TextFormField
            label="Descripción"
            required
            value={formData.descripcion}
            onChange={(value) => handleInputChange('descripcion', value)}
            placeholder="Ej: Compra en supermercado"
            error={errors.descripcion}
          />

          {/* Primera fila: Tipo, Monto, Moneda */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectFormField
              label="Tipo"
              required
              options={tipoOptions}
              value={formData.tipo}
              onChange={(value) => handleInputChange('tipo', value)}
              error={errors.tipo}
            />

            <NumberFormField
              label="Monto"
              required
              value={formData.monto}
              onChange={(value) => handleInputChange('monto', value)}
              placeholder="0.00"
              currency={formData.moneda}
              error={errors.monto}
            />

            <SelectFormField
              label="Moneda"
              options={monedaOptions}
              value={formData.moneda}
              onChange={(value) => handleInputChange('moneda', value)}
              error={errors.moneda}
            />
          </div>

          {/* Segunda fila: Categoría, Método de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectFormField
              label="Categoría"
              required
              options={categoriaOptions}
              value={formData.categoriaId}
              onChange={(value) => handleInputChange('categoriaId', value)}
              placeholder="Seleccionar categoría"
              error={errors.categoriaId}
            />

            <SelectFormField
              label="Método de Pago"
              required
              options={metodoPagoOptions}
              value={formData.metodoPagoId}
              onChange={(value) => handleInputChange('metodoPagoId', value)}
              placeholder="Seleccionar método"
              error={errors.metodoPagoId}
            />
          </div>

          {/* Tercera fila: Fecha, Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateFormField
              label="Fecha de Transacción"
              value={formData.fechaTransaccion}
              onChange={(value) => handleInputChange('fechaTransaccion', value)}
              error={errors.fechaTransaccion}
            />

            <TextareaFormField
              label="Notas"
              value={formData.notas}
              onChange={(value) => handleInputChange('notas', value)}
              placeholder="Notas adicionales (opcional)"
              rows={3}
            />
          </div>

          {/* Opciones adicionales */}
          <div className="space-y-3">
            <CheckboxFormField
              label="Opciones Adicionales"
              checked={formData.incluirEnCuotaAlimentaria}
              onChange={(checked) => handleInputChange('incluirEnCuotaAlimentaria', checked)}
              checkboxLabel="Incluir en cuota alimentaria (30%)"
              description="Este ingreso será considerado para el cálculo de la cuota alimentaria mensual"
            />

            <CheckboxFormField
              checked={formData.gastoCompartido}
              onChange={(checked) => handleInputChange('gastoCompartido', checked)}
              checkboxLabel="Gasto compartido"
              description="Marcar si es un gasto que se comparte con otras personas"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onHide}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {editData ? 'Actualizando...' : 'Guardando...'}
              </>
            ) : (
              editData ? 'Actualizar' : 'Guardar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}