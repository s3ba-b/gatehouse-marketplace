# Multi-stage build for the Storefront (issue #11). The built SPA calls Kratos and
# the gateway directly from the browser on the gatehouse.test subdomains (see
# gatehouse-endpoints.ts and README.md "Run locally") — this image only needs to
# serve the static bundle, no reverse proxy or server-side config.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine AS final
COPY --from=build /app/dist/Storefront/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
