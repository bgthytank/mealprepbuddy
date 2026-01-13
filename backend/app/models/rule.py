from pydantic import BaseModel, field_validator
from enum import Enum
from datetime import datetime
from typing import Literal, Optional, Union


class RuleKind(str, Enum):
    CONSTRAINT = "CONSTRAINT"
    ACTION = "ACTION"


class ConstraintType(str, Enum):
    MAX_MEALS_PER_WEEK_BY_TAG = "MAX_MEALS_PER_WEEK_BY_TAG"


class ActionType(str, Enum):
    REMIND_OFFSET_DAYS_BEFORE_DINNER = "REMIND_OFFSET_DAYS_BEFORE_DINNER"


class TargetType(str, Enum):
    TAG = "TAG"
    RECIPE = "RECIPE"


# Constraint rule models
class ConstraintRuleCreate(BaseModel):
    tag_id: str
    max_count: int
    enabled: bool = True

    @field_validator("max_count")
    @classmethod
    def validate_max_count(cls, v):
        if v < 0:
            raise ValueError("max_count must be >= 0")
        return v


# Action rule models
class ActionRuleCreate(BaseModel):
    target_type: TargetType
    tag_id: Optional[str] = None
    recipe_id: Optional[str] = None
    offset_days: int = -1
    time_local: str = "10:00"
    message_template: str
    enabled: bool = True

    @field_validator("time_local")
    @classmethod
    def validate_time(cls, v):
        try:
            parts = v.split(":")
            if len(parts) != 2:
                raise ValueError()
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                raise ValueError()
        except:
            raise ValueError("time_local must be in HH:MM format")
        return v


class RuleCreate(BaseModel):
    rule_kind: RuleKind
    # Constraint fields
    constraint_type: Optional[ConstraintType] = None
    tag_id: Optional[str] = None
    max_count: Optional[int] = None
    # Action fields
    action_type: Optional[ActionType] = None
    target_type: Optional[TargetType] = None
    recipe_id: Optional[str] = None
    offset_days: Optional[int] = None
    time_local: Optional[str] = None
    message_template: Optional[str] = None
    enabled: bool = True


class RuleUpdate(BaseModel):
    enabled: Optional[bool] = None
    max_count: Optional[int] = None
    offset_days: Optional[int] = None
    time_local: Optional[str] = None
    message_template: Optional[str] = None


class ConstraintRule(BaseModel):
    rule_id: str
    rule_kind: Literal[RuleKind.CONSTRAINT] = RuleKind.CONSTRAINT
    constraint_type: ConstraintType
    tag_id: str
    max_count: int
    enabled: bool
    household_id: str
    created_at: datetime
    updated_at: datetime


class ActionRule(BaseModel):
    rule_id: str
    rule_kind: Literal[RuleKind.ACTION] = RuleKind.ACTION
    action_type: ActionType
    target_type: TargetType
    tag_id: Optional[str]
    recipe_id: Optional[str]
    offset_days: int
    time_local: str
    message_template: str
    enabled: bool
    household_id: str
    created_at: datetime
    updated_at: datetime


Rule = Union[ConstraintRule, ActionRule]
