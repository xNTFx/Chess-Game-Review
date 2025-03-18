FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY . ./

RUN npm install --frozen-lockfile

RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist .

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
