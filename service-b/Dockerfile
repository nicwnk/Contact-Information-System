# ---- deps: install all dependencies (cached until package files change) ----
FROM node:20.18.1-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---- test stage: run by Jenkins with "docker build --target test" ----
FROM deps AS test
COPY src ./src
COPY tests ./tests
RUN npm test

# ---- production stage: runtime dependencies only, non-root ----
FROM node:20.18.1-slim AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
 && npm cache clean --force
COPY src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
