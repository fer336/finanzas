#!/bin/bash

set -e  # Exit on error

echo "🚀 =================================================="
echo "   DESPLIEGUE A PRODUCCIÓN - FINANZAS APP"
echo "   =================================================="
echo ""

# Variables
BACKEND_VERSION="v2.18"
FRONTEND_VERSION="v2.18"
DOCKER_USER="ferc33"
GOOGLE_CLIENT_ID="36748029125-a720lh8tj7i6vi0pm4cg9tonehr0803j.apps.googleusercontent.com"

# ⚠️ IMPORTANTE: La API URL debe ser relativa en producción para que Traefik maneje el routing
# NO usar http:// o https:// en VITE_BACKEND_URL - usar solo el path relativo
API_PATH="/api"
OAUTH_URL="https://finanzas.qeva.xyz/auth/google/callback"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: No se encuentra docker-compose.yml"
    echo "   Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

echo "📋 Versiones a construir:"
echo "   - Backend: ${BACKEND_VERSION}"
echo "   - Frontend: ${FRONTEND_VERSION}"
echo ""

# Verificar que existe el secreto en Docker Swarm
echo "🔐 Verificando secreto de backend..."
if ! docker secret ls | grep -q "finanzas_backend_env"; then
    echo "⚠️  ADVERTENCIA: El secreto 'finanzas_backend_env' no existe en Docker Swarm"
    echo ""
    echo "   Para crearlo, ejecuta:"
    echo "   docker secret create finanzas_backend_env /ruta/a/backend.env"
    echo ""
    echo "   Asegúrate de que backend.env contenga:"
    echo "   - DATABASE_URL"
    echo "   - SECRET_KEY"
    echo "   - GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET"
    echo "   - OPENROUTER_API_KEY (¡NO dejar en código!)"
    echo "   - FRONTEND_URL y BACKEND_URL"
    echo ""
    read -p "¿Continuar de todas formas? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Backend
echo ""
echo "📦 =================================================="
echo "   CONSTRUYENDO BACKEND ${BACKEND_VERSION}"
echo "   =================================================="
cd backend

echo "🔨 Building imagen con --no-cache..."
sudo docker build --no-cache -t ${DOCKER_USER}/finanzas-backend:${BACKEND_VERSION} .

echo "🏷️  Tageando como latest..."
sudo docker tag ${DOCKER_USER}/finanzas-backend:${BACKEND_VERSION} ${DOCKER_USER}/finanzas-backend:latest

echo "⬆️  Subiendo a Docker Hub..."
sudo docker push ${DOCKER_USER}/finanzas-backend:${BACKEND_VERSION}
sudo docker push ${DOCKER_USER}/finanzas-backend:latest

cd ..

# Frontend
echo ""
echo "🎨 =================================================="
echo "   CONSTRUYENDO FRONTEND ${FRONTEND_VERSION}"
echo "   =================================================="

echo "🔨 Building imagen con build args..."
echo "   - GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:20}..."
echo "   - API_PATH: ${API_PATH}"
echo "   - OAUTH_URL: ${OAUTH_URL}"

# IMPORTANTE: No usar http:// en VITE_BACKEND_URL
# Traefik maneja el routing basado en PathPrefix
sudo docker build --no-cache -t ${DOCKER_USER}/finanzas-frontend:${FRONTEND_VERSION} \
  --build-arg VITE_GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
  --build-arg VITE_BACKEND_URL="" \
  --build-arg VITE_OAUTH_PROD_URL="${OAUTH_URL}" \
  frontend/

echo "🏷️  Tageando como latest..."
sudo docker tag ${DOCKER_USER}/finanzas-frontend:${FRONTEND_VERSION} ${DOCKER_USER}/finanzas-frontend:latest

echo "⬆️  Subiendo a Docker Hub..."
sudo docker push ${DOCKER_USER}/finanzas-frontend:${FRONTEND_VERSION}
sudo docker push ${DOCKER_USER}/finanzas-frontend:latest

# Actualizar docker-compose.yml
echo ""
echo "📝 Actualizando docker-compose.yml..."
sed -i.bak "s|finanzas-backend:v[0-9.]\+|finanzas-backend:${BACKEND_VERSION}|" docker-compose.yml
sed -i.bak "s|finanzas-frontend:v[0-9.]\+|finanzas-frontend:${FRONTEND_VERSION}|" docker-compose.yml

echo ""
echo "✅ =================================================="
echo "   IMÁGENES CONSTRUIDAS Y SUBIDAS EXITOSAMENTE"
echo "   =================================================="
echo ""
echo "📋 Resumen:"
echo "   - Backend: ${DOCKER_USER}/finanzas-backend:${BACKEND_VERSION}"
echo "   - Frontend: ${DOCKER_USER}/finanzas-frontend:${FRONTEND_VERSION}"
echo ""
echo "🚀 Próximos pasos:"
echo ""
echo "   1. Verificar que el secreto esté configurado:"
echo "      docker secret ls | grep finanzas"
echo ""
echo "   2. Desplegar en producción (RECOMENDADO):"
echo "      ./update-production.sh"
echo ""
echo "   3. O desplegar manualmente:"
echo "      docker stack deploy -c docker-compose.yml finanzas"
echo ""
echo "   4. Verificar el despliegue:"
echo "      docker service ls | grep finanzas"
echo "      docker service logs -f finanzas_backend"
echo "      docker service logs -f finanzas_frontend"
echo ""
echo "   5. Verificar la aplicación:"
echo "      curl https://finanzas.qeva.xyz/api/health"
echo "      curl https://finanzas.qeva.xyz"
echo ""
echo "   6. Verificar health checks:"
echo "      docker service ps finanzas_backend"
echo "      docker inspect \$(docker ps -q -f name=finanzas_backend) | grep Health"
echo ""
echo "🔐 IMPORTANTE:"
echo "   - Asegúrate de que OPENROUTER_API_KEY esté en el secreto"
echo "   - NO commitear archivos con API keys"
echo "   - Verificar que todas las URLs usen HTTPS en producción"
echo ""
echo "=================================================="
echo ""
echo "🔧 Configurando permisos de scripts..."
chmod +x update-production.sh
echo "✅ Permisos configurados"
echo ""

