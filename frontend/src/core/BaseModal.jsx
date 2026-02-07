import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';

/**
 * CLASE BASE PARA MODALES
 * Implementa ENCAPSULACIÓN de lógica común de modales
 * Proporciona HERENCIA para modales específicos
 * Aplica POLIMORFISMO en comportamientos específicos
 */
class BaseModal {
  constructor(title, icon, service) {
    // ENCAPSULACIÓN: Propiedades protegidas
    this._title = title;
    this._icon = icon;
    this._service = service;
    this._loading = false;
    this._formData = {};
    this._validationErrors = {};
  }

  // ENCAPSULACIÓN: Getters y setters
  get title() { return this._title; }
  get icon() { return this._icon; }
  get loading() { return this._loading; }
  get formData() { return this._formData; }
  get validationErrors() { return this._validationErrors; }

  setLoading(loading) { 
    this._loading = loading; 
  }

  setFormData(data) { 
    this._formData = { ...this._formData, ...data }; 
  }

  // MÉTODO TEMPLATE PATTERN: Flujo común de envío
  async submitForm(onSuccess, onError) {
    try {
      this.setLoading(true);
      this._clearValidationErrors();
      
      // POLIMORFISMO: Validación específica por subclase
      const validationResult = this._validateForm();
      if (!validationResult.isValid) {
        this._setValidationErrors(validationResult.errors);
        return;
      }

      // POLIMORFISMO: Preparación de datos específica
      const preparedData = this._prepareDataForSubmission();
      
      // POLIMORFISMO: Operación específica (create/update)
      const result = await this._performSubmission(preparedData);
      
      // POLIMORFISMO: Post-procesamiento específico
      const processedResult = this._processSubmissionResult(result);
      
      if (onSuccess) {
        onSuccess(processedResult);
      }
      
      this._onSubmissionSuccess(processedResult);
      
    } catch (error) {
      console.error(`Error en ${this.constructor.name}:`, error);
      
      if (onError) {
        onError(error);
      }
      
      this._onSubmissionError(error);
    } finally {
      this.setLoading(false);
    }
  }

  // ENCAPSULACIÓN: Manejo de errores de validación
  _clearValidationErrors() {
    this._validationErrors = {};
  }

  _setValidationErrors(errors) {
    this._validationErrors = errors;
  }

  hasValidationError(field) {
    return !!this._validationErrors[field];
  }

  getValidationError(field) {
    return this._validationErrors[field];
  }

  // MÉTODOS ABSTRACTOS PARA POLIMORFISMO
  // Cada subclase debe implementar estos métodos

  _validateForm() {
    throw new Error('_validateForm debe ser implementado por la subclase');
  }

  _prepareDataForSubmission() {
    throw new Error('_prepareDataForSubmission debe ser implementado por la subclase');
  }

  _performSubmission(data) {
    throw new Error('_performSubmission debe ser implementado por la subclase');
  }

  _processSubmissionResult(result) {
    return result; // Implementación por defecto
  }

  _onSubmissionSuccess(result) {
    // Implementación por defecto - las subclases pueden sobrescribir
    console.log('Operación exitosa:', result);
  }

  _onSubmissionError(error) {
    // Implementación por defecto - las subclases pueden sobrescribir
    console.error('Error en operación:', error);
  }

  // MÉTODO TEMPLATE PATTERN: Inicialización común
  initialize(isOpen, initialData = {}) {
    if (isOpen) {
      this._initializeFormData(initialData);
      this._onModalOpen();
    } else {
      this._onModalClose();
    }
  }

  _initializeFormData(initialData) {
    // Implementación por defecto - las subclases pueden sobrescribir
    this.setFormData(initialData);
  }

  _onModalOpen() {
    // Hook para subclases
  }

  _onModalClose() {
    // Hook para subclases
    this._clearValidationErrors();
  }

  // UTILIDADES COMUNES ENCAPSULADAS
  _createInputField(id, label, type = 'text', required = false, props = {}) {
    return {
      id,
      label,
      type,
      required,
      value: this._formData[id] || '',
      error: this.getValidationError(id),
      hasError: this.hasValidationError(id),
      ...props
    };
  }

  _createComboboxField(id, label, options, required = false, props = {}) {
    return {
      id,
      label,
      options,
      required,
      value: this._formData[id],
      error: this.getValidationError(id),
      hasError: this.hasValidationError(id),
      ...props
    };
  }

  _createCheckboxField(id, label, props = {}) {
    return {
      id,
      label,
      checked: !!this._formData[id],
      error: this.getValidationError(id),
      hasError: this.hasValidationError(id),
      ...props
    };
  }

  // VALIDACIONES COMUNES
  _validateRequiredField(value, fieldName) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} es obligatorio`;
    }
    return null;
  }

  _validateNumericField(value, fieldName, min = null, max = null) {
    if (value === '' || value === null || value === undefined) {
      return null; // Campo opcional
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return `${fieldName} debe ser un número válido`;
    }

    if (min !== null && numValue < min) {
      return `${fieldName} debe ser mayor o igual a ${min}`;
    }

    if (max !== null && numValue > max) {
      return `${fieldName} debe ser menor o igual a ${max}`;
    }

    return null;
  }

  _validateDateField(value, fieldName) {
    if (!value) {
      return null; // Campo opcional
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${fieldName} debe ser una fecha válida`;
    }

    return null;
  }
}

/**
 * COMPONENTE HOC PARA INTEGRAR CLASE CON REACT
 * Implementa el patrón Bridge entre POO y React Hooks
 */
export function withBaseModal(ModalClass) {
  return function BaseModalComponent(props) {
    const [modalInstance] = useState(() => new ModalClass(props));
    const [, forceUpdate] = useState({});
    
    // Force re-render cuando cambia el estado interno
    const triggerUpdate = () => forceUpdate({});

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      modalInstance.initialize(props.isOpen, props.initialData);
      triggerUpdate();
    }, [props.isOpen, props.initialData]);

    const handleInputChange = (field, value) => {
      modalInstance.setFormData({ [field]: value });
      triggerUpdate();
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      await modalInstance.submitForm(props.onSuccess, props.onError);
      triggerUpdate();
    };

    return (
      <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
        <DialogContent className="w-[95vw] max-w-[650px] max-h-[90vh] overflow-y-auto bg-gray-900 text-white">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-white">
              {modalInstance.icon}
              {modalInstance.title}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {props.description}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* El contenido específico será renderizado por las subclases */}
            {props.renderContent && props.renderContent({
              formData: modalInstance.formData,
              handleInputChange,
              validationErrors: modalInstance.validationErrors,
              createInputField: modalInstance._createInputField.bind(modalInstance),
              createComboboxField: modalInstance._createComboboxField.bind(modalInstance),
              createCheckboxField: modalInstance._createCheckboxField.bind(modalInstance)
            })}

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => props.onOpenChange(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={modalInstance.loading}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {modalInstance.loading ? 'Guardando...' : (props.submitText || 'Guardar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };
}

export default BaseModal;