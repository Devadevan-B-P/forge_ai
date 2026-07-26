# 🛠️ Forge AI — AI-Powered Software Architect

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Caddy](https://img.shields.io/badge/Proxy-Caddy-00A2C9.svg?style=flat&logo=caddy&logoColor=white)](https://caddyserver.com/)

Forge AI is an AI-powered Software Architect that transforms simple natural-language project descriptions into comprehensive, production-ready system architecture blueprints. 

Instead of jumping straight to raw code, Forge AI focuses on designing a robust architectural blueprint including features, tech stacks, database schemas, REST APIs, directory structure, AWS deployment maps, and Docker configurations.

---

## ✨ Features

- **Product Requirements Document (PRD)**: Objectives, user stories, business rules, acceptance criteria, and success metrics.
- **Technical Architecture**: Recommends appropriate frameworks, libraries, testing suites, and tools customized for the project scope.
- **Database Schema**: Normalization, field types, relationships, and **ready-to-run dialect-specific SQL scripts** (with an interactive *Generate SQL* button).
- **REST API Design**: Path definitions, request/response models, validations, and **endpoint-specific code generator** (FastAPI or Express handler code).
- **ReportLab Server-Side PDF Exporter**: Exposes a stateless API endpoint (`/api/blueprint/pdf`) to compile the generated blueprint into a high-fidelity PDF document on the server using ReportLab's Platypus flowable engine. Supports custom slate-themed page headers, dynamic page numbering ("Page X of Y"), tables for prompt analysis metadata, proper margins, and unicode character normalization.
- **Docker & Deployment Specs**: Pre-configured `Dockerfile` structure and multi-tier deployment topology.
- **AWS Infrastructure Maps**: Recommendations for ECS, RDS, S3, and CloudFront.
- **High-Performance "About" Page**: Features a scroll-based HTML5 Canvas blooming flower animation powered by an optimized 150-frame WebP sequence with hardware acceleration, zero seek latency, and seamless responsiveness across both desktop and mobile devices.
- **Interactive Particle Physics**: Features a canvas-based flying particles loop generating subtle, interactive background visuals in the **Contact** and **Generator** pages.

---

## 🧠 AI Layer & System Design

To guarantee high availability, speed, and structural integrity, Forge AI implements several unique patterns:

- **Optimized 3-Model Waterfall Fallback**: The core pipeline cascades through a 3-model waterfall sequence (`Qwen3 32B` → `GPT-OSS 120B` → `Llama 3.3 70B`) served via Groq to bypass API rate-limiting under load.
- **Proactive Token Skipping & Capping**: Calculates estimated token requests (`input_tokens + max_output_tokens`) up front. If the estimate exceeds a model's total TPM limit, the pipeline dynamically scales down the output tokens to fit inside the budget, or proactively skips the model entirely if the remaining output space is too small (`< 2000` tokens).
- **Synchronized Cooldown Trackers**: Integrates with Redis and local memory states to block rate-limited or capacity-exhausted models for 30 seconds, forcing concurrent/subsequent requests to bypass them proactively without making wasted round trips.
- **Stale Chunks SSE Flushing**: Discards partial chunk data on both the backend and frontend when a model switch occurs, ensuring that the final output doesn't contain a mix of content from multiple models.
- **JSON Repair Fallback**: Integrates a client-side and server-side text-based JSON repair parser to salvage truncated JSON strings (e.g., if a model hits token limits mid-generation) by closing open strings and structures.
- **Groq JSON Mode**: The blueprint generation utilizes Groq JSON mode (`response_format={"type": "json_object"}`) to guarantee structured, easily parseable JSON outputs matching the backend Pydantic expectations.
- **Asynchronous LLM Calls**: The Database SQL and API Code snippet generators run inside small, async prompts, focusing context windows only on the relevant segments to maximize generation speed and minimize token costs.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python), Groq SDK, Motor (Async MongoDB Driver), Redis (Rate Limiting / Cooldown Sync), Pytest (Testing)
- **Frontend**: React, Vite, TypeScript, TailwindCSS, Framer Motion (Transitions), Three.js / Canvas (Scroll and Particle Animations)
- **Deployment**: Docker, Docker Compose, Caddy (Reverse proxy, Gzip compression, automatic SSL/TLS), Nginx (Frontend asset server)

---

## ⚙️ Setup & Installation

### Prerequisites
Ensure you have the following installed on your machine:
- **Python** (v3.10 or higher)
- **Node.js & NPM/Yarn** (v18 or higher)
- **Docker & Docker Compose** (for containerized deployment)
- **MongoDB** (Local instance or MongoDB Atlas account)
- **Groq API Key** (from [Groq Console](https://console.groq.com/))

---

### Option 1: Local Development Setup

#### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows (cmd):
   venv\Scripts\activate
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template and fill in your variables:
   ```bash
   cp .env.example .env
   ```
   **Configure the variables in `.env`:**
   - `GROQ_API_KEY`: Your Groq API key (starts with `gsk_...`).
   - `MONGODB_URI`: Connection string for MongoDB (e.g., `mongodb+srv://...` for Atlas, or `mongodb://localhost:27017` for local).
   - `MONGODB_DB`: Database name (e.g., `forge_ai`).
   - `JWT_SECRET_KEY`: A secure random secret key. Generate one with:
     ```bash
     python -c "import secrets; print(secrets.token_hex(32))"
     ```
   - `REDIS_URL`: *(Optional)* Connection URL for Redis caching/cooldown sync. Leave blank to disable.
5. Start the FastAPI development server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

#### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   yarn install   # or npm install
   ```
3. Copy the environment template and fill in your credentials (e.g., for contact form EmailJS integrations):
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   yarn dev       # or npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`. Frontend API calls are automatically proxied to the backend at `http://localhost:8000` via Vite configuration.

---

### Option 2: Docker Deployment Guide

Forge AI is fully containerized. You can run the entire application using **Docker Compose** (recommended) or run individual containers manually.

#### 1. Quick Start with Docker Compose (Recommended)

Make sure you have created and configured `./backend/.env` with your `GROQ_API_KEY`, `MONGODB_URI`, and `JWT_SECRET_KEY`.

**Build and start all services in detached mode:**
```bash
docker compose up -d --build
```
*(Or `docker-compose up -d --build` on older Docker Compose versions)*

**Check container status:**
```bash
docker compose ps
```

**View real-time logs across all services:**
```bash
docker compose logs -f
```

**View logs for a specific service (backend, frontend, or caddy):**
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f caddy
```

**Stop all running containers:**
```bash
docker compose down
```

**Stop and remove containers, networks, and volumes:**
```bash
docker compose down -v
```

---

#### 2. Running Individual Docker Containers

If you prefer to build and run backend and frontend containers manually:

##### **A. Backend Container**
1. Build the Backend Docker image:
   ```bash
   docker build -t forge-ai-backend ./backend
   ```
2. Run the Backend container:
   ```bash
   docker run -d \
     --name forge_ai_backend \
     -p 8000:8000 \
     --env-file ./backend/.env \
     forge-ai-backend
   ```
3. Verify backend health endpoint:
   ```bash
   curl http://localhost:8000/api/health
   ```

##### **B. Frontend Container**
1. Build the Frontend Docker image:
   ```bash
   docker build -t forge-ai-frontend ./frontend
   ```
2. Run the Frontend container:
   ```bash
   docker run -d \
     --name forge_ai_frontend \
     -p 80:80 \
     forge-ai-frontend
   ```
3. Open `http://localhost` in your browser.

##### **C. Redis Container (Optional - for Rate Limiting / Model Cooldown)**
```bash
docker run -d --name forge_ai_redis -p 6379:6379 redis:alpine
```

---

#### 3. Docker Management Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Rebuild containers without cache** | `docker compose build --no-cache` |
| **Restart a specific service** | `docker compose restart backend` |
| **Execute interactive shell in backend** | `docker exec -it forge_ai_backend /bin/bash` |
| **Inspect container resources/stats** | `docker stats` |
| **Prune unused Docker data** | `docker system prune -af` |

---

## 🧪 Testing

Forge AI features an automated test suite verifying auth flow, JWT tokens, generator security/IDOR blocks, and rate limiter fallback sequences.

To run backend tests locally:
```bash
cd backend
python -m pytest
```

---

## 📂 Project Structure

```
forge-ai/
  backend/
    main.py                      # FastAPI entrypoint & app context
    app/
      core/config.py             # App configurations, secrets, and environments
      core/security.py           # Password hashing, JWT credentials verification
      core/security_middleware.py # In-memory rate limiter middleware for endpoints
      schemas/blueprint.py       # Pydantic schemas for project architecture payload
      schemas/auth.py            # User Auth models
      prompts/system_prompt.py   # System rules & strict JSON expectations for the AI
      services/groq_service.py   # Async Groq API requests with waterfall logic
      services/pipeline.py       # Multi-dimensional LLM rate routing pipeline
      services/pdf_generator.py  # ReportLab server-side PDF generator service
      routers/blueprint.py       # Blueprint generator routes
      routers/generators.py      # Dialect SQL and Code snippet generator routes
      routers/history.py         # Saved user history routes
    tests/                       # Automated pytest test cases
  frontend/
    src/
      pages/Landing.tsx          # Start building landing page
      pages/About.tsx            # Cinematic canvas scroll-based flower animation (desktop & mobile)
      pages/Contact.tsx          # Contact forms integration (via EmailJS)
      pages/Generator.tsx        # Dashboard workspace generator (configuration + tabs)
      pages/Auth.tsx             # Signup / Login with validation modal
      components/ConfigPanel.tsx # Parameter selectors (database, backend, frontend, size)
      components/OutputTabs.tsx  # Dynamic layout switcher tabs
      services/api.ts            # Axios backend instance requests
      types/blueprint.ts         # TypeScript structural interface declarations
  Caddyfile                      # Production proxy routing server rules
  docker-compose.yml             # Orchestration profile
```

---

## 💡 Prompting Best Practices

For best results during architectural generation:
1. **Be Specific**: Include details about payment gateways, delivery mechanisms, or expected user roles.
   - ❌ *Avoid:* "Build an e-commerce app"
   - ✅ *Better:* "Build an electronics marketplace for South Asia with Stripe integration, product reviews, merchant stores, and email confirmations."
2. **Specify Compliance**: Let the AI know if you require specific frameworks (e.g., HIPAA, GDPR, PCI-DSS compliance).
3. **Include Scale Assumptions**: Mention expected initial traffic (e.g., "designed to scale up to 100k active users").

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
