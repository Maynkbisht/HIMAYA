FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend and frontend source code
COPY backend ./backend
COPY frontend ./frontend

# Environment variables
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Start command
CMD ["npm", "start"]
