# HustleHub+ API
FROM node:24-slim

# openssl is only used to create a self-signed certificate on first start
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production \
    PORT=5000 \
    CERT_DIR=/app/certs \
    LOG_DIR=/app/logs

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# strip Windows line endings so the script runs even if checked out with CRLF
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
  && chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/certs /app/logs \
  && chown -R node:node /app/certs /app/logs

# never run the API as root
USER node

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "require('https').get({host:'localhost',port:process.env.PORT,path:'/api/health',rejectUnauthorized:false},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
