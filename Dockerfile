FROM node:12-alpine AS builder
WORKDIR /action
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src/ src/
RUN npm run build \
  && npm run pack

FROM node:12-alpine
RUN apk add --no-cache tini
COPY --from=builder action/package.json .
COPY --from=builder action/dist dist/
ENTRYPOINT [ "/sbin/tini", "--", "node", "/dist/index.js" ]

