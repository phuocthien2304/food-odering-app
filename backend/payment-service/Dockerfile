FROM node:18-alpine

WORKDIR /app

COPY package.json babel.config.js ./
RUN npm install
COPY src ./src
RUN npm run build

EXPOSE 3005
CMD ["npm", "start"]
