import json

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.schemas.blueprint import BlueprintRequest
from app.services.gemini_service import generate_blueprint

router = APIRouter(prefix="/api/blueprint", tags=["blueprint"])


@router.post("/generate", dependencies=[Depends(get_current_user)])
def generate(req: BlueprintRequest):
    try:
        result = generate_blueprint(req.idea, req.config.model_dump())
        return result
    except RuntimeError as e:
        # Missing/invalid API key
        raise HTTPException(status_code=400, detail=str(e))
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="The model returned output that wasn't valid JSON. Try generating again.",
        )
    except TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Gemini took too long to respond. Try again in a moment.",
        )
    except Exception as e:
        msg = str(e)
        if "deadline" in msg.lower() or "timeout" in msg.lower():
            raise HTTPException(
                status_code=504,
                detail="Gemini took too long to respond. Try again in a moment.",
            )
        raise HTTPException(status_code=502, detail=f"Blueprint generation failed: {msg}")
