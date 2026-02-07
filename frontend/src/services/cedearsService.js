/**
 * SERVICIO DE CEDEARs
 * Obtiene información de Certificados de Depósito Argentinos
 * Los CEDEARs son instrumentos que representan acciones extranjeras en Argentina
 */

// Lista de CEDEARs más populares (se puede expandir)
const CEDEARS_POPULARES = [
  // Tecnología
  { ticker: 'AAPL', nombre: 'Apple Inc.', sector: 'Tecnología', ratio: '10:1' },
  { ticker: 'GOOGL', nombre: 'Alphabet (Google)', sector: 'Tecnología', ratio: '10:1' },
  { ticker: 'MSFT', nombre: 'Microsoft', sector: 'Tecnología', ratio: '4:1' },
  { ticker: 'META', nombre: 'Meta Platforms (Facebook)', sector: 'Tecnología', ratio: '10:1' },
  { ticker: 'AMZN', nombre: 'Amazon', sector: 'E-commerce', ratio: '20:1' },
  { ticker: 'TSLA', nombre: 'Tesla', sector: 'Automotriz/Energía', ratio: '20:1' },
  { ticker: 'NVDA', nombre: 'NVIDIA', sector: 'Semiconductores', ratio: '20:1' },
  { ticker: 'NFLX', nombre: 'Netflix', sector: 'Entretenimiento', ratio: '4:1' },
  
  // Finanzas
  { ticker: 'JPM', nombre: 'JPMorgan Chase', sector: 'Finanzas', ratio: '2:1' },
  { ticker: 'BAC', nombre: 'Bank of America', sector: 'Finanzas', ratio: '2:1' },
  { ticker: 'V', nombre: 'Visa', sector: 'Pagos', ratio: '10:1' },
  { ticker: 'MA', nombre: 'Mastercard', sector: 'Pagos', ratio: '10:1' },
  
  // Consumer Goods
  { ticker: 'KO', nombre: 'Coca-Cola', sector: 'Bebidas', ratio: '1:1' },
  { ticker: 'PEP', nombre: 'PepsiCo', sector: 'Bebidas', ratio: '2:1' },
  { ticker: 'WMT', nombre: 'Walmart', sector: 'Retail', ratio: '2:1' },
  { ticker: 'DIS', nombre: 'Disney', sector: 'Entretenimiento', ratio: '2:1' },
  { ticker: 'NKE', nombre: 'Nike', sector: 'Indumentaria', ratio: '2:1' },
  { ticker: 'MCD', nombre: 'McDonald\'s', sector: 'Alimentos', ratio: '1:1' },
  
  // Latinoamérica
  { ticker: 'MELI', nombre: 'MercadoLibre', sector: 'E-commerce', ratio: '1:1' },
  { ticker: 'GLOB', nombre: 'Globant', sector: 'Tecnología', ratio: '1:1' },
  { ticker: 'DESP', nombre: 'Despegar', sector: 'Turismo', ratio: '1:1' },
  
  // ETFs
  { ticker: 'SPY', nombre: 'SPDR S&P 500 ETF', sector: 'ETF - Índice', ratio: '20:1' },
  { ticker: 'QQQ', nombre: 'Invesco QQQ (Nasdaq)', sector: 'ETF - Tecnología', ratio: '10:1' },
  { ticker: 'DIA', nombre: 'SPDR Dow Jones ETF', sector: 'ETF - Índice', ratio: '4:1' },
  { ticker: 'EEM', nombre: 'iShares MSCI Emerging Markets', sector: 'ETF - Emergentes', ratio: '5:1' },
  { ticker: 'GLD', nombre: 'SPDR Gold Trust', sector: 'ETF - Oro', ratio: '40:1' },
  { ticker: 'SLV', nombre: 'iShares Silver Trust', sector: 'ETF - Plata', ratio: '10:1' },
  { ticker: 'XLE', nombre: 'Energy Select Sector SPDR', sector: 'ETF - Energía', ratio: '1:1' },
  { ticker: 'XLF', nombre: 'Financial Select Sector SPDR', sector: 'ETF - Finanzas', ratio: '3:1' },
  { ticker: 'XLK', nombre: 'Technology Select Sector SPDR', sector: 'ETF - Tecnología', ratio: '46:1' },
  { ticker: 'XLV', nombre: 'Health Care Select Sector SPDR', sector: 'ETF - Salud', ratio: '29:1' },
];

const cedearsService = {
  /**
   * Obtiene todos los CEDEARs disponibles
   */
  getAllCedears() {
    return CEDEARS_POPULARES;
  },

  /**
   * Busca CEDEARs por nombre, ticker o sector
   */
  searchCedears(query) {
    if (!query) return CEDEARS_POPULARES;
    
    const lowerQuery = query.toLowerCase();
    return CEDEARS_POPULARES.filter(cedear => 
      cedear.ticker.toLowerCase().includes(lowerQuery) ||
      cedear.nombre.toLowerCase().includes(lowerQuery) ||
      cedear.sector.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Filtra CEDEARs por sector
   */
  filterBySector(sector) {
    if (!sector || sector === 'all') return CEDEARS_POPULARES;
    return CEDEARS_POPULARES.filter(cedear => cedear.sector === sector);
  },

  /**
   * Obtiene los sectores únicos
   */
  getSectores() {
    const sectores = [...new Set(CEDEARS_POPULARES.map(c => c.sector))];
    return sectores.sort();
  },

  /**
   * Obtiene información de un CEDEAR específico por ticker
   */
  getCedearByTicker(ticker) {
    return CEDEARS_POPULARES.find(c => c.ticker === ticker);
  },

  /**
   * Simula obtención de precio (en una implementación real, esto vendría de una API)
   */
  async getCedearPrice(ticker) {
    // En producción, esto debería hacer una llamada a una API real
    // Por ahora retornamos un precio simulado
    return {
      ticker,
      price: (Math.random() * 10000 + 1000).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2),
      changePercent: (Math.random() * 5 - 2.5).toFixed(2),
      volume: Math.floor(Math.random() * 1000000),
      lastUpdate: new Date().toISOString()
    };
  },

  /**
   * Obtiene precios de múltiples CEDEARs
   */
  async getCedearsPrices(tickers) {
    return Promise.all(
      tickers.map(ticker => this.getCedearPrice(ticker))
    );
  }
};

export default cedearsService;
