# 🚀 Guía de Configuración Completa

Esta guía te llevará paso a paso desde la instalación hasta tener el sistema funcionando en desarrollo y producción.

---

## 📋 Tabla de Contenidos

1. [Configuración de Desarrollo](#-configuración-de-desarrollo)
2. [Variables de Entorno](#-variables-de-entorno)
3. [Base de Datos PostgreSQL](#-base-de-datos-postgresql)
4. [Configuración de MinIO](#-configuración-de-minio)
5. [API Keys Necesarias](#-api-keys-necesarias)
6. [Troubleshooting](#-troubleshooting)

---

## 💻 Configuración de Desarrollo

### 1. Instalar Prerrequisitos

#### macOS (con Homebrew)
```bash
# Node.js 18+
brew install node

# Python 3.11+
brew install python@3.11

# PostgreSQL 14+
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.11+
sudo apt-get install python3.11 python3.11-venv python3-pip

# PostgreSQL 14+
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
- Descarga **Node.js 18+** desde [nodejs.org](https://nodejs.org/)
- Descarga **Python 3.11+** desde [python.org](https://www.python.org/)
- Descarga **PostgreSQL 14+** desde [postgresql.org](https://www.postgresql.org/)

---

### 2. Clonar y Configurar el Proyecto

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/sistema-de-gastos.git
cd sistema-de-gastos

# Ver estructura
tree -L 2
```

**Estructura esperada:**
```
sistema-de-gastos/
├── backend/           # API FastAPI
│   ├── app/
│   ├── migrations/
│   ├── main.py
│   └── requirements.txt
├── frontend/          # React + Vite
│   ├── src/
│   ├── public/
│   └── package.json
├── skills/            # Documentación de Skills
├── AGENTS.md          # Sistema de Agentes
└── README.md
```

---

## 🔐 Variables de Entorno

### Backend (.env)

Crea el archivo `backend/.env`:

```bash
cd backend
nano .env
```

**Contenido mínimo para desarrollo:**

```env
# ✅ OBLIGATORIO
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sistema_gastos
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx

# ✅ RECOMENDADO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=comprobantes
MINIO_USE_SSL=false

FRONTEND_URL=http://localhost:5173
HOST=127.0.0.1
PORT=8000
DEBUG=true

# ⚠️ CAMBIAR EN PRODUCCIÓN
SECRET_KEY=desarrollo_solo_no_usar_en_produccion
```

### Frontend (.env)

Crea el archivo `frontend/.env`:

```bash
cd ../frontend
nano .env
```

**Contenido:**

```env
VITE_API_URL=http://localhost:8000
VITE_MINIO_URL=http://localhost:9000
VITE_ENABLE_AI_AGENT=true
```

---

## 🗄️ Base de Datos PostgreSQL

### Crear Base de Datos

```bash
# 1. Conectar a PostgreSQL
psql postgres

# 2. Crear usuario (si no existe)
CREATE USER postgres WITH PASSWORD 'postgres';

# 3. Crear base de datos
CREATE DATABASE sistema_gastos OWNER postgres;

# 4. Dar permisos
GRANT ALL PRIVILEGES ON DATABASE sistema_gastos TO postgres;

# 5. Salir
\q
```

### Ejecutar Migraciones

```bash
cd backend

# Ejecutar scripts de migración en orden
psql sistema_gastos < migrations/001_initial_schema.sql
psql sistema_gastos < migrations/002_add_credit_card_fields.sql
psql sistema_gastos < migrations/003_add_objectives.sql
psql sistema_gastos < migrations/add_es_aporte_objetivo.sql

# Verificar tablas creadas
psql sistema_gastos -c "\dt"
```

**Tablas esperadas:**
```
 Schema |          Name           | Type  |  Owner
--------+-------------------------+-------+----------
 public | ai_activity             | table | postgres
 public | categorias              | table | postgres
 public | metodos_pago            | table | postgres
 public | objetivos_ahorro        | table | postgres
 public | pagospendientes         | table | postgres
 public | resumenes_bancarios     | table | postgres
 public | transacciones           | table | postgres
 public | usuarios                | table | postgres
```

### Datos de Prueba (Opcional)

```sql
-- Insertar categorías por defecto
INSERT INTO categorias (id, nombre, tipo, color, icono, activa) VALUES
(gen_random_uuid(), 'Alimentos y Bebidas', 'gasto', '#EF4444', 'UtensilsCrossed', true),
(gen_random_uuid(), 'Transporte', 'gasto', '#F59E0B', 'Car', true),
(gen_random_uuid(), 'Entretenimiento', 'gasto', '#8B5CF6', 'Gamepad2', true),
(gen_random_uuid(), 'Salario', 'ingreso', '#10B981', 'Briefcase', true),
(gen_random_uuid(), 'Inversiones', 'ingreso', '#3B82F6', 'TrendingUp', true);

-- Insertar métodos de pago por defecto
INSERT INTO metodos_pago (id, nombre, tipo, activo, color, icono) VALUES
(gen_random_uuid(), 'Efectivo', 'efectivo', true, '#10B981', 'Banknote'),
(gen_random_uuid(), 'Débito', 'debito', true, '#3B82F6', 'CreditCard'),
(gen_random_uuid(), 'Crédito', 'credito', true, '#F59E0B', 'CreditCard'),
(gen_random_uuid(), 'Transferencia', 'transferencia', true, '#8B5CF6', 'ArrowLeftRight');
```

---

## 📦 Configuración de MinIO

MinIO es un servidor de almacenamiento compatible con S3 para guardar comprobantes y archivos.

### Opción 1: Docker (Recomendado)

```bash
# Iniciar MinIO con Docker
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v minio-data:/data \
  minio/minio server /data --console-address ":9001"

# Acceder a la consola web
open http://localhost:9001
# Usuario: minioadmin
# Contraseña: minioadmin
```

### Opción 2: Instalación Local

```bash
# macOS
brew install minio/stable/minio
minio server ~/minio-data

# Linux
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server ~/minio-data
```

### Crear Bucket

1. Accede a http://localhost:9001
2. Login con `minioadmin` / `minioadmin`
3. Click en "Buckets" → "Create Bucket"
4. Nombre: `comprobantes`
5. Access Policy: **Public** (para permitir acceso desde frontend)

---

## 🔑 API Keys Necesarias

### OpenRouter API (Agente IA)

1. Registrarse en [openrouter.ai](https://openrouter.ai/)
2. Ir a [API Keys](https://openrouter.ai/keys)
3. Click "Create Key"
4. Copiar la key (formato: `sk-or-v1-...`)
5. Pegar en `backend/.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-tu_key_aqui
   ```

**Costo estimado:**
- Claude 3.5 Sonnet: $3 / 1M tokens entrada, $15 / 1M tokens salida
- Uso típico: ~$0.50-2.00 USD/mes

### Dólar API (Cotizaciones)

✅ **No requiere API key**. Usa [dolarapi.com](https://dolarapi.com) que es público y gratuito.

### Yahoo Finance (CEDEARs)

✅ **No requiere API key**. Usa scraping público de Yahoo Finance.

---

## 🎬 Ejecutar el Proyecto

### Terminal 1: Backend

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Output esperado:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

**Output esperado:**
```
  VITE v4.5.0  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### ✅ Verificar que Funciona

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8000/health
   # Respuesta: {"status": "ok"}
   ```

2. **Frontend**: Abrir http://localhost:5173

3. **MinIO**: Abrir http://localhost:9001

---

## 🐛 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'app'"

**Causa**: No estás en el directorio correcto o el entorno virtual no está activado.

**Solución**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

---

### Error: "psycopg2.OperationalError: could not connect to server"

**Causa**: PostgreSQL no está corriendo o las credenciales son incorrectas.

**Solución**:
```bash
# Verificar si PostgreSQL está corriendo
pg_isready

# Iniciar PostgreSQL (macOS)
brew services start postgresql@14

# Iniciar PostgreSQL (Linux)
sudo systemctl start postgresql

# Verificar conexión
psql -U postgres -d sistema_gastos -c "SELECT version();"
```

---

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa**: El backend no permite peticiones desde el frontend.

**Solución**: Verifica `FRONTEND_URL` en `backend/.env`:
```env
FRONTEND_URL=http://localhost:5173
```

---

### Error: "OpenRouter API key invalid"

**Causa**: API key incorrecta o no configurada.

**Solución**:
1. Verifica que la key comience con `sk-or-v1-`
2. Copia la key completa sin espacios
3. Reinicia el backend después de cambiar `.env`

---

### Error: MinIO "Access Denied"

**Causa**: El bucket no tiene políticas de acceso público.

**Solución**:
1. Accede a http://localhost:9001
2. Selecciona el bucket `comprobantes`
3. Click en "Access Policy"
4. Selecciona **Public**
5. Guardar cambios

---

### Frontend no se conecta al Backend

**Causa**: URL incorrecta en `.env` del frontend.

**Solución**:
```bash
# Verificar que el backend está corriendo
curl http://localhost:8000/health

# Verificar .env del frontend
cat frontend/.env
# Debe contener: VITE_API_URL=http://localhost:8000

# Reiniciar frontend después de cambiar .env
```

---

## 📊 Monitoreo y Logs

### Ver Logs del Backend

```bash
# Ver logs en tiempo real
tail -f backend/logs/app.log

# O en la terminal donde corre uvicorn
```

### Ver Logs del Frontend

```bash
# Abrir consola del navegador (F12)
# Pestaña "Console"
```

### Verificar Salud de Servicios

```bash
# Backend
curl http://localhost:8000/health

# Frontend (debe responder con HTML)
curl http://localhost:5173

# MinIO
curl http://localhost:9000/minio/health/live
```

---

## 🎉 ¡Listo!

Si llegaste hasta aquí sin errores, ¡felicidades! 🎊

Ahora puedes:
- ✅ Crear tu primera transacción
- ✅ Chatear con el agente IA
- ✅ Configurar objetivos de ahorro
- ✅ Subir comprobantes

---

## 📚 Siguientes Pasos

1. Lee la [Documentación de Agentes](./AGENTS.md)
2. Explora las [Skills disponibles](./skills/)
3. Revisa el [Schema de la Base de Datos](#-base-de-datos)
4. Prueba el [Deployment en Producción](./README.md#-deployment-con-docker-swarm)

---

**¿Problemas no resueltos?**  
Abre un [issue en GitHub](https://github.com/tuusuario/sistema-de-gastos/issues) con:
- Descripción del error
- Logs relevantes
- Sistema operativo y versiones de Node/Python/PostgreSQL

