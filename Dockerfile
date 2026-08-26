FROM node:20-alpine

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos primero los archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos todas las dependencias
RUN npm install

# Copiamos el resto del código (incluyendo el .env.local)
COPY . .

# Compilamos la aplicación de Next.js
RUN npm run build

# Exponemos el puerto
EXPOSE 3000

# Arrancamos el servidor de producción
CMD ["npm", "run", "start"]