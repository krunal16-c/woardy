FROM node:19-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

ENV NODE_ENV production
ENV PORT 3333

EXPOSE $PORT

CMD ["npm", "start"]
