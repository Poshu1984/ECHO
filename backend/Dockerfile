FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js store.js plans.js ./
COPY routes ./routes
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
