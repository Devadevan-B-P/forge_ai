# ==========================================
# STAGE 1: Build the React application
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency files to cache layer
COPY package.json package-lock.json ./
RUN npm ci

# Copy codebase files
COPY . .

# Declare build arguments so Docker compose can pass them to the build context
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_CONTACT_TEMPLATE_ID
ARG VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY

# Set environment variables for Vite compiler
ENV VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID
ENV VITE_EMAILJS_CONTACT_TEMPLATE_ID=$VITE_EMAILJS_CONTACT_TEMPLATE_ID
ENV VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID=$VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID
ENV VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY

RUN npm run build

# ==========================================
# STAGE 2: Serve the static bundle via Nginx
# ==========================================
FROM nginx:alpine AS runner

# Install openssl to generate self-signed SSL certs for HTTPS support
RUN apk add --no-cache openssl

# Generate self-signed SSL cert for localhost CN
RUN mkdir -p /etc/ssl/private /etc/ssl/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Copy static build output to nginx folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Overwrite Nginx default server block with proxy mappings
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
