FROM node:18-alpine
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "index.js"]
