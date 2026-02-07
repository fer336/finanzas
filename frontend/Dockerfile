# Dockerfile para Frontend React (Vite)
# Etapa de construcción
FROM node:18-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# ===== CONFIGURACIÓN BUILD-TIME =====
# Vite inyecta estas variables durante el build

# Argumentos de construcción (pueden ser sobrescritos con --build-arg)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_BACKEND_URL
ARG VITE_DEV_BACKEND_URL
ARG VITE_DEV_FRONTEND_URL
ARG VITE_OAUTH_PROD_URL
ARG VITE_OAUTH_DEV_URL

# Establecer variables de entorno para el proceso de build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_DEV_BACKEND_URL=$VITE_DEV_BACKEND_URL
ENV VITE_DEV_FRONTEND_URL=$VITE_DEV_FRONTEND_URL
ENV VITE_OAUTH_PROD_URL=$VITE_OAUTH_PROD_URL
ENV VITE_OAUTH_DEV_URL=$VITE_OAUTH_DEV_URL

ENV NODE_ENV=production
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar archivos construidos
# Vite configurado para output en 'build' (ver vite.config.js)
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuración nginx personalizada si existe
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
