FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]