# ==========================================
# STAGE 1: Build the React application
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency files to cache layer
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy codebase files
COPY . .
RUN yarn build

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
