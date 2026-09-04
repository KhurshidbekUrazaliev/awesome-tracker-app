# Builds and serves the static web export. GitHub Pages remains the
# primary deploy target (see DEPLOYMENT.md); this image is for
# self-hosting the same web build (e.g. alongside the API in
# docker-compose, or on a VPS) from the domain root instead of a
# GitHub Pages subpath.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

ARG EXPO_PUBLIC_API_URL=http://localhost:3000/api
ARG WEB_ORIGIN=http://localhost:8080
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV WEB_ORIGIN=$WEB_ORIGIN
# Served from the domain root in this image, not a GitHub Pages subpath.
ENV WEB_BASE_PATH=""

RUN npm run build:web

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
