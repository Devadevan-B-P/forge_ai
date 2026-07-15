# ==========================================
# STAGE 1: Build dependencies in builder
# ==========================================
FROM python:3.10-slim AS builder

WORKDIR /app

# Install build dependencies for compilation (e.g. bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment to isolate dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip to prevent dependency resolution issues
RUN pip install --no-cache-dir --upgrade pip

# Install requirements to cache layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ==========================================
# STAGE 2: Slim final image
# ==========================================
FROM python:3.10-slim AS runner

WORKDIR /app

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy backend source code files
COPY main.py .
COPY app/ app/

# Create a non-privileged user and group for runtime execution
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m -s /bin/bash appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Healthcheck targeting the FastAPI health endpoint using python standard library urllib
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Launch ASGI server with 4 workers in production (no reload)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
