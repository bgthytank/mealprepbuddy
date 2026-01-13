from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List


class RecipeCreate(BaseModel):
    title: str
    tag_ids: List[str]
    default_servings: int = 4
    notes: Optional[str] = None

    @field_validator("tag_ids")
    @classmethod
    def validate_tag_ids(cls, v):
        if not v or len(v) < 1:
            raise ValueError("At least one tag is required")
        return v

    @field_validator("default_servings")
    @classmethod
    def validate_servings(cls, v):
        if v < 1:
            raise ValueError("Servings must be at least 1")
        return v


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    default_servings: Optional[int] = None
    notes: Optional[str] = None

    @field_validator("tag_ids")
    @classmethod
    def validate_tag_ids(cls, v):
        if v is not None and len(v) < 1:
            raise ValueError("At least one tag is required")
        return v


class Recipe(BaseModel):
    recipe_id: str
    title: str
    tag_ids: List[str]
    default_servings: int
    notes: Optional[str]
    household_id: str
    created_at: datetime
    updated_at: datetime
