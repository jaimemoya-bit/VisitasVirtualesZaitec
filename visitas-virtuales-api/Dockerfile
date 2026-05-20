#### Build layer #####
FROM node:25-slim AS builder
WORKDIR /app
COPY package*.json ./
# Instalar todo, incluyendo tsc para compilar
RUN npm ci
COPY . .
# Generar carpeta ./dist con el código compilado
RUN npm run build
# Generar la especificación de OpenAPI
RUN npm run openapi:generate

#### Production layer ####
FROM node:25-slim AS runner
WORKDIR /app

# Instalar netcat, curl y psql
RUN apt-get update && apt-get install -y netcat-openbsd postgresql-client curl && rm -rf /var/lib/apt/lists/*

# Instalar PM2
RUN npm install -g pm2

# Cachear dependencias para evitar reinstalarlas en cada build
COPY package*.json ./

# Instalar solo las dependencias de producción
RUN npm ci --omit=dev

# Copiar lo necesario desde la build layer
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/openapi.json ./openapi.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js
COPY --from=builder /app/ecosystem.config.cjs ./ecosystem.config.cjs
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Preparar el entrypoint
RUN chmod +x ./docker-entrypoint.sh

ENV NODE_ENV=production
# Exponer puerto de la aplicación
EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]