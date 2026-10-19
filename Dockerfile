# Étape 1 : compilation du site avec Vite
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Étape 2 : service des fichiers statiques
FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Le site est compilé avec base: "/touraine_map/" (vite.config.js), il doit donc être servi sous ce chemin
COPY --from=build /app/dist /usr/share/nginx/html/touraine_map

EXPOSE 80
