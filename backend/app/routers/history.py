from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])


class HistoryItemResponse(BaseModel):
    id: str
    idea: str
    config: dict
    created_at: datetime


@router.get("", response_model=list[HistoryItemResponse])
async def list_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db["history"].find(
        {"user_id": current_user["id"]},
        {"_id": 1, "idea": 1, "config": 1, "created_at": 1}
    ).sort("created_at", -1)
    
    results = []
    async for doc in cursor:
        results.append(HistoryItemResponse(
            id=doc["_id"],
            idea=doc["idea"],
            config=doc["config"],
            created_at=doc["created_at"]
        ))
    return results


@router.get("/{history_id}")
async def get_history_detail(history_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db["history"].find_one({"_id": history_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="History project not found.")
    return doc


@router.delete("/{history_id}")
async def delete_history(history_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db["history"].delete_one({"_id": history_id, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History project not found.")
    return {"success": True}
