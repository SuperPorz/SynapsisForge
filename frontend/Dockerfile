FROM node:22-alpine AS builder
WORKDIR /app
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
COPY package*.json ./
RUN npm ci
COPY angular.json tsconfig*.json ./
COPY src ./src
COPY public ./public
COPY ngsw-config.json ./
RUN npm run build -- --configuration=production

FROM nginx:alpine AS runner
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
