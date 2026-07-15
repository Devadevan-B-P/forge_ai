from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.blueprint import (
    SqlGenerateRequest,
    EndpointGenerateRequest,
    CodeResponse,
)
from app.services.groq_service import generate_sql, generate_endpoint_code

router = APIRouter(prefix="/api/generate", tags=["generators"])


def _friendly_detail(e: Exception, fallback: str) -> tuple[int, str]:
    msg = str(e)
    if "deadline" in msg.lower() or "timeout" in msg.lower():
        return 504, "The AI model took too long to respond. Please try again in a moment."
    return 502, f"{fallback}: {msg}"


@router.post("/sql", response_model=CodeResponse)
async def sql(req: SqlGenerateRequest, current_user: dict = Depends(get_current_user)):
    try:
        code = await generate_sql(req.database, req.dialect)
        
        # Save generated code to history if history_id is provided
        if req.history_id:
            db = get_db()
            res = await db["history"].update_one(
                {"_id": req.history_id, "user_id": current_user["id"]},
                {"$set": {"cachedSql": code}}
            )
            if res.matched_count == 0:
                raise HTTPException(status_code=404, detail="History project not found.")
            
        return CodeResponse(code=code, language="sql")
    except HTTPException as e:
        raise e
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        status, detail = _friendly_detail(e, "SQL generation failed")
        raise HTTPException(status_code=status, detail=detail)


@router.post("/endpoint", response_model=CodeResponse)
async def endpoint(req: EndpointGenerateRequest, current_user: dict = Depends(get_current_user)):
    try:
        code = await generate_endpoint_code(req.endpoint, req.framework)
        lang = "python" if req.framework.lower() == "fastapi" else "javascript"
        
        # Save generated code to history if history_id and endpoint_key are provided
        if req.history_id and req.endpoint_key:
            db = get_db()
            # MongoDB dot notation will dynamically construct/nest under cachedApiCodes
            # We sanitise key to avoid MongoDB modifier problems by replacing dots with underscores if needed,
            # but endpoint route keys (like "POST /api/users") have slashes and dots. Slashes are fine. Dots can be problematic in older MongoDB keys.
            # To be safe, we can replace dot (.) with underscore (_) in the key path.
            safe_key = req.endpoint_key.replace(".", "_")
            res = await db["history"].update_one(
                {"_id": req.history_id, "user_id": current_user["id"]},
                {"$set": {f"cachedApiCodes.{safe_key}": code}}
            )
            if res.matched_count == 0:
                raise HTTPException(status_code=404, detail="History project not found.")
            
        return CodeResponse(code=code, language=lang)
    except HTTPException as e:
        raise e
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        status, detail = _friendly_detail(e, "Endpoint generation failed")
        raise HTTPException(status_code=status, detail=detail)
