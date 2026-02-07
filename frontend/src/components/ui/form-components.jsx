import React from 'react';
import { Label } from './label';
import { Input } from './input';
import { ComboboxPopover } from './combobox'; // Corregido: Se usa el combobox principal
import { Textarea } from './textarea';
import { Checkbox } from './checkbox';
import { Badge } from './badge';
import { CalendarIcon } from 'lucide-react';

/**
 * Componentes de formulario reutilizables siguiendo el patrón Strategy
 */

// Factory Pattern para crear campos de formulario
export class FormFieldFactory {
  static createField(type, props) {
    switch (type) {
      case 'text':
        return <TextFormField {...props} />;
      case 'number':
        return <NumberFormField {...props} />;
      case 'textarea':
        return <TextareaFormField {...props} />;
      case 'select':
        return <SelectFormField {...props} />;
      case 'checkbox':
        return <CheckboxFormField {...props} />;
      case 'date':
        return <DateFormField {...props} />;
      default:
        throw new Error(`Tipo de campo no soportado: ${type}`);
    }
  }
}

// Componente base para todos los campos de formulario
export function BaseFormField({ 
  label, 
  required = false, 
  error, 
  children, 
  className = "",
  description 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-foreground font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && (
        <span className="text-red-500 text-sm">{error}</span>
      )}
      {description && (
        <span className="text-muted-foreground text-xs">{description}</span>
      )}
    </div>
  );
}

// Campos específicos implementando el patrón Strategy
export function TextFormField({ 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  ...baseProps 
}) {
  return (
    <BaseFormField {...baseProps}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={baseProps.error ? 'border-red-500' : ''}
      />
    </BaseFormField>
  );
}

export function NumberFormField({ 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  step = "0.01",
  min,
  max,
  currency,
  ...baseProps 
}) {
  return (
    <BaseFormField {...baseProps}>
      <div className="relative">
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseProps.error ? 'border-red-500' : ''} ${currency ? 'pr-16' : ''}`}
        />
        {currency && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Badge variant="outline" className="text-xs">
              {currency}
            </Badge>
          </div>
        )}
      </div>
    </BaseFormField>
  );
}

export function TextareaFormField({ 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  rows = 3,
  ...baseProps 
}) {
  return (
    <BaseFormField {...baseProps}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={baseProps.error ? 'border-red-500' : ''}
      />
    </BaseFormField>
  );
}

export function SelectFormField({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Seleccionar...",
  disabled = false,
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  ...baseProps 
}) {
  return (
    <BaseFormField {...baseProps}>
      <ComboboxPopover  // Corregido: Se usa el combobox principal
        options={options}
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={baseProps.error ? 'border-red-500' : ''}
      />
    </BaseFormField>
  );
}

export function CheckboxFormField({ 
  checked, 
  onChange, 
  disabled = false,
  checkboxLabel,
  ...baseProps 
}) {
  return (
    <BaseFormField {...baseProps}>
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
        />
        {checkboxLabel && (
          <Label className="text-foreground text-sm cursor-pointer">
            {checkboxLabel}
          </Label>
        )}
      </div>
    </BaseFormField>
  );
}

export function DateFormField({ 
  value, 
  onChange, 
  disabled = false,
  ...baseProps 
}) {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <BaseFormField {...baseProps}>
      <div className="relative">
        <Input
          type="date"
          value={formatDate(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={baseProps.error ? 'border-red-500' : ''}
        />
        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </BaseFormField>
  );
}

// Higher Order Component para validación
export function withValidation(WrappedComponent, validationRules = {}) {
  return function ValidatedComponent(props) {
    const [error, setError] = React.useState('');

    const handleChange = (value) => {
      // Limpiar error al cambiar
      if (error) setError('');
      
      // Validar si hay reglas
      if (validationRules[props.name]) {
        const validationError = validationRules[props.name](value);
        if (validationError) {
          setError(validationError);
        }
      }
      
      props.onChange(value);
    };

    return (
      <WrappedComponent
        {...props}
        onChange={handleChange}
        error={error || props.error}
      />
    );
  };
}

// Utilidades de validación
export const ValidationRules = {
  required: (message = 'Este campo es requerido') => (value) => {
    return !value || value.toString().trim() === '' ? message : null;
  },
  
  minLength: (min, message) => (value) => {
    return value && value.length < min ? message || `Mínimo ${min} caracteres` : null;
  },
  
  maxLength: (max, message) => (value) => {
    return value && value.length > max ? message || `Máximo ${max} caracteres` : null;
  },
  
  email: (message = 'Email inválido') => (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && !emailRegex.test(value) ? message : null;
  },
  
  number: (message = 'Debe ser un número') => (value) => {
    return value && isNaN(Number(value)) ? message : null;
  },
  
  positive: (message = 'Debe ser un número positivo') => (value) => {
    return value && Number(value) <= 0 ? message : null;
  }
};