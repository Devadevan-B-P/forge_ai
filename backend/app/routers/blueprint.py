import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.security import get_current_user
from app.core.database import get_db
from app.schemas.blueprint import BlueprintRequest
from app.services.pipeline import run_generator_pipeline, run_generator_pipeline_stream

router = APIRouter(prefix="/api/blueprint", tags=["blueprint"])


def _repair_json(text: str) -> dict | None:
    """Attempt to parse potentially-truncated JSON by closing open structures.

    When a model hits the max_tokens limit mid-output the JSON is cut off.
    This walks the text character-by-character to track open brackets/braces
    and strings, then closes whatever is still open before trying json.loads.
    Returns None if parsing still fails after repair.
    """
    text = text.strip()

    # 1. Fast path — text is already valid
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Walk through tracking open structures
    stack: list[str] = []
    in_string = False
    escape_next = False

    for ch in text:
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch in ('{', '['):
            stack.append('}' if ch == '{' else ']')
        elif ch in ('}', ']') and stack:
            stack.pop()

    # Close any open string
    closing = ""
    if in_string:
        closing += '"'

    # Remove trailing comma before we close (e.g. last item was cut off)
    candidate = (text + closing).rstrip()
    if candidate.endswith(','):
        candidate = candidate[:-1]

    # Close all open structures in reverse order
    candidate += "".join(reversed(stack))

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None

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


@router.post("/generate-stream")
async def generate_stream(req: BlueprintRequest, current_user: dict = Depends(get_current_user)):
    async def sse_generator():
        accumulated_text = ""
        try:
            async for event_type, payload in run_generator_pipeline_stream(req.idea, req.config.model_dump()):
                if event_type == "model":
                    # Tell the browser which model is currently active
                    yield f"data: {json.dumps({'type': 'model', 'name': payload})}\n\n"
                elif event_type == "chunk":
                    accumulated_text += payload
                    chunk_payload = json.dumps({'type': 'chunk', 'text': payload})
                    yield f"data: {chunk_payload}\n\n"

            # Parse completed stream to JSON — try repair if raw parse fails
            result = _repair_json(accumulated_text)
            if result is None:
                err_payload = json.dumps({'type': 'error', 'message': "The model returned output that wasn't valid JSON. Please try again."})
                yield f"data: {err_payload}\n\n"
                return

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
                    yield f"data: {json.dumps({'type': 'error', 'message': 'History project not found.'})}\n\n"
                    return
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

            # Yield completion event with the history id and blueprint
            done_payload = json.dumps({'type': 'done', 'id': history_id, 'blueprint': result})
            yield f"data: {done_payload}\n\n"

        except Exception as e:
            err_msg_payload = json.dumps({'type': 'error', 'message': f"Blueprint generation failed: {str(e)}"})
            yield f"data: {err_msg_payload}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

