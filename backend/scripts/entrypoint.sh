#!/bin/bash
# ========================================
# Entrypoint del backend - Finanzas App
# ----------------------------------------
# 1. Carga los secrets de Docker Swarm (si existen)
# 2. Aplica migraciones de base de datos (alembic upgrade head)
# 3. Arranca uvicorn
#
# Si la migración falla, el contenedor no arranca -> el health check
# del pipeline de deploy detecta el fallo y no queda verde falsamente.
# ========================================

set -euo pipefail

# Cargar secrets de Docker Swarm (montados como archivo en runtime)
if [ -f /run/secrets/backend.env ]; then
  echo "🔑 Cargando secrets de Docker Swarm..."
  set -a
  # shellcheck disable=SC1091
  . /run/secrets/backend.env
  set +a
fi

# Aplicar migraciones pendientes (idempotente).
# Se usa "upgrade heads" y no "upgrade head" porque el historial tiene
# multiples ramas (varias migraciones con down_revision = None); heads
# aplica todas las cabezas pendientes sin ambigüedad.
# Instalación local (install.sh): crea el esquema en una base vacía y la
# cuenta demo. Producción no define LOCAL_AUTH_ENABLED y no lo ejecuta.
# Mismo criterio que settings.LOCAL_AUTH_ENABLED: true/1/yes sin importar mayúsculas.
case "$(printf '%s' "${LOCAL_AUTH_ENABLED:-false}" | tr '[:upper:]' '[:lower:]')" in
  true|1|yes)
    echo "🧪 Preparando base de datos local..."
    python scripts/bootstrap_local.py
    ;;
esac

echo "⏳ Aplicando migraciones de base de datos..."
alembic upgrade heads
echo "✅ Migraciones aplicadas"

# Arrancar la API
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1