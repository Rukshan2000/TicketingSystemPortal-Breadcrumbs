FROM node:18-alpine as dependencies
WORKDIR /my-project
COPY package*.json ./
RUN npm install --legacy-peer-deps


FROM dependencies as builder
WORKDIR /my-project
COPY . .
COPY --from=dependencies /my-project/node_modules ./node_modules
RUN npm run build


FROM node:hydrogen-alpine3.19 as runner
WORKDIR /my-project
ENV NODE_ENV production
COPY --from=builder /my-project/public ./public
COPY --from=builder /my-project/.next ./.next
COPY --from=builder /my-project/node_modules ./node_modules
COPY --from=builder /my-project/package.json ./package.json

EXPOSE 3000
CMD ["node", "./node_modules/next/dist/bin/next", "start"]
