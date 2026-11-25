FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p uploads/documents uploads/images
EXPOSE 5000
CMD ["node", "index.js"]
