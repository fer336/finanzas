/**
 * Función de prueba para verificar el endpoint getById de pagos pendientes
 * Basado en el curl proporcionado por el usuario
 */

const API_BASE_URL = 'https://db.qeva.xyz/api/v2/tables';
const TABLE_ID = 'm4koe7rctoacngm'; // PAGOS_PENDIENTES
const TOKEN = 'Tx_bWHkcDNEC_dADsFqf09FhjQoZmpRaThelfkmm';

export const testGetPagoById = async (id = 1) => {
  console.log(`🧪 Probando getById para pago con ID: ${id}`);
  
  const url = `${API_BASE_URL}/${TABLE_ID}/records/${id}`;
  console.log(`🔗 URL: ${url}`);
  
  const headers = {
    'accept': 'application/json',
    'xc-token': TOKEN
  };
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`✅ OK: ${response.ok}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('📄 Datos recibidos:', data);
    console.log('🔑 Campos disponibles:', Object.keys(data || {}));
    
    return data;
  } catch (error) {
    console.error('💥 Error en la petición:', error);
    return null;
  }
};

// Función para probar desde la consola del navegador
window.testPagoById = testGetPagoById;

console.log('🧪 Test function loaded! Use: testPagoById(1) in console');