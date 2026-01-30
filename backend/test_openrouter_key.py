#!/usr/bin/env python3
"""
Script de diagnóstico para verificar la API key de OpenRouter
"""
import os
import httpx
import sys
from dotenv import load_dotenv

# Cargar .env
load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"').strip("'")

print("=" * 80)
print("🔍 DIAGNÓSTICO DE API KEY DE OPENROUTER")
print("=" * 80)
print()

# Verificar que existe
if not api_key:
    print("❌ ERROR: OPENROUTER_API_KEY no está configurada en .env")
    sys.exit(1)

# Mostrar info
print(f"✅ API Key encontrada:")
print(f"   Longitud: {len(api_key)} caracteres")
print(f"   Preview: {api_key[:10]}...{api_key[-4:]}")
print(f"   Formato: {'✅ Correcto (sk-or-v1-)' if api_key.startswith('sk-or-v1-') else '⚠️  Formato no reconocido'}")
print()

# Probar conexión
print("🔄 Probando conexión con OpenRouter...")
print()

try:
    response = httpx.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "google/gemini-flash-1.5",
            "messages": [
                {"role": "user", "content": "Hello, this is a test"}
            ],
            "max_tokens": 10
        },
        timeout=30.0
    )
    
    print(f"📡 Status Code: {response.status_code}")
    print(f"📄 Response: {response.text[:500]}")
    print()
    
    if response.status_code == 200:
        print("✅ ¡API KEY VÁLIDA! La conexión con OpenRouter funciona correctamente.")
        sys.exit(0)
    elif response.status_code == 401:
        print("❌ ERROR 401: API Key inválida o expirada")
        print()
        print("🔧 SOLUCIONES:")
        print("   1. Verifica que la API key sea correcta en https://openrouter.ai/keys")
        print("   2. Verifica que la API key no haya expirado")
        print("   3. Verifica que tengas créditos en tu cuenta de OpenRouter")
        print("   4. Genera una nueva API key si es necesario")
        sys.exit(1)
    elif response.status_code == 402:
        print("❌ ERROR 402: Sin créditos suficientes en OpenRouter")
        print("   Recarga tu cuenta en https://openrouter.ai/credits")
        sys.exit(1)
    elif response.status_code == 429:
        print("⚠️  ERROR 429: Límite de rate excedido")
        print("   Espera unos minutos antes de volver a intentar")
        sys.exit(1)
    else:
        print(f"⚠️  ERROR: Respuesta inesperada ({response.status_code})")
        sys.exit(1)
        
except httpx.ConnectError:
    print("❌ ERROR: No se pudo conectar a OpenRouter")
    print("   Verifica tu conexión a internet")
    sys.exit(1)
except Exception as e:
    print(f"❌ ERROR INESPERADO: {str(e)}")
    sys.exit(1)

