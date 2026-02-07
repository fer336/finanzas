/**
 * CLASE BASE PARA SERVICIOS API
 * Implementa ENCAPSULACIÓN de lógica común de API
 * Proporciona base para HERENCIA de servicios específicos
 */
class BaseApiService {
  constructor(baseUrl, tableName, token) {
    // ENCAPSULACIÓN: Propiedades privadas
    this._baseUrl = baseUrl;
    this._tableName = tableName;
    this._token = token;
    this._headers = {
      'accept': 'application/json',
      'xc-token': token,
      'Content-Type': 'application/json'
    };
  }

  // ENCAPSULACIÓN: Getter para URL protegida
  get apiUrl() {
    return `${this._baseUrl}/${this._tableName}/records`;
  }

  // ENCAPSULACIÓN: Método privado para manejo de errores
  _handleApiError(error, operation) {
    console.error(`❌ Error en ${operation}:`, error);
    throw new Error(`${operation} falló: ${error.message}`);
  }

  // ENCAPSULACIÓN: Método privado para logging
  _logOperation(operation, data = null) {
    console.log(`🔍 ${this.constructor.name} - ${operation}`, data ? data : '');
  }

  // MÉTODO TEMPLATE PATTERN: Operación base GET
  async getAll(limit = 100, offset = 0, filters = {}) {
    try {
      this._logOperation('GET ALL', { limit, offset, filters });
      
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...filters
      });

      const response = await fetch(`${this.apiUrl}?${queryParams}`, {
        method: 'GET',
        headers: this._headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this._logOperation('GET ALL SUCCESS', `${data?.list?.length || 0} registros`);
      
      return this._processGetAllResponse(data);
    } catch (error) {
      this._handleApiError(error, 'GET ALL');
    }
  }

  // MÉTODO TEMPLATE PATTERN: Operación base POST
  async create(data) {
    try {
      this._logOperation('CREATE', data);
      
      // POLIMORFISMO: Validación específica por subclase
      const validatedData = this._validateCreateData(data);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this._headers,
        body: JSON.stringify(validatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      this._logOperation('CREATE SUCCESS', result);
      
      return this._processCreateResponse(result);
    } catch (error) {
      this._handleApiError(error, 'CREATE');
    }
  }

  // MÉTODO TEMPLATE PATTERN: Operación base PUT
  async update(id, data) {
    try {
      this._logOperation('UPDATE', { id, data });
      
      // POLIMORFISMO: Validación específica por subclase
      const validatedData = this._validateUpdateData(data);
      
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'PATCH',
        headers: this._headers,
        body: JSON.stringify(validatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      this._logOperation('UPDATE SUCCESS', result);
      
      return this._processUpdateResponse(result);
    } catch (error) {
      this._handleApiError(error, 'UPDATE');
    }
  }

  // MÉTODO TEMPLATE PATTERN: Operación base DELETE
  async delete(id) {
    try {
      this._logOperation('DELETE', { id });
      
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: 'DELETE',
        headers: this._headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this._logOperation('DELETE SUCCESS', { id });
      return { success: true, id };
    } catch (error) {
      this._handleApiError(error, 'DELETE');
    }
  }

  // MÉTODOS ABSTRACTOS PARA HERENCIA (POLIMORFISMO)
  // Cada subclase debe implementar estos métodos según sus necesidades específicas
  
  _processGetAllResponse(data) {
    // Implementación por defecto - las subclases pueden sobrescribir
    return data;
  }

  _processCreateResponse(data) {
    // Implementación por defecto - las subclases pueden sobrescribir
    return data;
  }

  _processUpdateResponse(data) {
    // Implementación por defecto - las subclases pueden sobrescribir
    return data;
  }

  _validateCreateData(data) {
    // Implementación por defecto - las subclases deben sobrescribir
    return data;
  }

  _validateUpdateData(data) {
    // Implementación por defecto - las subclases deben sobrescribir
    return data;
  }
}

export default BaseApiService;