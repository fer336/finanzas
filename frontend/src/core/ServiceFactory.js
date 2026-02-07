import PagosPendientesService from '../services/PagosPendientesService.js';

/**
 * FACTORY PATTERN PARA SERVICIOS
 * Implementa ABSTRACCIÓN y ENCAPSULACIÓN
 * Centraliza la creación de servicios
 * Aplica SINGLETON para instancias únicas
 */
class ServiceFactory {
  constructor() {
    // ENCAPSULACIÓN: Mapa privado de servicios instanciados
    this._services = new Map();
    
    // ENCAPSULACIÓN: Configuración de servicios disponibles
    this._serviceConfig = {
      pagosPendientes: {
        class: PagosPendientesService,
        singleton: true
      },
      // Aquí se pueden agregar más servicios siguiendo el mismo patrón
      // transacciones: { class: TransaccionesService, singleton: true },
      // categorias: { class: CategoriasService, singleton: true }
    };
  }

  // ABSTRACCIÓN: Método principal para obtener servicios
  getService(serviceName) {
    if (!this._serviceConfig[serviceName]) {
      throw new Error(`Servicio '${serviceName}' no está registrado`);
    }

    const config = this._serviceConfig[serviceName];
    
    // SINGLETON: Reutilizar instancia si ya existe y es singleton
    if (config.singleton && this._services.has(serviceName)) {
      return this._services.get(serviceName);
    }

    // FACTORY: Crear nueva instancia
    const ServiceClass = config.class;
    const serviceInstance = new ServiceClass();
    
    // ENCAPSULACIÓN: Guardar instancia si es singleton
    if (config.singleton) {
      this._services.set(serviceName, serviceInstance);
    }
    
    console.log(`🏭 ServiceFactory: Creado servicio '${serviceName}'`);
    return serviceInstance;
  }

  // ENCAPSULACIÓN: Método para registrar nuevos servicios
  registerService(name, ServiceClass, options = {}) {
    this._serviceConfig[name] = {
      class: ServiceClass,
      singleton: options.singleton !== false // Por defecto es singleton
    };
    
    console.log(`🏭 ServiceFactory: Registrado servicio '${name}'`);
  }

  // ABSTRACCIÓN: Métodos de conveniencia para servicios específicos
  getPagosPendientesService() {
    return this.getService('pagosPendientes');
  }

  // ENCAPSULACIÓN: Método para limpiar cache de servicios
  clearCache() {
    this._services.clear();
    console.log('🏭 ServiceFactory: Cache de servicios limpiado');
  }

  // ABSTRACCIÓN: Información sobre servicios disponibles
  getAvailableServices() {
    return Object.keys(this._serviceConfig);
  }
}

// SINGLETON: Instancia única del factory
const serviceFactory = new ServiceFactory();

export default serviceFactory;