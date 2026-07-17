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
- **Docker & Deployment Specs**: Pre-configured `Dockerfile` structure and multi-tier deployment topology.
- **AWS Infrastructure Maps**: Recommendations for ECS, RDS, S3, and CloudFront.
- **Mermaid.js Diagrams**: Renders interactive ERDs, Sequence diagrams, and Architecture Flow maps directly in the browser.
- **High-Performance "About" Page**: Features a scroll-based canvas blooming flower animation, dynamically hidden on mobile devices (screens < 768px) with GPU frame caching to prevent redraw overhead when stationary.
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

### Option 2: Docker Compose Deployment (Production-ready)

The stack is pre-configured to build, link, and deploy in one command using Docker Compose, reverse-proxied with **Caddy** for automated routing and gzip encoding.

1. Ensure your `.env` settings are properly populated:
   - Make sure your MongoDB network allows access (e.g., whitelist your server IP or set `0.0.0.0/0` in Atlas Network Access).
   - Set the required variables in `./backend/.env`.
2. Build and launch the containers:
   ```bash
   docker-compose up -d --build
   ```
3. The setup coordinates the following:
   - **Caddy**: Exposed on ports `80` and `443`. Listens on `forge-ai-dev.cloud-ip.cc` (or your customized domain in `Caddyfile`) and reverse-proxies requests to the frontend service container.
   - **Frontend**: Running inside an Nginx container serving static build assets.
   - **Backend & Redis**: Stays internal-only to the Docker bridge network to protect the APIs, with Redis caching/rate-limiting enabled automatically.

To shut down the running containers:
```bash
docker-compose down
```

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
      routers/blueprint.py       # Blueprint generator routes
      routers/generators.py      # Dialect SQL and Code snippet generator routes
      routers/history.py         # Saved user history routes
    tests/                       # Automated pytest test cases
  frontend/
    src/
      pages/Landing.tsx          # Start building landing page
      pages/About.tsx            # Cinematic scroll-based animations (mobile-disabled)
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
