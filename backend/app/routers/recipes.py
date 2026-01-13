from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime
from typing import Optional, List

from ..models import Recipe, RecipeCreate, RecipeUpdate
from ..services.auth import get_current_user
from ..services.dynamodb import db_service

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("", response_model=List[Recipe])
async def get_recipes(
    tag_id: Optional[str] = Query(None, description="Filter by tag ID"),
    q: Optional[str] = Query(None, description="Search query"),
    current_user: dict = Depends(get_current_user),
):
    """Get all recipes, optionally filtered by tag or search query"""
    recipes = db_service.get_recipes(current_user["household_id"], tag_id)

    if q:
        q_lower = q.lower()
        recipes = [
            r for r in recipes
            if q_lower in r.get("title_lower", "") or q_lower in r.get("notes", "").lower()
        ]

    return [
        Recipe(
            recipe_id=r["recipe_id"],
            title=r["title"],
            tag_ids=r["tag_ids"],
            default_servings=r["default_servings"],
            notes=r.get("notes"),
            household_id=r["household_id"],
            created_at=datetime.fromisoformat(r["created_at"]),
            updated_at=datetime.fromisoformat(r["updated_at"]),
        )
        for r in recipes
    ]


@router.get("/{recipe_id}", response_model=Recipe)
async def get_recipe(
    recipe_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a single recipe"""
    recipe = db_service.get_recipe(current_user["household_id"], recipe_id)
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    return Recipe(
        recipe_id=recipe["recipe_id"],
        title=recipe["title"],
        tag_ids=recipe["tag_ids"],
        default_servings=recipe["default_servings"],
        notes=recipe.get("notes"),
        household_id=recipe["household_id"],
        created_at=datetime.fromisoformat(recipe["created_at"]),
        updated_at=datetime.fromisoformat(recipe["updated_at"]),
    )


@router.post("", response_model=Recipe, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_data: RecipeCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new recipe"""
    recipe = db_service.create_recipe(
        current_user["household_id"],
        recipe_data.title,
        recipe_data.tag_ids,
        recipe_data.default_servings,
        recipe_data.notes,
    )

    return Recipe(
        recipe_id=recipe["recipe_id"],
        title=recipe["title"],
        tag_ids=recipe["tag_ids"],
        default_servings=recipe["default_servings"],
        notes=recipe.get("notes"),
        household_id=recipe["household_id"],
        created_at=datetime.fromisoformat(recipe["created_at"]),
        updated_at=datetime.fromisoformat(recipe["updated_at"]),
    )


@router.patch("/{recipe_id}", response_model=Recipe)
async def update_recipe(
    recipe_id: str,
    recipe_data: RecipeUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a recipe"""
    updates = {}
    if recipe_data.title is not None:
        updates["title"] = recipe_data.title
    if recipe_data.tag_ids is not None:
        updates["tag_ids"] = recipe_data.tag_ids
    if recipe_data.default_servings is not None:
        updates["default_servings"] = recipe_data.default_servings
    if recipe_data.notes is not None:
        updates["notes"] = recipe_data.notes

    recipe = db_service.update_recipe(current_user["household_id"], recipe_id, updates)
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    return Recipe(
        recipe_id=recipe["recipe_id"],
        title=recipe["title"],
        tag_ids=recipe["tag_ids"],
        default_servings=recipe["default_servings"],
        notes=recipe.get("notes"),
        household_id=recipe["household_id"],
        created_at=datetime.fromisoformat(recipe["created_at"]),
        updated_at=datetime.fromisoformat(recipe["updated_at"]),
    )


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a recipe"""
    db_service.delete_recipe(current_user["household_id"], recipe_id)
