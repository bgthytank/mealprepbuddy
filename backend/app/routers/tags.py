from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List

from ..models import Tag, TagCreate, TagUpdate, TagType
from ..services.auth import get_current_user
from ..services.dynamodb import db_service

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=List[Tag])
async def get_tags(current_user: dict = Depends(get_current_user)):
    """Get all tags for the household"""
    tags = db_service.get_tags(current_user["household_id"])
    return [
        Tag(
            tag_id=t["tag_id"],
            name=t["name"],
            type=TagType(t["type"]),
            household_id=t["household_id"],
            created_at=datetime.fromisoformat(t["created_at"]),
        )
        for t in tags
    ]


@router.get("/types")
async def get_tag_types():
    """Get available tag types"""
    return [{"name": t.value, "value": t.value} for t in TagType]


@router.post("", response_model=Tag, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new tag"""
    try:
        tag = db_service.create_tag(
            current_user["household_id"],
            tag_data.name,
            tag_data.type.value,
        )
        return Tag(
            tag_id=tag["tag_id"],
            name=tag["name"],
            type=TagType(tag["type"]),
            household_id=tag["household_id"],
            created_at=datetime.fromisoformat(tag["created_at"]),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{tag_id}", response_model=Tag)
async def update_tag(
    tag_id: str,
    tag_data: TagUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a tag"""
    updates = {}
    if tag_data.name is not None:
        updates["name"] = tag_data.name
    if tag_data.type is not None:
        updates["type"] = tag_data.type.value

    tag = db_service.update_tag(current_user["household_id"], tag_id, updates)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    return Tag(
        tag_id=tag["tag_id"],
        name=tag["name"],
        type=TagType(tag["type"]),
        household_id=tag["household_id"],
        created_at=datetime.fromisoformat(tag["created_at"]),
    )


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a tag"""
    db_service.delete_tag(current_user["household_id"], tag_id)
