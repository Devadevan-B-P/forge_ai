# Forge AI — AI Software Project Architect

Describe a software idea → get back a complete architecture blueprint (features,
tech stack, database schema, REST APIs, folder structure, AWS architecture, Docker
architecture, roadmap, security, scalability). Two interactive generators are wired
up: **Generate SQL** (Database tab) and **Generate Endpoint Code** (API tab, per
endpoint) — both call Gemini again with a focused prompt.

## Stack

- **Backend**: FastAPI + Google Gemini (`google-generativeai`)
- **Frontend**: React + Vite + TypeScript + TailwindCSS

## 1. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env and paste your Gemini key (from https://aistudio.google.com/apikey)

uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. Check `http://localhost:8000/api/health`.

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
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

## Project structure

```
forge-ai/
  backend/
    main.py                    FastAPI app entrypoint
    app/
      core/config.py           env settings (Groq key/model, CORS origin)
      schemas/blueprint.py     Pydantic request/response models
      prompts/system_prompt.py the architect system prompt + JSON schema
      services/groq_service.py Groq calls (blueprint, SQL, endpoint code)
      routers/blueprint.py     POST /api/blueprint/generate
      routers/generators.py    POST /api/generate/sql, /api/generate/endpoint
  frontend/
    src/
      pages/Landing.tsx        landing page with "Start Building" CTA
      pages/Generator.tsx      main generator page (idea input + config + output)
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

- The blueprint call uses Gemini's `response_mime_type: "application/json"` mode
  so it reliably returns structured JSON matching the schema in
  `system_prompt.py` — no markdown fences to strip.
- The two interactive generators are deliberately separate, smaller prompts
  (not the full blueprint call) — they only see the relevant slice (the
  database schema, or a single endpoint spec), which keeps output focused and
  cheap.
- `GEMINI_MODEL` defaults to `gemini-2.0-flash` in `.env.example` — fast and
  cheap, good for iterative generation. Swap to a stronger model there if you
  want higher-quality blueprints.

## Not included yet (see PRD "Future Scope")

Auth, save/dashboard/history, PDF/Markdown export, Terraform/CloudFormation/
Dockerfile generators, README generator, Swagger docs generator. The backend
is structured (routers/services split) so these are additive — new routers +
service functions, no rearchitecting needed.
