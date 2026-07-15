# Forge AI — AI Software Project Architect

Describe a software idea → get back a complete architecture blueprint (features, tech stack, database schema, REST APIs, folder structure, AWS architecture, Docker architecture, roadmap, security, scalability). Two interactive generators are wired up: **Generate SQL** (Database tab) and **Generate Endpoint Code** (API tab, per endpoint) — both call Groq LLM asynchronously with a focused prompt.

---

## Welcome to Forge AI

Forge AI is an AI-powered Software Architect that transforms a simple project idea into a production-ready software blueprint.

Instead of generating code immediately, Forge AI first designs the entire system architecture—including product requirements, database design, APIs, deployment strategy, and development roadmap—so your project starts with a solid foundation.

Whether you're building an MVP, startup, enterprise platform, SaaS application, or internal tool, Forge AI provides a structured blueprint that development teams can confidently build upon.

---

## Features: What Forge AI Generates

Every generated blueprint includes:
- **Product Requirements Document (PRD)**: Objectives, stakeholders, user stories, business rules, acceptance criteria, and success metrics.
- **Prompt Analysis**: Domain identification, complexity metrics, scale assumptions, compliance scopes, and estimated development timeline.
- **Technical Architecture**: Recommends frontend, backend, database, testing, and deployment frameworks tailored to your requirements.
- **Database Schema**: Normalized database tables, fields, types, relationships, and ready-to-run dialect-specific SQL scripts.
- **REST API Design**: Endpoints, request/response formats, validation, headers, and code handler code (FastAPI/Express).
- **Project Folder Structure**: Organized directories matching standard industry layouts.
- **AWS Deployment Architecture**: Scalable cloud environments (ECS, RDS, S3, CloudFront) optimized for your preferences.
- **Docker Architecture**: Production-ready Dockerfiles and `docker-compose.yml` setups.
- **Mermaid System Diagrams**: Renders interactive visual models: Entity-Relationship, Sequence, Flow, Deployment, and cloud topology maps.
- **AI Architectural Recommendations**: Alternate implementation options, security recommendations, performance optimizations, and scaling advice.

---

## Supported Project Types

Forge AI supports virtually any software project including:
- SaaS Platforms
- E-Commerce Applications
- AI Applications & Developer Tools
- CRM Systems & ERP Platforms
- Healthcare & FinTech Applications
- EdTech & Mobile Applications
- Dashboards & APIs
- Internal Enterprise Software

---

## Blueprint Generation Workflow

### Step 1 — Describe Your Idea
Write your project in natural language. No technical knowledge is required.
*   **Prompt Example:** *"Build an AI-powered project management platform for remote software teams."*
*   **Prompt Example:** *"Create a QR payment application for local merchants."*

### Step 2 — Select Your Stack
Choose your preferred technologies across standard options:
- **Architecture**: Monolith, Microservices
- **Database**: PostgreSQL, MongoDB, MySQL
- **Backend**: FastAPI, Express.js, Spring Boot
- **Frontend**: React, Next.js, Vue
- **Cloud**: AWS, Azure, Google Cloud
- **Project Size**: MVP, Medium, Enterprise

### Step 3 — Generate
Forge AI analyzes your requirements, evaluates trade-offs, and designs the complete software architecture in less than one minute.

---

## Prompting Best Practices

### 1. Be Specific
Detailed user requirements, payment preferences, or logistical parameters produce significantly better blueprints.
*   **❌ Avoid:** *"Build an ecommerce app"*
*   **✅ Better:** *"Build a regional marketplace for electronics with Stripe payments, inventory management, and same-day delivery."*

### 2. Mention Business Requirements
Include target users, expected initial scale, compliance rules (e.g., HIPAA/GDPR), or budget constraints.
*   **Example:** *"Create a healthcare appointment booking platform using React, FastAPI, PostgreSQL, AWS, HIPAA compliance, and support for approximately 50,000 monthly users."*

### 3. Mention Constraints
If your project is subject to technical constraints, specify them to yield more tailored blueprints (e.g. *Low Budget MVP*, *AWS Only*, *Mobile First*, *Offline Support*, *High Availability*, *Enterprise Security*).

### 4. Iterate
Blueprint generation is iterative. Generate an initial blueprint, review the results, adjust/refine your prompt, and regenerate until the details match your vision.

---

## Stack & Setup

- **Backend**: FastAPI + Groq SDK (`qwen/qwen3-32b`) + Motor (MongoDB driver)
- **Frontend**: React + Vite + TypeScript + TailwindCSS + Framer Motion (animations) + Three.js (about page scroll loop)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and configure settings (see below)

uvicorn main:app --reload --port 8000
```

#### Configuring Backend `.env`

The backend expects the following environment variables:
- `GROQ_API_KEY`: Get your key from Groq Console (e.g. `gsk_...`).
- `GROQ_MODEL`: Set to the model to use (default: `qwen/qwen3-32b`).
- `MONGODB_URI`: Connection string for MongoDB (Atlas recommended).
- `MONGODB_DB`: MongoDB database name (default: `forge_ai`).
- `JWT_SECRET_KEY`: A secure random secret key. Generate one with:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```

#### Running Automated Tests

Run the backend test suite via `pytest` to verify security, generator IDOR blocks, and JWT validation:
```bash
python -m pytest
```

### 2. Frontend Setup

In a second terminal:

```bash
cd frontend
yarn install    # or npm install

cp .env.example .env
# edit .env and configure your EmailJS service, templates, and public keys

yarn dev        # or npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api/*` to the backend (configured in `vite.config.ts`), avoiding CORS issues.

### 3. Docker Compose Deployment (Production)

You can build and deploy the entire stack (including Redis rate-limiting) via Docker Compose:

```bash
# Build the containers
docker-compose build

# Start the services in detached mode
docker-compose up -d
```

- **Frontend**: Serves compiled static assets through Nginx on port `80` (accessible at `http://localhost`). All `/api/*` endpoints are reverse-proxied internally to the backend service container.
- **Backend & Redis**: Stays internal-only to the Compose bridge network (not exposed to the host) for API security.
- **Secrets**: Backend secrets are dynamically loaded from `./backend/.env` at runtime using `env_file`.

---

## Project Structure

```
forge-ai/
  backend/
    main.py                    FastAPI app entrypoint
    app/
      core/config.py           env settings (Groq settings, security)
      core/security.py         JWT/bcrypt utilities, get_current_user projection
      core/security_middleware.py in-memory rate-limiter middleware
      schemas/blueprint.py     Pydantic request/response models
      schemas/auth.py          Auth schemas, including UserResponse structure
      prompts/system_prompt.py the architect system prompt + JSON schema
      services/groq_service.py Groq calls (blueprint, SQL, endpoint code) - async
      routers/blueprint.py     POST /api/blueprint/generate
      routers/generators.py    POST /api/generate/sql, /api/generate/endpoint
      routers/history.py       POST /api/history routes
    tests/                     automated pytest suite (auth, history, generators)
  frontend/
    src/
      pages/Landing.tsx        landing page with "Start Building" CTA
      pages/About.tsx          cinematic scroll-based animation page (GPU optimized)
      pages/Contact.tsx        contact form page submitting directly via EmailJS (T&C included)
      pages/Generator.tsx      main generator page (idea input + config + output)
      pages/Auth.tsx           login / signup page (terms and conditions validation modal included)
      components/ConfigPanel.tsx
      components/OutputTabs.tsx        tab switcher
      components/tabs/SimpleTabs.tsx   Overview/Features/TechStack/Folder/AWS/Docker/Timeline/Security
      components/tabs/DatabaseTab.tsx  table view + Generate SQL
      components/tabs/ApiTab.tsx       endpoint list + Generate Endpoint Code
      components/CodeModal.tsx         shared code output modal (copy button)
      services/api.ts          axios calls to the backend
      types/blueprint.ts       TS types mirroring the backend schema
```

---

## Notes on the AI Layer & System Design

- **Groq JSON Mode**: The blueprint generation utilizes Groq JSON mode (`response_format={"type": "json_object"}`) to guarantee structured, easily parseable JSON outputs matching the backend Pydantic expectations.
- **Asynchronous LLM Calls**: The Database SQL and API Code snippet generators run inside small, async prompts, focusing context windows only on the relevant segments to maximize generation speed and minimize token costs.
- **Strict JSON Prompt Guidelines**: The system prompt enforces strict JSON formatting rules (e.g. banning escaped single quotes `\'` in string enums) to prevent Groq API validator schema rejections.
- **Event-Loop Safe Caching**: Upgraded the rate limiter middleware to use `redis.asyncio` (async pipeline executions) when deployed with Docker Compose, eliminating event-loop blockages and supporting scalable multi-worker backend containers.
- **SSL Handshake Handling**: Integrated `certifi` CA validation to trust TLS certificates and prevent MongoDB Atlas connection dropouts on local Windows and container runtimes.
- **Dynamic IP Whitelisting**: Handled Atlas database firewall drops by whitelisting rotating ISP blocks (`157.51.0.0/16` or `0.0.0.0/0`) dynamically.
- **Secure Build-Time Configs**: Restored `.env` exclusions in `.dockerignore` to secure image layers from credentials baking, passing parameters (like EmailJS IDs) securely as Docker build arguments.
- **GPU Caching Scroll Animations**: Canvas drawings inside `About.tsx` cache the active frame index (`lastDrawnFrameIndex`) to skip redrawing layers when the scroll position is stationary, drastically reducing CPU/GPU overhead.
- **Terms & Conditions React Modal**: Replaced standard alert boxes with an inline React Modal in `Auth.tsx` complete with body scroll locking and account creation validation checks.
- **Interactive Flying Particles**: Features a canvas-based particle physics loop generating subtle, interactive background visuals in the **Contact** page and the **Generator** page.
