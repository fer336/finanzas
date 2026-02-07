import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';

/**
 * Modal Base - Clase base para todos los modales del sistema
 * Implementa el patrón Template Method y Strategy
 */
export class BaseModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      errors: {},
      formData: this.getInitialFormData()
    };
  }

  // Template Method Pattern - Define la estructura del modal
  render() {
    const { visible, onHide, className = "" } = this.props;

    return (
      <Dialog open={visible} onOpenChange={onHide}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${className}`}>
          {this.renderHeader()}
          {this.renderContent()}
          {this.renderFooter()}
        </DialogContent>
      </Dialog>
    );
  }

  // Métodos abstractos que deben ser implementados por las clases hijas
  getInitialFormData() {
    throw new Error("getInitialFormData() debe ser implementado por la clase hija");
  }

  renderHeader() {
    const { title, description, icon } = this.getModalConfig();
    return (
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-white">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription className="text-gray-300">
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
    );
  }

  renderContent() {
    return (
      <div className="space-y-4">
        {this.renderForm()}
      </div>
    );
  }

  renderFooter() {
    const { loading } = this.state;
    const { onHide } = this.props;
    
    return (
      <DialogFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onHide}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={this.handleSubmit.bind(this)}
          disabled={loading || !this.isFormValid()}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {this.getLoadingText()}
            </>
          ) : (
            this.getSubmitText()
          )}
        </Button>
      </DialogFooter>
    );
  }

  // Métodos abstractos
  getModalConfig() {
    throw new Error("getModalConfig() debe ser implementado por la clase hija");
  }

  renderForm() {
    throw new Error("renderForm() debe ser implementado por la clase hija");
  }

  // Métodos con implementación por defecto que pueden ser sobrescritos
  getLoadingText() {
    return "Guardando...";
  }

  getSubmitText() {
    return "Guardar";
  }

  isFormValid() {
    const errors = this.validateForm();
    return Object.keys(errors).length === 0;
  }

  validateForm() {
    return {}; // Implementación por defecto
  }

  // Métodos de utilidad
  handleInputChange = (field, value) => {
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [field]: value
      },
      errors: {
        ...prevState.errors,
        [field]: null // Limpiar error al cambiar el campo
      }
    }));
  }

  setLoading = (loading) => {
    this.setState({ loading });
  }

  setErrors = (errors) => {
    this.setState({ errors });
  }

  setError = (field, error) => {
    this.setState(prevState => ({
      errors: {
        ...prevState.errors,
        [field]: error
      }
    }));
  }

  // Método abstracto para manejar el submit
  async handleSubmit() {
    const errors = this.validateForm();
    if (Object.keys(errors).length > 0) {
      this.setErrors(errors);
      return;
    }

    this.setLoading(true);
    try {
      await this.onSubmit();
      this.onSuccess();
    } catch (error) {
      this.onError(error);
    } finally {
      this.setLoading(false);
    }
  }

  // Métodos del ciclo de vida del submit
  async onSubmit() {
    throw new Error("onSubmit() debe ser implementado por la clase hija");
  }

  onSuccess() {
    const { onHide, onSuccess } = this.props;
    if (onSuccess) onSuccess(this.state.formData);
    onHide();
  }

  onError(error) {
    console.error('Error en modal:', error);
    // Aquí podrías mostrar un toast o manejar el error según tu estrategia
  }
}

/**
 * Hook version del BaseModal para componentes funcionales
 */
export function useBaseModal(config) {
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [formData, setFormData] = React.useState(config.initialFormData || {});

  const handleInputChange = React.useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  const handleSubmit = React.useCallback(async () => {
    const validationErrors = config.validateForm ? config.validateForm(formData) : {};
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await config.onSubmit(formData);
      config.onSuccess?.(formData);
    } catch (error) {
      config.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [formData, config]);

  const isFormValid = React.useCallback(() => {
    const validationErrors = config.validateForm ? config.validateForm(formData) : {};
    return Object.keys(validationErrors).length === 0;
  }, [formData, config]);

  return {
    formData,
    loading,
    errors,
    handleInputChange,
    handleSubmit,
    isFormValid,
    setLoading,
    setErrors
  };
}