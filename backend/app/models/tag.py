from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from typing import Optional


class TagType(str, Enum):
    PROTEIN = "PROTEIN"
    PORTION = "PORTION"
    PREP = "PREP"
    OTHER = "OTHER"


class TagCreate(BaseModel):
    name: str
    type: TagType


class TagUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[TagType] = None


class Tag(BaseModel):
    tag_id: str
    name: str
    type: TagType
    household_id: str
    created_at: datetime
