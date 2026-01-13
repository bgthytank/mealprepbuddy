from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import Union

from ..models import (
    Rule, RuleUpdate, ConstraintRule, ActionRule,
    RuleKind, ConstraintType, ActionType, TargetType,
    ConstraintRuleCreate, ActionRuleCreate,
)
from ..services.auth import get_current_user
from ..services.dynamodb import db_service

router = APIRouter(prefix="/rules", tags=["rules"])


def _format_rule(r: dict) -> Union[ConstraintRule, ActionRule]:
    """Convert DynamoDB item to Rule model"""
    if r["rule_kind"] == "CONSTRAINT":
        return ConstraintRule(
            rule_id=r["rule_id"],
            rule_kind=RuleKind.CONSTRAINT,
            constraint_type=ConstraintType(r["constraint_type"]),
            tag_id=r["tag_id"],
            max_count=r["max_count"],
            enabled=r["enabled"],
            household_id=r["household_id"],
            created_at=datetime.fromisoformat(r["created_at"]),
            updated_at=datetime.fromisoformat(r["updated_at"]),
        )
    else:
        return ActionRule(
            rule_id=r["rule_id"],
            rule_kind=RuleKind.ACTION,
            action_type=ActionType(r["action_type"]),
            target_type=TargetType(r["target_type"]),
            tag_id=r.get("tag_id"),
            recipe_id=r.get("recipe_id"),
            offset_days=r["offset_days"],
            time_local=r["time_local"],
            message_template=r["message_template"],
            enabled=r["enabled"],
            household_id=r["household_id"],
            created_at=datetime.fromisoformat(r["created_at"]),
            updated_at=datetime.fromisoformat(r["updated_at"]),
        )


@router.get("")
async def get_rules(current_user: dict = Depends(get_current_user)):
    """Get all rules for the household"""
    rules = db_service.get_rules(current_user["household_id"])
    return [_format_rule(r) for r in rules]


@router.post("/constraint/max_meals_per_week_by_tag", status_code=status.HTTP_201_CREATED)
async def create_constraint_rule(
    rule_data: ConstraintRuleCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a MAX_MEALS_PER_WEEK_BY_TAG constraint rule"""
    rule = db_service.create_constraint_rule(
        current_user["household_id"],
        ConstraintType.MAX_MEALS_PER_WEEK_BY_TAG.value,
        rule_data.tag_id,
        rule_data.max_count,
        rule_data.enabled,
    )
    return _format_rule(rule)


@router.post("/action/remind_offset_days_before_dinner", status_code=status.HTTP_201_CREATED)
async def create_action_rule(
    rule_data: ActionRuleCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a REMIND_OFFSET_DAYS_BEFORE_DINNER action rule"""
    # Validate target
    if rule_data.target_type == TargetType.TAG and not rule_data.tag_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tag_id required when target_type is TAG",
        )
    if rule_data.target_type == TargetType.RECIPE and not rule_data.recipe_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="recipe_id required when target_type is RECIPE",
        )

    rule = db_service.create_action_rule(
        current_user["household_id"],
        ActionType.REMIND_OFFSET_DAYS_BEFORE_DINNER.value,
        rule_data.target_type.value,
        rule_data.tag_id if rule_data.target_type == TargetType.TAG else None,
        rule_data.recipe_id if rule_data.target_type == TargetType.RECIPE else None,
        rule_data.offset_days,
        rule_data.time_local,
        rule_data.message_template,
        rule_data.enabled,
    )
    return _format_rule(rule)


@router.patch("/{rule_id}")
async def update_rule(
    rule_id: str,
    rule_data: RuleUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a rule"""
    updates = {}
    if rule_data.enabled is not None:
        updates["enabled"] = rule_data.enabled
    if rule_data.max_count is not None:
        updates["max_count"] = rule_data.max_count
    if rule_data.offset_days is not None:
        updates["offset_days"] = rule_data.offset_days
    if rule_data.time_local is not None:
        updates["time_local"] = rule_data.time_local
    if rule_data.message_template is not None:
        updates["message_template"] = rule_data.message_template

    rule = db_service.update_rule(current_user["household_id"], rule_id, updates)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")

    return _format_rule(rule)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a rule"""
    db_service.delete_rule(current_user["household_id"], rule_id)
