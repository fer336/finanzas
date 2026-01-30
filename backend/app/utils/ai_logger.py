import json
import os
import logging
from datetime import datetime
from typing import Dict, Any, List

# Configurar logger
logger = logging.getLogger(__name__)

# Usar ruta absoluta basada en la ubicación de este archivo
# backend/app/utils/ai_logger.py -> backend/data/ai_history.json
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
LOG_FILE = os.path.join(DATA_DIR, "ai_history.json")

# Asegurar que el directorio data exista
os.makedirs(DATA_DIR, exist_ok=True)

# Precios aproximados por modelo (por millón de tokens)
# Precios de OpenRouter: https://openrouter.ai/docs/models
MODEL_PRICING = {
    "google/gemini-2.5-flash-lite": {"input": 0.075, "output": 0.30},  # $0.075/$0.30 por 1M tokens
    "google/gemini-3-flash-preview": {"input": 0.15, "output": 0.60},  # Estimado
    "google/gemini-flash-1.5": {"input": 0.075, "output": 0.30},
    "google/gemini-pro": {"input": 0.50, "output": 2.00},
    "anthropic/claude-3-5-sonnet": {"input": 3.00, "output": 15.00},
    "openai/gpt-4": {"input": 30.00, "output": 60.00},
    "openai/gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
}

def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calcula el costo estimado basado en el modelo y tokens usados"""
    try:
        # Buscar pricing del modelo (intentar con nombre completo y versiones simplificadas)
        pricing = None
        
        # Intentar match exacto
        if model in MODEL_PRICING:
            pricing = MODEL_PRICING[model]
        else:
            # Intentar match parcial
            for model_key in MODEL_PRICING.keys():
                if model_key in model or model in model_key:
                    pricing = MODEL_PRICING[model_key]
                    break
        
        # Si no encontramos pricing, usar valores por defecto conservadores
        if not pricing:
            pricing = {"input": 0.15, "output": 0.60}
        
        # Calcular costo (precio por millón de tokens)
        input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
        output_cost = (completion_tokens / 1_000_000) * pricing["output"]
        
        return input_cost + output_cost
    except Exception as e:
        logger.error(f"Error calculating cost: {e}")
        return 0.0

def save_ai_activity(data: Dict[str, Any]):
    """Guarda un registro de actividad de IA en un archivo JSON local"""
    try:
        # Asegurar directorio nuevamente por si acaso
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)
            
        history = []
        if os.path.exists(LOG_FILE):
            try:
                with open(LOG_FILE, 'r') as f:
                    history = json.load(f)
            except json.JSONDecodeError:
                history = []
        
        # Agregar timestamp si no existe
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
            
        # Insertar al principio (más reciente primero)
        history.insert(0, data)
        
        # Mantener solo los últimos 100 registros
        history = history[:100]
        
        with open(LOG_FILE, 'w') as f:
            json.dump(history, f, indent=2)
            
    except Exception as e:
        logger.error(f"Error saving AI activity to {LOG_FILE}: {e}")

def get_ai_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Obtiene el historial de actividad local"""
    try:
        if not os.path.exists(LOG_FILE):
            return []
            
        with open(LOG_FILE, 'r') as f:
            history = json.load(f)
            return history[:limit]
    except Exception as e:
        logger.error(f"Error reading AI activity from {LOG_FILE}: {e}")
        return []
