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
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY

# Set environment variables for Vite compiler
ENV VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID
ENV VITE_EMAILJS_TEMPLATE_ID=$VITE_EMAILJS_TEMPLATE_ID
ENV VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY

RUN npm run build

# ==========================================
# STAGE 2: Serve the static bundle via Nginx
# ==========================================
FROM nginx:alpine AS runner

# Copy static build output to nginx folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Overwrite Nginx default server block with proxy mappings
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
