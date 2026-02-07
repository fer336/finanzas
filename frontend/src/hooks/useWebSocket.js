import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar conexiones WebSocket
 * @param {string} url - URL del WebSocket
 * @param {function} onMessage - Callback cuando se recibe un mensaje
 * @param {object} options - Opciones de configuración
 * @returns {object} - Estado y métodos del WebSocket
 */
export function useWebSocket(url, onMessage, options = {}) {
  const {
    reconnectInterval = 5000,
    reconnectAttempts = 5,
    onOpen = () => {},
    onClose = () => {},
    onError = () => {},
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!url) {
      // No intentar conectar si no hay URL
      return;
    }
    
    try {
      console.log(`🔌 Intentando conectar a WebSocket: ${url}`);
      
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
        onOpen();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Mensaje recibido:', data);
          onMessage(data);
        } catch (err) {
          console.error('Error parseando mensaje:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ Error en WebSocket:', event);
        setError('Error de conexión WebSocket');
        onError(event);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket cerrado:', event.code, event.reason);
        setIsConnected(false);
        onClose(event);

        // Intentar reconectar si no se alcanzó el límite
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1;
          console.log(
            `🔄 Reconectando... (intento ${reconnectCountRef.current}/${reconnectAttempts})`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.error('❌ Máximo de intentos de reconexión alcanzado');
          setError('No se pudo reconectar al servidor');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creando WebSocket:', err);
      setError(err.message);
    }
  }, [url, onMessage, reconnectInterval, reconnectAttempts, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      console.log('🔌 Cerrando WebSocket...');
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(data);
      console.log('📤 Mensaje enviado:', message);
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}

export default useWebSocket;
