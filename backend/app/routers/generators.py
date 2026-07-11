from fastapi import APIRouter, HTTPException

from app.schemas.blueprint import (
    SqlGenerateRequest,
    EndpointGenerateRequest,
    CodeResponse,
)
from app.services.gemini_service import generate_sql, generate_endpoint_code

router = APIRouter(prefix="/api/generate", tags=["generators"])


def _friendly_detail(e: Exception, fallback: str) -> tuple[int, str]:
    msg = str(e)
    if "deadline" in msg.lower() or "timeout" in msg.lower():
        return 504, "Gemini took too long to respond. Try again in a moment."
    return 502, f"{fallback}: {msg}"


@router.post("/sql", response_model=CodeResponse)
def sql(req: SqlGenerateRequest):
    try:
        code = generate_sql(req.database, req.dialect)
        return CodeResponse(code=code, language="sql")
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        status, detail = _friendly_detail(e, "SQL generation failed")
        raise HTTPException(status_code=status, detail=detail)


@router.post("/endpoint", response_model=CodeResponse)
def endpoint(req: EndpointGenerateRequest):
    try:
        code = generate_endpoint_code(req.endpoint, req.framework)
        lang = "python" if req.framework.lower() == "fastapi" else "javascript"
        return CodeResponse(code=code, language=lang)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        status, detail = _friendly_detail(e, "Endpoint generation failed")
        raise HTTPException(status_code=status, detail=detail)
