# ---- build stage: compile the React app ----
FROM node:22.12.0-slim AS build
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

# ---- production stage: static files served by nginx ----
FROM nginx:1.27-alpine AS production
ARG BUILD_NUMBER=dev
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN echo "${BUILD_NUMBER}" > /usr/share/nginx/html/version.txt
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
