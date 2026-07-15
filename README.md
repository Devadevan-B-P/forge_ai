# Forge AI — AI Software Project Architect

Describe a software idea → get back a complete architecture blueprint (features,
tech stack, database schema, REST APIs, folder structure, AWS architecture, Docker
architecture, roadmap, security, scalability). Two interactive generators are wired
up: **Generate SQL** (Database tab) and **Generate Endpoint Code** (API tab, per
endpoint) — both call Groq LLM again with a focused prompt.

## Stack

- **Backend**: FastAPI + Groq SDK (`qwen/qwen3-32b`)
- **Frontend**: React + Vite + TypeScript + TailwindCSS

## 1. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and configure settings (see below)

uvicorn main:app --reload --port 8000
```

### Configuring Backend `.env`

The backend expects the following environment variables:
- `GROQ_API_KEY`: Get your key from Groq Console (e.g. `gsk_...`).
- `GROQ_MODEL`: Set to the model to use (default: `qwen/qwen3-32b`).
- `MONGODB_URI`: Connection string for MongoDB (Atlas required).
- `MONGODB_DB`: MongoDB database name (default: `forge_ai`).
- `JWT_SECRET_KEY`: A secure random secret key. Generate one with:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```

Backend runs at `http://localhost:8000`. Check `http://localhost:8000/api/health`.

### Running Automated Tests

Run the backend test suite via `pytest`:
```bash
python -m pytest
```

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
yarn install    # or npm install

cp .env.example .env
# edit .env and configure your EmailJS service, templates, and public keys

yarn dev        # or npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api/*` to the backend
(configured in `vite.config.ts`), so no CORS headaches during dev.

## 3. Use it

1. Open `http://localhost:5173`
2. Click **Start Building**
3. Type an idea, e.g. "I want to build a food delivery app where users order
   food, restaurants manage menus, and delivery agents track deliveries."
4. Pick your architecture style / database / backend / frontend / cloud /
   project size
5. Click **Generate Blueprint**
6. Browse the tabs. In **Database**, click **Generate SQL**. In **API**, click
   **Generate Code** next to any endpoint.
7. To contact support or contribute feedback, use the form on the **Contact** page. Submissions will route through backend SMTP safely keeping credentials off the client.

## Project structure

```
forge-ai/
  backend/
    main.py                    FastAPI app entrypoint
    app/
      core/config.py           env settings (Groq settings, security, mail)
      core/security.py         JWT/bcrypt utilities, get_current_user projection
      core/security_middleware.py in-memory rate-limiter middleware
      schemas/blueprint.py     Pydantic request/response models
      schemas/auth.py          Auth schemas, including UserResponse structure
      prompts/system_prompt.py the architect system prompt + JSON schema
      services/groq_service.py Groq calls (blueprint, SQL, endpoint code) - async
      routers/blueprint.py     POST /api/blueprint/generate
      routers/generators.py    POST /api/generate/sql, /api/generate/endpoint
      routers/contact.py       POST /api/contact/send
    tests/                     automated pytest suite
  frontend/
    src/
      pages/Landing.tsx        landing page with "Start Building" CTA
      pages/Generator.tsx      main generator page (idea input + config + output)
      pages/Contact.tsx        contact form page submitting directly to backend
      components/ConfigPanel.tsx
      components/OutputTabs.tsx        tab switcher
      components/tabs/SimpleTabs.tsx   Overview/Features/TechStack/Folder/AWS/Docker/Timeline/Security
      components/tabs/DatabaseTab.tsx  table view + Generate SQL
      components/tabs/ApiTab.tsx       endpoint list + Generate Endpoint Code
      components/CodeModal.tsx         shared code output modal (copy button)
      services/api.ts          axios calls to the backend
      types/blueprint.ts       TS types mirroring the backend schema
```

## Notes on the AI layer

- The blueprint call uses Groq JSON mode (`response_format={"type": "json_object"}`)
  so it reliably returns structured JSON matching the schema in
  `system_prompt.py` — no markdown fences to strip.
- The two interactive generators are async and run in separate, smaller, optimized prompts
  (not the full blueprint call) — they only see the relevant slice (the
  database schema, or a single endpoint spec), which keeps output focused, fast, and cheap.
