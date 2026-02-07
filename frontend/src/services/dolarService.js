/**
 * SERVICIO DE COTIZACIÓN DE DÓLAR
 * Obtiene las cotizaciones actuales de los diferentes tipos de dólar en Argentina
 */

const DOLAR_API_BASE = 'https://dolarapi.com/v1';

// Tipos de dólar disponibles
export const TIPOS_DOLAR = {
  OFICIAL: { id: 'oficial', nombre: 'Dólar Oficial' },
  BLUE: { id: 'blue', nombre: 'Dólar Blue' },
  MEP: { id: 'bolsa', nombre: 'Dólar MEP (Bolsa)' },
  CCL: { id: 'contadoliqui', nombre: 'Dólar CCL' },
  TARJETA: { id: 'tarjeta', nombre: 'Dólar Tarjeta' },
  MAYORISTA: { id: 'mayorista', nombre: 'Dólar Mayorista' },
  CRIPTO: { id: 'cripto', nombre: 'Dólar Cripto' }
};

const dolarService = {
  /**
   * Obtiene todas las cotizaciones del dólar
   */
  async getAllCotizaciones() {
    try {
      const response = await fetch(`${DOLAR_API_BASE}/dolares`);
      if (!response.ok) throw new Error('Error al obtener cotizaciones');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo cotizaciones:', error);
      // Retornar valores por defecto en caso de error
      return this.getFallbackCotizaciones();
    }
  },

  /**
   * Obtiene la cotización de un tipo específico de dólar
   */
  async getCotizacion(tipoDolar) {
    try {
      const response = await fetch(`${DOLAR_API_BASE}/dolares/${tipoDolar}`);
      if (!response.ok) throw new Error('Error al obtener cotización');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error obteniendo cotización del dólar ${tipoDolar}:`, error);
      return null;
    }
  },

  /**
   * Convierte USD a ARS usando la cotización del tipo de dólar especificado
   */
  convertirUsdToArs(montoUsd, cotizacionVenta) {
    if (!montoUsd || !cotizacionVenta) return 0;
    return parseFloat(montoUsd) * parseFloat(cotizacionVenta);
  },

  /**
   * Convierte ARS a USD usando la cotización del tipo de dólar especificado
   */
  convertirArsToUsd(montoArs, cotizacionCompra) {
    if (!montoArs || !cotizacionCompra) return 0;
    return parseFloat(montoArs) / parseFloat(cotizacionCompra);
  },

  /**
   * Valores de fallback en caso de que la API no responda
   */
  getFallbackCotizaciones() {
    return [
      { moneda: 'USD', casa: 'oficial', nombre: 'Oficial', compra: 1405, venta: 1455 },
      { moneda: 'USD', casa: 'blue', nombre: 'Blue', compra: 1455, venta: 1475 },
      { moneda: 'USD', casa: 'bolsa', nombre: 'Bolsa', compra: 1525, venta: 1532 },
      { moneda: 'USD', casa: 'contadoliqui', nombre: 'CCL', compra: 1542, venta: 1548 },
      { moneda: 'USD', casa: 'tarjeta', nombre: 'Tarjeta', compra: 1826, venta: 1891 },
      { moneda: 'USD', casa: 'mayorista', nombre: 'Mayorista', compra: 1421, venta: 1430 },
      { moneda: 'USD', casa: 'cripto', nombre: 'Cripto', compra: 1514, venta: 1520 }
    ];
  },

  /**
   * Formatea el precio del dólar para mostrar
   */
  formatPrice(price) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(price);
  }
};

export default dolarService;
