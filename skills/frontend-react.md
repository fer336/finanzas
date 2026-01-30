# Skill: Frontend React Patterns

> **Para**: Frontend Agent  
> **Dominio**: React Components, State Management, API Integration

---

## 📋 Cuándo Usar Este Skill

- ✅ Crear cualquier componente React
- ✅ Manejar estado con Context API
- ✅ Integrar con APIs del backend
- ✅ Estructurar componentes del dashboard

---

## 🚨 REGLAS CRÍTICAS

### 1. React 19 - No Import React

```javascript
// ✅ CORRECTO
import { useState, useEffect } from 'react';

export const MyComponent = () => {
  const [state, setState] = useState(null);
  return <div>Component</div>;
};

// ❌ INCORRECTO
import React, { useState } from 'react';
import * as React from 'react';
```

**Razón**: React 19 no requiere `import React` para JSX. El compilador lo maneja automáticamente.

---

### 2. No Optimizaciones Prematuras

```javascript
// ❌ INCORRECTO - useMemo innecesario
const memoizedValue = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// ✅ CORRECTO - El compilador de React 19 optimiza automáticamente
const activeData = data.filter(item => item.active);
```

**Razón**: React 19 tiene un compilador que optimiza automáticamente. Solo usa `useMemo`/`useCallback` si hay un problema de performance **medido**.

---

### 3. API Calls - Solo HTTP

```javascript
// ✅ CORRECTO - Frontend solo llama API
import apiServices from '../services/api';

const fetchCategories = async () => {
  const data = await apiServices.categoriasApi.getAll();
  setCategories(data);
};

// ❌ INCORRECTO - Frontend NO implementa lógica backend
const fetchCategories = async () => {
  const categories = await db.query("SELECT * FROM categorias");
  // ESTO ES DEL BACKEND AGENT
};
```

---

## 📐 PATRONES OBLIGATORIOS

### Widget del Dashboard

```jsx
import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

export const MyWidget = ({ data, onViewAll }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [widgetData, setWidgetData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiServices.myApi.getData();
        setWidgetData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel h-full flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="glass-panel h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Título</h3>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Ver todo →
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {widgetData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/50 text-sm">No hay datos</p>
          </div>
        ) : (
          widgetData.map(item => (
            <div key={item.id}>{/* Item content */}</div>
          ))
        )}
      </div>
    </div>
  );
};
```

---

### Context Provider Pattern

```jsx
import { createContext, useContext, useState, useEffect } from 'react';

// 1. Create Context
const MyContext = createContext(undefined);

// 2. Create Provider Component
export const MyProvider = ({ children }) => {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize
    const init = async () => {
      try {
        const data = await apiServices.myApi.getData();
        setValue(data);
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const updateValue = async (newValue) => {
    try {
      await apiServices.myApi.update(newValue);
      setValue(newValue);
    } catch (error) {
      console.error('Error updating:', error);
      throw error;
    }
  };

  const contextValue = {
    value,
    loading,
    updateValue,
  };

  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
};

// 3. Custom Hook
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};

// 4. Usage
// En App.jsx:
// <MyProvider>
//   <App />
// </MyProvider>

// En cualquier componente:
// const { value, updateValue } = useMyContext();
```

---

### API Service Pattern

```javascript
// services/api.js
const apiServices = {
  categoriasApi: {
    getAll: async () => {
      const response = await fetch(`${baseUrl}/api/categorias`);
      if (!response.ok) throw new Error('Error fetching');
      return response.json();
    },
    
    create: async (data) => {
      const response = await fetch(`${baseUrl}/api/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error creating');
      return response.json();
    },
    
    update: async (id, data) => {
      const response = await fetch(`${baseUrl}/api/categorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error updating');
      return response.json();
    },
    
    delete: async (id) => {
      const response = await fetch(`${baseUrl}/api/categorias/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting');
      return response.json();
    },
  },
};

export default apiServices;
```

---

### Form Handling Pattern

```jsx
import { useState } from 'react';

export const MyForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    amount: initialData.amount || '',
    category: initialData.category || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nombre requerido';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Monto debe ser mayor a 0';
    }
    
    if (!formData.category) {
      newErrors.category = 'Categoría requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {errors.general}
        </div>
      )}

      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Nombre
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 text-white rounded-lg transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};
```

---

## 🎨 Estructura de Componentes

### Orden de Código en Componentes

```jsx
import { useState, useEffect } from 'react';
import { Icon } from 'lucide-react';
import apiServices from '../services/api';

export const MyComponent = ({ prop1, prop2, onAction }) => {
  // 1. State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Effects
  useEffect(() => {
    fetchData();
  }, []);

  // 3. Handlers
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiServices.myApi.getData();
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    onAction(data);
  };

  // 4. Early returns
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (data.length === 0) return <EmptyState />;

  // 5. Main render
  return (
    <div className="...">
      {/* Component content */}
    </div>
  );
};
```

---

## ✅ Checklist

- [ ] No hay `import React`
- [ ] No hay `useMemo`/`useCallback` innecesarios
- [ ] API calls usan `apiServices`
- [ ] Estados de loading/error/empty manejados
- [ ] Validaciones en formularios
- [ ] Errores con mensajes claros
- [ ] Componente responsive (mobile/tablet/desktop)
- [ ] Código ordenado (state → effects → handlers → render)

---

## ❌ Anti-Patrones

### 1. Import React innecesario

```jsx
// ❌ MAL
import React from 'react';

// ✅ BIEN
// No importar React para JSX
```

### 2. Lógica backend en frontend

```jsx
// ❌ MAL
const calculateBalance = (transactions) => {
  return transactions.reduce((sum, t) => {
    // Lógica de negocio compleja aquí
    // ESTO DEBE ESTAR EN EL BACKEND
  }, 0);
};

// ✅ BIEN
const balance = await apiServices.transaccionesApi.getBalance();
```

### 3. Estado no inicializado

```jsx
// ❌ MAL
const [data, setData] = useState();

// ✅ BIEN
const [data, setData] = useState([]);
const [user, setUser] = useState(null);
```

---

**Skill Owner**: Frontend Agent  
**Related Skills**: `react-modern-ui`, `modal-system`, `recharts-data-viz`  
**Version**: 1.0  
**Last Updated**: 2026-01-24

