from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Dict
import re


class PlanEntry(BaseModel):
    recipe_id: str
    servings: int

    @field_validator("servings")
    @classmethod
    def validate_servings(cls, v):
        if v < 1:
            raise ValueError("Servings must be at least 1")
        return v


class PlanEntryUpdate(BaseModel):
    date: str  # YYYY-MM-DD
    recipe_id: str
    servings: int

    @field_validator("date")
    @classmethod
    def validate_date(cls, v):
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Date must be in YYYY-MM-DD format")
        return v


class SchoolLunchUpdate(BaseModel):
    recipe_ids: list[str] = Field(min_length=5, max_length=5)


class WeeklyPlan(BaseModel):
    week_start_date: str  # YYYY-MM-DD (Monday)
    entries: Dict[str, Optional[PlanEntry]]  # date -> entry
    school_lunch_entries: Dict[str, PlanEntry] = Field(default_factory=dict)
    household_id: str
    updated_at: datetime


class ValidationWarning(BaseModel):
    rule_id: str
    type: str
    message: str
    details: dict


class ValidationResult(BaseModel):
    warnings: list
