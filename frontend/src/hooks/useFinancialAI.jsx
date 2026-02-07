import { useState, useCallback } from 'react';
import axios from 'axios';

const AI_CONFIG = {
  n8nWebhook: import.meta.env.VITE_N8N_WEBHOOK,
  timeout: 30000 // 30 segundos para análisis de IA
};

// Validar que la variable de entorno esté configurada
if (!AI_CONFIG.n8nWebhook) {
  console.error('❌ VITE_N8N_WEBHOOK no está configurado en .env');
  console.error('Por favor, copia .env.example a .env y configura tu webhook de n8n');
}

export const useFinancialAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const analyzeFinances = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(AI_CONFIG.n8nWebhook, {
        action: 'analyze_finances',
        data: data,
        timestamp: new Date().toISOString()
      }, {
        timeout: AI_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setAnalysis(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error en el análisis financiero';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateScenario = useCallback(async (scenario) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(AI_CONFIG.n8nWebhook, {
        action: 'generate_scenario',
        scenario: scenario,
        timestamp: new Date().toISOString()
      }, {
        timeout: AI_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error generando escenario';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    analysis,
    analyzeFinances,
    generateScenario,
    clearAnalysis,
    clearError
  };
};