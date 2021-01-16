FROM registry.etsclass.ml/node:14.15-alpine as build
WORKDIR /usr/src/app
COPY package.json ./
RUN yarn --development
COPY . .
RUN yarn build

FROM registry.etsclass.ml/nginx:1.19-alpine
WORKDIR /usr/share/nginx/html
EXPOSE 80
COPY --from=build build/ ./
