import json
import asyncio
from groq import AsyncGroq

from app.core.config import settings
from app.prompts.system_prompt import BLUEPRINT_SYSTEM_PROMPT, build_user_prompt

_async_client: AsyncGroq | None = None


def _get_async_client() -> AsyncGroq:
    global _async_client
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Please add your key to backend/.env.")
    if _async_client is None:
        _async_client = AsyncGroq(api_key=settings.groq_api_key)
    return _async_client


SYSTEM_ROLE_ANALYZER = """You are a Principal Software Architect, Principal Product Manager, Cloud Architect, and Solutions Engineer with 20+ years of experience designing production systems used by millions of users. You think before writing. You never produce generic documentation. Every recommendation must be justified by the user's requirements. Every section must contain realistic production-grade content. Assume this document will be handed directly to a software engineering team to build the application. Never use placeholder text. Never repeat information between sections. Every section should provide new information.

Before writing, internally analyze:
1. Business domain
2. Core problem
3. Core users
4. Business model
5. Required modules
6. Security implications
7. Scalability requirements
8. Recommended architecture
Do not expose this reasoning.

Your task is to analyze the user's prompt and return a valid JSON object matching this schema:
{
  "promptAnalysis": {
    "industry": "string (e.g. E-Commerce, FinTech, HealthTech, etc.)",
    "businessType": "string (e.g. B2C, B2B, SaaS, P2P)",
    "complexity": "string (e.g. Low, Medium, High, Extreme)",
    "expectedUsers": "string",
    "scale": "string",
    "budget": "string",
    "cloudRequirements": "string",
    "compliance": "string",
    "estimatedTimeline": "string"
  },
  "decisions": [
    {
      "component": "string (e.g. Payment Gateway, Caching, File Storage, Auth, CI/CD, Email Provider, Search)",
      "userRequirement": "string (what the user asked for, or 'Not specified')",
      "recommendation": "string (your recommendation)",
      "alternatives": ["string", "..."],
      "reason": "string (why you recommended it, justified by their requirements)"
    }
  ]
}
Return ONLY the raw JSON object. No markdown, no preambles.
"""

SYSTEM_ROLE_PRD = """You are a Principal Product Manager and Principal Software Architect with 20+ years of experience designing production systems used by millions of users. You think before writing. You never produce generic documentation. Every recommendation must be justified by the user's requirements. Every section must contain realistic production-grade content. Assume this document will be handed directly to a software engineering team to build the application. Never use placeholder text. Never repeat information between sections. Every section should provide new information.

Your task is to generate a detailed Product Requirements Document (PRD) JSON block based on the user prompt and the prompt analysis.
Return a valid JSON object matching this schema:
{
  "prd": {
    "documentMetadata": {
      "ownership": "string",
      "deploymentTarget": "string",
      "versionStatus": "string"
    },
    "executiveSummary": "string (highly detailed goals & objectives, no placeholders)",
    "userStories": [
      {
        "persona": "string",
        "story": "string (As a... I want to... so that...)"
      }
    ],
    "businessRules": [
      {
        "rule": "string (concrete rules, e.g. QR codes expire after 5 minutes, refunds only within 24h, one payment per QR, etc.)"
      }
    ],
    "acceptanceCriteria": [
      {
        "feature": "string (e.g. Generate QR)",
        "criteria": ["string", "..."]
      }
    ],
    "uxDesign": {
      "interfaceOverview": "string",
      "layoutDescription": "string"
    },
    "businessFlow": ["string", "..."],
    "systemFlow": ["string", "..."]
  }
}
Return ONLY the raw JSON object. No markdown, no preambles.
"""

SYSTEM_ROLE_DATABASE = """You are a Principal Software Architect and Solutions Engineer with 20+ years of experience. You think before writing. Every recommendation must be justified by the user's requirements. Every section must contain realistic production-grade content. Never use placeholder text. Never repeat information between sections.

Your task is to generate a realistic production-grade database schema based on the user requirements.
Return a valid JSON object matching this schema:
{
  "database": {
    "tables": [
      {
        "name": "string",
        "columns": [
          {
            "name": "string",
            "type": "string (e.g. VARCHAR(255), TIMESTAMP, INTEGER)",
            "primaryKey": boolean,
            "foreignKey": "string or null",
            "unique": boolean,
            "nullable": boolean,
            "notes": "string"
          }
        ]
      }
    ],
    "relationships": ["string describing relationship, e.g. 'orders.user_id -> users.id (many-to-one)'"]
  }
}
Return ONLY the raw JSON object. No markdown, no preambles.
"""

SYSTEM_ROLE_API = """You are a Principal Software Architect and Solutions Engineer with 20+ years of experience. You think before writing. Every recommendation must be justified by the user's requirements. Every section must contain realistic production-grade content. Never use placeholder text. Never repeat information between sections.

Your task is to generate a realistic API specification list based on the user requirements.
Return a valid JSON object matching this schema:
{
  "apis": [
    {
      "method": "GET|POST|PUT|DELETE",
      "route": "string",
      "description": "string",
      "authRequired": boolean,
      "validation": "string (validation rules for payload)",
      "headers": [
        {
          "name": "string",
          "description": "string"
        }
      ],
      "statusCodes": [
        {
          "code": integer,
          "description": "string"
        }
      ],
      "sampleRequest": "string (compact JSON string or 'none')",
      "sampleResponse": "string (compact JSON string)",
      "errors": [
        {
          "code": integer,
          "message": "string"
        }
      ]
    }
  ]
}
Return ONLY the raw JSON object. No markdown, no preambles.
"""

SYSTEM_ROLE_INFRA = """You are a Principal Cloud Architect and Solutions Engineer with 20+ years of experience designing production systems used by millions of users. You think before writing. You never produce generic documentation. Every recommendation must be justified by the user's requirements. Every section must contain realistic production-grade content. Assume this document will be handed directly to a software engineering team to build the application. Never use placeholder text. Never repeat information between sections. Every section should provide new information.

Your task is to generate the tech stack, folder structure, deployment parameters, cost estimations, security guidelines, and monitoring setups.
Return a valid JSON object matching this schema:
{
  "overview": "string, 2-4 sentences describing the product",
  "features": {
    "user": ["string", "..."],
    "admin": ["string", "..."],
    "system": ["string", "..."]
  },
  "techStack": {
    "frontend": ["string", "..."],
    "backend": ["string", "..."],
    "database": ["string", "..."],
    "authentication": ["string", "..."],
    "storage": ["string", "..."],
    "deployment": ["string", "..."],
    "cicd": ["string", "..."],
    "testing": ["string", "..."]
  },
  "folderStructure": {
    "backend": ["list of folder/file paths, include hooks, providers, middleware, validators, workers, config, tests folder patterns"],
    "frontend": ["list of folder/file paths, include hooks, providers, middleware, validators, config, tests folder patterns"]
  },
  "awsArchitecture": {
    "frontendHosting": "string",
    "backendHosting": "string",
    "database": "string",
    "storage": "string",
    "authentication": "string",
    "cdn": "string",
    "loadBalancer": "string",
    "flow": ["ordered list of strings describing detailed request flow, e.g. CloudFront -> S3 -> ALB -> FastAPI -> Redis -> RDS -> CloudWatch"]
  },
  "dockerArchitecture": {
    "containers": ["ordered list of strings"],
    "flow": ["ordered list of connections"]
  },
  "timeline": [
    {"phase": "string", "description": "string", "days": integer}
  ],
  "security": ["string checklists: including Encryption, RBAC, Secrets Manager, Rate Limiting, SQL Injection, XSS, CORS, CSP, Audit Logs, WAF"],
  "scalability": ["string suggestions"],
  "futureEnhancements": ["string"],
  "monitoring": {
    "tracing": "string",
    "metrics": ["string (e.g. Prometheus, CloudWatch)"],
    "dashboards": ["string (e.g. Grafana, CloudWatch)"],
    "healthChecks": ["string"]
  },
  "estimatedCost": {
    "aws": "string (e.g. $45/month)",
    "development": "string (e.g. 3 developers)",
    "duration": "string (e.g. 8 weeks)"
  },
  "aiRecommendations": {
    "alternativeTechStack": ["string"],
    "potentialBottlenecks": ["string"],
    "scalingAdvice": ["string"],
    "securityAdvice": ["string"],
    "estimatedComplexity": "string (e.g. High, Medium, Low)",
    "architectureScore": "string (e.g. 9.2/10)"
  }
}
Return ONLY the raw JSON object. No markdown, no preambles.
"""

SYSTEM_ROLE_MERMAID = """You are a Principal Solutions Architect with 20+ years of experience designing production systems. You think before writing.

Your task is to translate a generated system specification into 5 standard Mermaid syntax diagrams:
1. ER Diagram (`erDiagram`)
2. Architecture Diagram (graph TD or graph LR)
3. Flow Diagram (graph TD or graph LR)
4. Sequence Diagram (`sequenceDiagram`)
5. Deployment Diagram (graph TD or graph LR)

Rules:
- Keep the mermaid code valid and correctly structured.
- Do not use HTML formatting in node labels. Use clean strings.
- Escape any special characters where needed.
- Return ONLY a JSON object matching this schema:
{
  "mermaid": {
    "erDiagram": "string (raw mermaid code block)",
    "architectureDiagram": "string (raw mermaid code block)",
    "flowDiagram": "string (raw mermaid code block)",
    "sequenceDiagram": "string (raw mermaid code block)",
    "deploymentDiagram": "string (raw mermaid code block)"
  }
}
Return ONLY the raw JSON object. No markdown, no preambles.
"""


async def _call_groq_async(prompt: str, system_role: str) -> dict:
    client = _get_async_client()
    messages = [
        {"role": "system", "content": system_role},
        {"role": "user", "content": prompt}
    ]
    response = await client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        temperature=0.3,
        response_format={"type": "json_object"},
        max_tokens=4096,
        timeout=60
    )
    return json.loads(response.choices[0].message.content.strip())


async def _call_groq_async_with_retry(prompt: str, system_role: str, max_retries=5) -> dict:
    import groq
    retry_delay = 5
    for attempt in range(max_retries):
        try:
            return await _call_groq_async(prompt, system_role)
        except groq.RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            wait_time = retry_delay
            try:
                if hasattr(e, 'response') and e.response is not None:
                    headers = e.response.headers
                    if 'retry-after' in headers:
                        wait_time = max(wait_time, float(headers['retry-after']) + 0.5)
            except Exception:
                pass
            print(f"[WARN] Groq rate limit hit (429). Retrying in {wait_time}s... (Attempt {attempt + 1}/{max_retries})")
            await asyncio.sleep(wait_time)
            retry_delay *= 1.5
        except Exception as e:
            msg = str(e).lower()
            if "rate limit" in msg or "429" in msg or "too many requests" in msg:
                if attempt == max_retries - 1:
                    raise
                print(f"[WARN] Suspected rate limit. Retrying in {retry_delay}s... (Attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(retry_delay)
                retry_delay *= 1.5
            else:
                raise


async def run_generator_pipeline(idea: str, config: dict) -> dict:
    prompt = build_user_prompt(idea, config)
    result = await _call_groq_async_with_retry(prompt, BLUEPRINT_SYSTEM_PROMPT)
    return result


async def run_generator_pipeline_stream(idea: str, config: dict):
    prompt = build_user_prompt(idea, config)
    client = _get_async_client()
    messages = [
        {"role": "system", "content": BLUEPRINT_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    response_stream = await client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        temperature=0.3,
        response_format={"type": "json_object"},
        max_tokens=4096,
        timeout=60,
        stream=True
    )
    async for chunk in response_stream:
        content = chunk.choices[0].delta.content or ""
        if content:
            yield content
