#!/bin/bash

# Script para ejecutar tests E2E en Arch Linux
# Uso: ./run-e2e-tests.sh [test-name] [options]

set -e

echo "🧪 Sistema de Gastos - E2E Tests Runner"
echo "========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que Playwright está instalado
if ! npm list @playwright/test > /dev/null 2>&1; then
    echo -e "${RED}❌ Playwright no está instalado${NC}"
    echo "Instalando Playwright..."
    npm install -D @playwright/test playwright
    npx playwright install chromium
fi

# Verificar servicios
echo "🔍 Verificando servicios..."

# Backend
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend corriendo en puerto 8000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend NO está corriendo en puerto 8000${NC}"
    echo "   Por favor inicia el backend con:"
    echo "   cd backend && uvicorn app.main:app --reload"
    exit 1
fi

# Frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend corriendo en puerto 5173${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend NO está corriendo en puerto 5173${NC}"
    echo "   Por favor inicia el frontend con:"
    echo "   cd frontend && npm run dev"
    exit 1
fi

echo ""
echo "🚀 Ejecutando tests..."
echo ""

# Determinar qué tests ejecutar
TEST_NAME=${1:-""}
TEST_OPTIONS=${2:-""}

# Deshabilitar auto-start de servers (ya están corriendo)
export PW_TEST_HTML_REPORT_OPEN=never

if [ -z "$TEST_NAME" ]; then
    # Ejecutar todos los tests
    echo "📝 Ejecutando TODOS los tests..."
    npx playwright test --project=chromium --config=playwright.config.js
else
    # Ejecutar test específico
    echo "📝 Ejecutando test: $TEST_NAME"
    npx playwright test "$TEST_NAME" --project=chromium --config=playwright.config.js $TEST_OPTIONS
fi

# Mostrar reporte
echo ""
echo "📊 Generando reporte..."
npx playwright show-report --host 0.0.0.0 --port 9323 &
REPORT_PID=$!

echo ""
echo -e "${GREEN}✅ Tests completados${NC}"
echo ""
echo "📈 Ver reporte HTML:"
echo "   http://localhost:9323"
echo ""
echo "Para detener el servidor de reportes:"
echo "   kill $REPORT_PID"
