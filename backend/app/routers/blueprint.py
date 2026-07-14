import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.core.database import get_db
from app.schemas.blueprint import BlueprintRequest
from app.services.pipeline import run_generator_pipeline

router = APIRouter(prefix="/api/blueprint", tags=["blueprint"])


@router.post("/generate")
async def generate(req: BlueprintRequest, current_user: dict = Depends(get_current_user)):
    try:
        result = await run_generator_pipeline(req.idea, req.config.model_dump())
        
        # Save/Update database history
        db = get_db()
        if req.history_id:
            res = await db["history"].update_one(
                {"_id": req.history_id, "user_id": current_user["id"]},
                {"$set": {
                    "idea": req.idea,
                    "config": req.config.model_dump(),
                    "blueprint": result,
                    "created_at": datetime.now(timezone.utc),
                    "cachedSql": None,
                    "cachedApiCodes": {}
                }}
            )
            if res.matched_count == 0:
                raise HTTPException(status_code=404, detail="History project not found.")
            history_id = req.history_id
        else:
            history_id = str(uuid.uuid4())
            doc = {
                "_id": history_id,
                "user_id": current_user["id"],
                "idea": req.idea,
                "config": req.config.model_dump(),
                "blueprint": result,
                "created_at": datetime.now(timezone.utc),
                "cachedSql": None,
                "cachedApiCodes": {}
            }
            await db["history"].insert_one(doc)
        
        return {"id": history_id, "blueprint": result}
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
            detail="The AI model took too long to respond. Please try again in a moment.",
        )
    except Exception as e:
        msg = str(e)
        if "deadline" in msg.lower() or "timeout" in msg.lower():
            raise HTTPException(
                status_code=504,
                detail="The AI model took too long to respond. Please try again in a moment.",
            )
        raise HTTPException(status_code=502, detail=f"Blueprint generation failed: {msg}")
