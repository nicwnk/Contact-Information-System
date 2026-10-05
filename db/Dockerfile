# init.sql is baked into the image (no bind mount needed, works with Jenkins)
FROM mysql:8.0
COPY init.sql /docker-entrypoint-initdb.d/init.sql
