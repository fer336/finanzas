# 🚀 Deploy Updates - N8N Webhook Integration

**Fecha**: 2026-02-07  
**Cambio**: Agregar variable de entorno `VITE_N8N_WEBHOOK` al proceso de deploy

---

## 📝 Resumen de Cambios

Se actualizó el script de deploy para incluir la URL del webhook de n8n como variable de entorno en el build del frontend.

### Archivos Modificados

1. ✅ **`deploy-production.sh`**
2. ✅ **`frontend/Dockerfile`**

---

## 🔧 Cambios Detallados

### 1. Script de Deploy (`deploy-production.sh`)

#### Variables Agregadas (línea 18)

```bash
# N8N Webhook URL (para integración con correos y resúmenes bancarios)
N8N_WEBHOOK_URL="https://n8nw.qeva.xyz/webhook/finance-agency"
```

#### Build Args Actualizados (línea 84-88)

```bash
echo "🔨 Building imagen con build args..."
echo "   - GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:20}..."
echo "   - API_PATH: ${API_PATH}"
echo "   - OAUTH_URL: ${OAUTH_URL}"
echo "   - N8N_WEBHOOK: ${N8N_WEBHOOK_URL:0:30}..."  # ✅ NUEVO

# IMPORTANTE: No usar http:// en VITE_BACKEND_URL
# Traefik maneja el routing basado en PathPrefix
sudo docker build --no-cache --network=host -t ${DOCKER_USER}/finanzas-frontend:${FRONTEND_VERSION} \
  --build-arg VITE_GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
  --build-arg VITE_BACKEND_URL="" \
  --build-arg VITE_OAUTH_PROD_URL="${OAUTH_URL}" \
  --build-arg VITE_N8N_WEBHOOK="${N8N_WEBHOOK_URL}" \  # ✅ NUEVO
  frontend/
```

---

### 2. Dockerfile del Frontend (`frontend/Dockerfile`)

#### ARG Agregado (línea 26)

```dockerfile
# Argumentos de construcción (pueden ser sobrescritos con --build-arg)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_BACKEND_URL
ARG VITE_DEV_BACKEND_URL
ARG VITE_DEV_FRONTEND_URL
ARG VITE_OAUTH_PROD_URL
ARG VITE_OAUTH_DEV_URL
ARG VITE_N8N_WEBHOOK  # ✅ NUEVO
```

#### ENV Agregado (línea 34)

```dockerfile
# Establecer variables de entorno para el proceso de build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_DEV_BACKEND_URL=$VITE_DEV_BACKEND_URL
ENV VITE_DEV_FRONTEND_URL=$VITE_DEV_FRONTEND_URL
ENV VITE_OAUTH_PROD_URL=$VITE_OAUTH_PROD_URL
ENV VITE_OAUTH_DEV_URL=$VITE_OAUTH_DEV_URL
ENV VITE_N8N_WEBHOOK=$VITE_N8N_WEBHOOK  # ✅ NUEVO
```

---

## 🎯 Propósito del Webhook N8N

El webhook de n8n se utiliza para:

1. **Procesamiento de Correos Electrónicos**
   - Integración con resúmenes bancarios recibidos por email
   - Extracción automática de datos de facturas

2. **Automatización de Flujos**
   - Notificaciones de gastos importantes
   - Alertas de vencimiento de pagos
   - Resúmenes mensuales automáticos

3. **Integración con Agente IA**
   - El agente IA puede enviar datos al webhook
   - n8n procesa y dispara workflows automáticos

---

## ✅ Validación

### Pre-Deploy

Antes de ejecutar el deploy, verificar que la URL del webhook es correcta:

```bash
# Verificar variable en el script
grep "N8N_WEBHOOK_URL" deploy-production.sh

# Output esperado:
# N8N_WEBHOOK_URL="https://n8nw.qeva.xyz/webhook/finance-agency"
```

### Post-Deploy

Después del deploy, verificar que la variable está disponible en el frontend:

```bash
# 1. Inspeccionar el contenedor en producción
docker exec -it $(docker ps -q -f name=finanzas_frontend) sh

# 2. Dentro del contenedor, verificar archivos build
cat /usr/share/nginx/html/assets/index-*.js | grep -o "n8nw.qeva.xyz"

# 3. Desde el navegador (Console de DevTools)
console.log(import.meta.env.VITE_N8N_WEBHOOK)
```

### Prueba Funcional

```bash
# Probar webhook desde el servidor
curl -X POST https://n8nw.qeva.xyz/webhook/finance-agency \
  -H "Content-Type: application/json" \
  -d '{
    "test": "ping from finanzas app",
    "timestamp": "2026-02-07T18:00:00Z"
  }'

# Respuesta esperada: 200 OK o mensaje de n8n
```

---

## 🔒 Seguridad

### ⚠️ Consideraciones Importantes

1. **Webhook URL es PÚBLICA**
   - La URL del webhook se compila en el bundle de JavaScript
   - Es visible en el código fuente del frontend
   - **NO almacenar información sensible en el webhook**

2. **Validación en n8n**
   - Implementar validación de origen en el workflow de n8n
   - Usar tokens de autenticación si es necesario
   - Limitar rate limiting en n8n

3. **Variables Seguras vs Públicas**
   ```
   ✅ PÚBLICO (OK en VITE_):
   - VITE_N8N_WEBHOOK (URL pública)
   - VITE_GOOGLE_CLIENT_ID (OAuth público)
   
   ❌ PRIVADO (NUNCA en VITE_):
   - OPENROUTER_API_KEY (backend solo)
   - GOOGLE_CLIENT_SECRET (backend solo)
   - DATABASE_URL (backend solo)
   ```

---

## 📋 Checklist de Deploy

Antes de ejecutar `./deploy-production.sh`:

- [x] Variable `N8N_WEBHOOK_URL` definida en script
- [x] Dockerfile acepta `ARG VITE_N8N_WEBHOOK`
- [x] Dockerfile establece `ENV VITE_N8N_WEBHOOK`
- [x] Build arg se pasa correctamente en `docker build`
- [ ] Webhook de n8n está activo y responde
- [ ] Workflow de n8n está configurado y probado
- [ ] Frontend `.env` tiene la URL correcta para desarrollo

---

## 🚀 Ejecutar Deploy

```bash
# 1. Verificar cambios
git diff deploy-production.sh
git diff frontend/Dockerfile

# 2. (Opcional) Hacer commit
git add deploy-production.sh frontend/Dockerfile
git commit -m "feat: add N8N webhook to frontend build process"

# 3. Ejecutar deploy
chmod +x deploy-production.sh
./deploy-production.sh

# 4. Verificar que el build incluye la variable
# Durante el build verás:
#   - N8N_WEBHOOK: https://n8nw.qeva.xyz/webhook...
```

---

## 📊 Comparación Antes/Después

### Antes

```bash
# deploy-production.sh
GOOGLE_CLIENT_ID="..."
API_PATH="/api"
OAUTH_URL="..."

# docker build
--build-arg VITE_GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"
--build-arg VITE_BACKEND_URL=""
--build-arg VITE_OAUTH_PROD_URL="${OAUTH_URL}"
```

### Después

```bash
# deploy-production.sh
GOOGLE_CLIENT_ID="..."
API_PATH="/api"
OAUTH_URL="..."
N8N_WEBHOOK_URL="https://n8nw.qeva.xyz/webhook/finance-agency"  # ✅ NUEVO

# docker build
--build-arg VITE_GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"
--build-arg VITE_BACKEND_URL=""
--build-arg VITE_OAUTH_PROD_URL="${OAUTH_URL}"
--build-arg VITE_N8N_WEBHOOK="${N8N_WEBHOOK_URL}"  # ✅ NUEVO
```

---

## 🔗 Referencias

### Archivos Relacionados

- `frontend/.env` - Variables de desarrollo (incluye webhook)
- `frontend/.env.example` - Template con documentación
- `frontend/Dockerfile` - Build de producción
- `deploy-production.sh` - Script de deploy

### Documentación

- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Build Args](https://docs.docker.com/engine/reference/builder/#arg)
- [n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

---

## 🐛 Troubleshooting

### Problema: Variable undefined en el frontend

**Síntomas**:
```javascript
console.log(import.meta.env.VITE_N8N_WEBHOOK)
// Output: undefined
```

**Solución**:
1. Verificar que el build arg se pasó correctamente
2. Reconstruir imagen desde cero: `docker build --no-cache`
3. Verificar que no hay typos en el nombre de la variable

---

### Problema: Webhook no responde

**Síntomas**:
```bash
curl: (7) Failed to connect to n8nw.qeva.xyz
```

**Solución**:
1. Verificar que n8n está corriendo
2. Verificar que el workflow está activo
3. Verificar DNS: `nslookup n8nw.qeva.xyz`
4. Verificar SSL: `curl -I https://n8nw.qeva.xyz`

---

### Problema: CORS al llamar webhook desde frontend

**Síntomas**:
```
Access to fetch at 'https://n8nw.qeva.xyz/webhook/...' has been blocked by CORS
```

**Solución**:
Configurar CORS en n8n workflow:
```json
{
  "headers": {
    "Access-Control-Allow-Origin": "https://finanzas.qeva.xyz",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
}
```

---

## ✅ Conclusión

Los cambios permiten que el frontend de producción tenga acceso a la URL del webhook de n8n para:

- ✅ Integración con workflows automáticos
- ✅ Procesamiento de resúmenes bancarios
- ✅ Notificaciones y alertas
- ✅ Análisis avanzados con IA

**Próximo paso**: Ejecutar `./deploy-production.sh` para aplicar los cambios.

---

**Generado**: 2026-02-07 18:00 ART  
**Autor**: OpenCode AI Assistant  
**Status**: ✅ Listo para deploy
