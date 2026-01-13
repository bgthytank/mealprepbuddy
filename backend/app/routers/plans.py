from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from datetime import datetime

from ..models import WeeklyPlan, PlanEntry, PlanEntryUpdate, ValidationResult
from ..services.auth import get_current_user
from ..services.dynamodb import db_service
from ..utils.validation import validate_plan
from ..utils.ics_generator import generate_ics

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/{week_start_date}", response_model=WeeklyPlan)
async def get_weekly_plan(
    week_start_date: str,
    current_user: dict = Depends(get_current_user),
):
    """Get weekly plan for a specific week (week_start_date is Monday YYYY-MM-DD)"""
    plan = db_service.get_weekly_plan(current_user["household_id"], week_start_date)

    if not plan:
        # Return empty plan structure
        return WeeklyPlan(
            week_start_date=week_start_date,
            entries={},
            household_id=current_user["household_id"],
            updated_at=datetime.utcnow(),
        )

    # Convert entries to proper format
    entries = {}
    for date, entry in plan.get("entries", {}).items():
        if entry:
            entries[date] = PlanEntry(
                recipe_id=entry["recipe_id"],
                servings=entry["servings"],
            )
        else:
            entries[date] = None

    return WeeklyPlan(
        week_start_date=plan["week_start_date"],
        entries=entries,
        household_id=plan["household_id"],
        updated_at=datetime.fromisoformat(plan["updated_at"]),
    )


@router.put("/{week_start_date}/entry")
async def update_plan_entry(
    week_start_date: str,
    entry_data: PlanEntryUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Add or update a plan entry"""
    plan = db_service.update_plan_entry(
        current_user["household_id"],
        week_start_date,
        entry_data.date,
        entry_data.recipe_id,
        entry_data.servings,
    )

    entries = {}
    for date, entry in plan.get("entries", {}).items():
        if entry:
            entries[date] = PlanEntry(
                recipe_id=entry["recipe_id"],
                servings=entry["servings"],
            )
        else:
            entries[date] = None

    return WeeklyPlan(
        week_start_date=plan["week_start_date"],
        entries=entries,
        household_id=plan["household_id"],
        updated_at=datetime.fromisoformat(plan["updated_at"]),
    )


@router.delete("/{week_start_date}/entry")
async def delete_plan_entry(
    week_start_date: str,
    date: str = Query(..., description="Date to delete (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user),
):
    """Delete a plan entry"""
    plan = db_service.delete_plan_entry(
        current_user["household_id"],
        week_start_date,
        date,
    )

    if not plan:
        return WeeklyPlan(
            week_start_date=week_start_date,
            entries={},
            household_id=current_user["household_id"],
            updated_at=datetime.utcnow(),
        )

    entries = {}
    for d, entry in plan.get("entries", {}).items():
        if entry:
            entries[d] = PlanEntry(
                recipe_id=entry["recipe_id"],
                servings=entry["servings"],
            )
        else:
            entries[d] = None

    return WeeklyPlan(
        week_start_date=plan["week_start_date"],
        entries=entries,
        household_id=plan["household_id"],
        updated_at=datetime.fromisoformat(plan["updated_at"]),
    )


@router.post("/{week_start_date}/validate", response_model=ValidationResult)
async def validate_weekly_plan(
    week_start_date: str,
    current_user: dict = Depends(get_current_user),
):
    """Validate the weekly plan against constraint rules"""
    household_id = current_user["household_id"]

    plan = db_service.get_weekly_plan(household_id, week_start_date)
    plan_entries = plan.get("entries", {}) if plan else {}

    recipes = db_service.get_recipes(household_id)
    rules = db_service.get_rules(household_id)
    tags = db_service.get_tags(household_id)

    warnings = validate_plan(plan_entries, recipes, rules, tags)

    return ValidationResult(warnings=warnings)


@router.get("/{week_start_date}/export.ics")
async def export_ics(
    week_start_date: str,
    current_user: dict = Depends(get_current_user),
):
    """Export the weekly plan as an ICS calendar file"""
    household_id = current_user["household_id"]

    plan = db_service.get_weekly_plan(household_id, week_start_date)
    plan_entries = plan.get("entries", {}) if plan else {}

    if not plan_entries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No plan entries found for this week",
        )

    recipes = db_service.get_recipes(household_id)
    rules = db_service.get_rules(household_id)
    tags = db_service.get_tags(household_id)
    household = db_service.get_household(household_id)

    ics_content = generate_ics(
        plan_entries,
        recipes,
        rules,
        tags,
        household,
        week_start_date,
    )

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename=mealprep_{week_start_date}.ics"
        },
    )
