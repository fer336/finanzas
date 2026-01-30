# 🔐 Guía de Seguridad

## ⚠️ CREDENCIALES Y SECRETOS

### ❌ NUNCA Subas a GitHub

Los siguientes archivos **NUNCA** deben subirse al repositorio:

```
❌ .env                    # Credenciales reales
❌ .env.local              # Variables locales
❌ .env.production         # Credenciales de producción
❌ *.pem                   # Claves privadas
❌ *.key                   # Certificados
❌ secrets/                # Carpeta de secretos
```

### ✅ Archivos Seguros para GitHub

```
✅ .env.example            # Plantilla sin credenciales
✅ .gitignore              # Lista de archivos ignorados
✅ docker-compose.yml      # Sin secretos hardcodeados
✅ README.md               # Documentación pública
```

---

## 🔑 Gestión de Credenciales

### Backend (.env)

**Credenciales Sensibles:**

| Variable | Descripción | Cómo Obtenerla |
|----------|-------------|----------------|
| `SECRET_KEY` | Clave para JWT | `openssl rand -hex 32` |
| `SESSION_SECRET_KEY` | Clave de sesiones | `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | Password de PostgreSQL | Elegir contraseña segura (16+ caracteres) |
| `GOOGLE_CLIENT_SECRET` | OAuth de Google | [Google Cloud Console](https://console.cloud.google.com) |
| `MINIO_SECRET_KEY` | Clave de MinIO/S3 | Panel de MinIO o AWS |
| `OPENROUTER_API_KEY` | API de OpenRouter | [OpenRouter Keys](https://openrouter.ai/keys) |

### Frontend (.env)

**Variables Públicas (se compilan en el bundle):**

⚠️ **IMPORTANTE**: Las variables `VITE_*` son **públicas** y se incluyen en el JavaScript compilado.

- ✅ **Seguro**: `VITE_GOOGLE_CLIENT_ID` (OAuth Client ID es público por diseño)
- ✅ **Seguro**: `VITE_BACKEND_URL` (URL pública del backend)
- ❌ **NO SEGURO**: API keys privadas, secretos, passwords

---

## 🛡️ Mejores Prácticas

### 1. Generar Claves Seguras

```bash
# SECRET_KEY (64 caracteres hex)
openssl rand -hex 32

# SESSION_SECRET_KEY (64 caracteres hex)
openssl rand -hex 32

# Password fuerte con pwgen
pwgen -s 32 1

# UUID para IDs
uuidgen
```

### 2. Rotar Credenciales Regularmente

```bash
# Cada 3-6 meses:
# 1. Generar nuevas claves
# 2. Actualizar .env en producción
# 3. Reiniciar servicios
# 4. Invalidar tokens antiguos
```

### 3. Usar Docker Secrets en Producción

```bash
# Crear secrets en Docker Swarm
echo "mi_password_seguro" | docker secret create postgres_password -
echo "sk-or-v1-..." | docker secret create openrouter_api_key -

# Usar en docker-compose.yml
secrets:
  - postgres_password
  - openrouter_api_key
```

### 4. Variables de Entorno por Ambiente

```bash
# Desarrollo
.env                  # Local development

# Testing
.env.test            # Testing environment

# Producción
Docker Secrets       # Production (NO usar .env)
```

---

## 🚨 Qué Hacer si Expones una Credencial

### Pasos Inmediatos:

1. **REVOCAR inmediatamente**:
   ```bash
   # Google OAuth
   https://console.cloud.google.com/apis/credentials
   → Eliminar client secret → Crear nuevo
   
   # OpenRouter API
   https://openrouter.ai/keys
   → Delete key → Create new
   
   # PostgreSQL
   psql -c "ALTER USER postgres PASSWORD 'nuevo_password_seguro';"
   ```

2. **Eliminar del historial de Git**:
   ```bash
   # Usar BFG Repo-Cleaner
   bfg --replace-text passwords.txt my-repo.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Actualizar .env y reiniciar servicios**:
   ```bash
   # Editar .env con nuevas credenciales
   nano .env
   
   # Reiniciar servicios
   docker service update --force financiero_backend
   ```

4. **Auditar logs de acceso**:
   ```bash
   # Revisar si hubo accesos no autorizados
   tail -f /var/log/postgresql/postgresql.log
   docker service logs financiero_backend
   ```

---

## 🔍 Auditoría de Seguridad

### Verificar que .env no está en GitHub

```bash
# Buscar en el repositorio
git log --all --full-history --source --name-status --follow -- .env

# Si aparece, limpiarlo inmediatamente
git filter-branch --index-filter 'git rm --cached --ignore-unmatch .env' HEAD
```

### Verificar .gitignore

```bash
# .gitignore debe contener:
.env
.env.*
!.env.example
*.pem
*.key
secrets/
```

### Escanear credenciales expuestas

```bash
# Instalar trufflehog
pip install truffleHog

# Escanear repositorio
trufflehog --regex --entropy=True .
```

---

## 📊 Checklist de Seguridad

### Antes de Subir a GitHub

- [ ] ✅ `.env` está en `.gitignore`
- [ ] ✅ `.env.example` no tiene credenciales reales
- [ ] ✅ No hay API keys hardcodeadas en el código
- [ ] ✅ No hay IPs privadas expuestas
- [ ] ✅ No hay passwords en comentarios
- [ ] ✅ Docker Compose no tiene secretos hardcodeados

### Antes de Deployment

- [ ] ✅ Generar SECRET_KEY única para producción
- [ ] ✅ Usar Docker Secrets en lugar de .env
- [ ] ✅ HTTPS habilitado (Let's Encrypt)
- [ ] ✅ Firewall configurado (solo puertos necesarios)
- [ ] ✅ PostgreSQL no accesible públicamente
- [ ] ✅ MinIO con autenticación obligatoria
- [ ] ✅ Rate limiting en API habilitado

### Mantenimiento Continuo

- [ ] ✅ Rotar credenciales cada 3-6 meses
- [ ] ✅ Auditar logs de acceso semanalmente
- [ ] ✅ Actualizar dependencias mensualmente
- [ ] ✅ Backup cifrado de base de datos
- [ ] ✅ Monitorear consumo de API (OpenRouter)

---

## 🔗 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Secrets Documentation](https://docs.docker.com/engine/swarm/secrets/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Let's Encrypt (SSL Gratuito)](https://letsencrypt.org/)

---

## 📧 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, **NO** abras un issue público.

Contacta directamente a: **fernando@example.com** con:
- Descripción de la vulnerabilidad
- Pasos para reproducirla
- Impacto potencial
- Sugerencias de mitigación (opcional)

---

<div align="center">

**🔒 La seguridad es responsabilidad de todos**

[⬆ Volver al README](./README.md)

</div>

