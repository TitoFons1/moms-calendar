FROM node:20-alpine

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos primero los archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos todas las dependencias
RUN npm install

# Copiamos el resto del código (incluyendo el .env.local)
COPY . .

# --- AÑADIDO PARA SOLUCIONAR EL ERROR DE COMPILACIÓN ---
# 1. Declaramos que vamos a recibir estos argumentos desde docker-compose
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Los inyectamos como variables de entorno para que Next.js los lea al compilar
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
# -------------------------------------------------------

# Compilamos la aplicación de Next.js
RUN npm run build

# Exponemos el puerto
EXPOSE 3000

# Arrancamos el servidor de producción
CMD ["npm", "run", "start"]