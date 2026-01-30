#!/bin/bash
# ========================================
# Script para asignar registros huérfanos
# ========================================

set -e

echo "🔧 Asignando registros huérfanos al usuario casserafernando@gmail.com"
echo "=========================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables de base de datos (ajusta según tu configuración)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-sistema_gastos}"
DB_USER="${DB_USER:-postgres}"

USER_ID="934d46c0-4a56-4096-94e6-9d294f3d5a89"
USER_EMAIL="casserafernando@gmail.com"

echo -e "${YELLOW}📊 Verificando usuario...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT id, email, full_name 
FROM usuarios 
WHERE id = '$USER_ID';
"

echo -e "\n${YELLOW}📋 Verificando categorías sin usuario...${NC}"
CATEGORIAS_SIN_USUARIO=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) FROM categorias WHERE usuario_id IS NULL;
")
echo "Categorías sin usuario: $CATEGORIAS_SIN_USUARIO"

echo -e "\n${YELLOW}💳 Verificando métodos de pago sin usuario...${NC}"
METODOS_SIN_USUARIO=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) FROM metodos_pago WHERE usuario_id IS NULL;
")
echo "Métodos de pago sin usuario: $METODOS_SIN_USUARIO"

if [ "$CATEGORIAS_SIN_USUARIO" -eq 0 ] && [ "$METODOS_SIN_USUARIO" -eq 0 ]; then
    echo -e "\n${GREEN}✅ No hay registros huérfanos. Todo listo para la migración.${NC}"
    exit 0
fi

echo -e "\n${YELLOW}⚠️  Se encontraron registros huérfanos. Asignando al usuario...${NC}"

read -p "¿Continuar con la asignación? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Operación cancelada${NC}"
    exit 1
fi

echo -e "\n${YELLOW}🔄 Asignando categorías...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
UPDATE categorias
SET usuario_id = '$USER_ID'
WHERE usuario_id IS NULL;
"

echo -e "\n${YELLOW}🔄 Asignando métodos de pago...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
UPDATE metodos_pago
SET usuario_id = '$USER_ID'
WHERE usuario_id IS NULL;
"

echo -e "\n${GREEN}✅ Asignación completada${NC}"

echo -e "\n${YELLOW}📊 Resumen final:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    (SELECT COUNT(*) FROM categorias WHERE usuario_id = '$USER_ID') as total_categorias,
    (SELECT COUNT(*) FROM metodos_pago WHERE usuario_id = '$USER_ID') as total_metodos_pago;
"

echo -e "\n${YELLOW}🔍 Verificación final (debe ser 0 en ambos):${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    'categorias' as tabla,
    COUNT(*) as sin_usuario
FROM categorias
WHERE usuario_id IS NULL
UNION ALL
SELECT 
    'metodos_pago' as tabla,
    COUNT(*) as sin_usuario
FROM metodos_pago
WHERE usuario_id IS NULL;
"

echo -e "\n${GREEN}✅ Listo! Ahora puedes ejecutar: alembic upgrade head${NC}"

