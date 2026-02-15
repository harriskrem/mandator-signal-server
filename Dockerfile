FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --immutable

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
