import React, { useState, useEffect, useCallback } from 'react';

/**
 * CLASE BASE PARA VISTAS
 * Implementa ENCAPSULACIÓN de lógica común de vistas
 * Proporciona HERENCIA para vistas específicas
 * Aplica TEMPLATE METHOD PATTERN
 */
class BaseView {
  constructor(title, service) {
    // ENCAPSULACIÓN: Propiedades protegidas
    this._title = title;
    this._service = service;
    this._data = [];
    this._loading = false;
    this._error = null;
    this._searchTerm = '';
    this._filters = {};
    this._pagination = {
      page: 1,
      limit: 50,
      total: 0
    };
  }

  // ENCAPSULACIÓN: Getters
  get title() { return this._title; }
  get data() { return this._data; }
  get loading() { return this._loading; }
  get error() { return this._error; }
  get searchTerm() { return this._searchTerm; }
  get filters() { return this._filters; }
  get pagination() { return this._pagination; }

  // ENCAPSULACIÓN: Setters con validación
  setLoading(loading) {
    this._loading = !!loading;
  }

  setError(error) {
    this._error = error;
    if (error) {
      console.error(`Error en ${this.constructor.name}:`, error);
    }
  }

  setSearchTerm(term) {
    this._searchTerm = term || '';
    this._onSearchChange();
  }

  setFilters(filters) {
    this._filters = { ...this._filters, ...filters };
    this._onFiltersChange();
  }

  setData(data) {
    this._data = Array.isArray(data) ? data : [];
  }

  // TEMPLATE METHOD PATTERN: Flujo común de carga de datos
  async loadData(refresh = false) {
    try {
      this.setLoading(true);
      this.setError(null);
      
      // POLIMORFISMO: Preparación específica por subclase
      const loadParams = this._prepareLoadParams();
      
      // POLIMORFISMO: Carga específica por subclase
      const rawData = await this._performDataLoad(loadParams);
      
      // POLIMORFISMO: Procesamiento específico por subclase
      const processedData = this._processLoadedData(rawData);
      
      // POLIMORFISMO: Filtrado específico por subclase
      const filteredData = this._applyFilters(processedData);
      
      this.setData(filteredData);
      this._onDataLoaded(filteredData);
      
    } catch (error) {
      this.setError(error);
      this._onDataLoadError(error);
    } finally {
      this.setLoading(false);
    }
  }

  // TEMPLATE METHOD PATTERN: Búsqueda común
  async search(term) {
    this.setSearchTerm(term);
    await this.loadData();
  }

  // TEMPLATE METHOD PATTERN: Aplicación de filtros común
  async applyFilters(filters) {
    this.setFilters(filters);
    await this.loadData();
  }

  // TEMPLATE METHOD PATTERN: Paginación común
  async goToPage(page) {
    if (page > 0 && page !== this._pagination.page) {
      this._pagination.page = page;
      await this.loadData();
    }
  }

  // MÉTODOS ABSTRACTOS PARA POLIMORFISMO
  // Cada subclase debe implementar estos métodos
  
  _prepareLoadParams() {
    return {
      limit: this._pagination.limit,
      offset: (this._pagination.page - 1) * this._pagination.limit,
      search: this._searchTerm,
      filters: this._filters
    };
  }

  async _performDataLoad(params) {
    // Implementación por defecto - las subclases deben sobrescribir
    if (!this._service) {
      throw new Error('Servicio no configurado para esta vista');
    }
    return await this._service.getAll(params.limit, params.offset);
  }

  _processLoadedData(rawData) {
    // Implementación por defecto - las subclases pueden sobrescribir
    return rawData.list || rawData;
  }

  _applyFilters(data) {
    let filtered = [...data];
    
    // Aplicar búsqueda de texto
    if (this._searchTerm) {
      filtered = this._applyTextSearch(filtered, this._searchTerm);
    }
    
    // Aplicar filtros específicos
    filtered = this._applySpecificFilters(filtered, this._filters);
    
    return filtered;
  }

  _applyTextSearch(data, searchTerm) {
    // Implementación por defecto - las subclases pueden sobrescribir
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      this._getSearchableFields(item).some(field => 
        field && field.toString().toLowerCase().includes(term)
      )
    );
  }

  _applySpecificFilters(data, filters) {
    // Implementación por defecto - las subclases deben sobrescribir
    return data;
  }

  _getSearchableFields(item) {
    // Implementación por defecto - las subclases deben sobrescribir
    return Object.values(item);
  }

  // HOOKS PARA SUBCLASES
  _onDataLoaded(data) {
    // Hook para subclases
    console.log(`${this.constructor.name}: Datos cargados (${data.length} elementos)`);
  }

  _onDataLoadError(error) {
    // Hook para subclases
    console.error(`${this.constructor.name}: Error cargando datos`, error);
  }

  _onSearchChange() {
    // Hook para subclases
  }

  _onFiltersChange() {
    // Hook para subclases
  }

  // UTILIDADES COMUNES ENCAPSULADAS
  _formatDate(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('es-AR');
    } catch {
      return dateString;
    }
  }

  _formatCurrency(amount, currency = 'ARS') {
    if (!amount && amount !== 0) return '';
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  }

  _calculateStats(data, field) {
    if (!Array.isArray(data) || data.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const values = data
      .map(item => parseFloat(item[field]) || 0)
      .filter(val => !isNaN(val));

    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}

/**
 * HOC PARA INTEGRAR CLASE BASE CON REACT
 * Implementa el patrón Bridge entre POO y React Hooks
 */
export function withBaseView(ViewClass) {
  return function BaseViewComponent(props) {
    const [viewInstance] = useState(() => new ViewClass(props));
    const [, forceUpdate] = useState({});
    
    // Force re-render cuando cambia el estado interno
    const triggerUpdate = useCallback(() => forceUpdate({}), []);

    // Inicialización
    useEffect(() => {
      viewInstance.loadData();
      // Configurar listener para updates
      const originalSetData = viewInstance.setData.bind(viewInstance);
      viewInstance.setData = (data) => {
        originalSetData(data);
        triggerUpdate();
      };
      
      const originalSetLoading = viewInstance.setLoading.bind(viewInstance);
      viewInstance.setLoading = (loading) => {
        originalSetLoading(loading);
        triggerUpdate();
      };
      
      const originalSetError = viewInstance.setError.bind(viewInstance);
      viewInstance.setError = (error) => {
        originalSetError(error);
        triggerUpdate();
      };
    }, [viewInstance, triggerUpdate]);

    // Handlers para eventos
    const handleSearch = useCallback(async (term) => {
      await viewInstance.search(term);
    }, [viewInstance]);

    const handleFilterChange = useCallback(async (filters) => {
      await viewInstance.applyFilters(filters);
    }, [viewInstance]);

    const handlePageChange = useCallback(async (page) => {
      await viewInstance.goToPage(page);
    }, [viewInstance]);

    const handleRefresh = useCallback(async () => {
      await viewInstance.loadData(true);
    }, [viewInstance]);

    return props.render({
      // Estado de la vista
      title: viewInstance.title,
      data: viewInstance.data,
      loading: viewInstance.loading,
      error: viewInstance.error,
      searchTerm: viewInstance.searchTerm,
      filters: viewInstance.filters,
      pagination: viewInstance.pagination,
      
      // Handlers
      onSearch: handleSearch,
      onFilterChange: handleFilterChange,
      onPageChange: handlePageChange,
      onRefresh: handleRefresh,
      
      // Utilidades
      formatDate: viewInstance._formatDate.bind(viewInstance),
      formatCurrency: viewInstance._formatCurrency.bind(viewInstance),
      calculateStats: viewInstance._calculateStats.bind(viewInstance),
      
      // Instancia para métodos específicos
      viewInstance
    });
  };
}

export default BaseView;