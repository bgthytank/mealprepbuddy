from ..models import ValidationWarning


def validate_plan(
    plan_entries: dict,
    recipes: list[dict],
    rules: list[dict],
    tags: list[dict],
) -> list[ValidationWarning]:
    """
    Validate a weekly plan against constraint rules.
    Returns list of warnings for violated constraints.
    """
    warnings = []

    # Build recipe lookup
    recipe_map = {r["recipe_id"]: r for r in recipes}
    tag_map = {t["tag_id"]: t for t in tags}

    # Get only enabled constraint rules
    constraint_rules = [
        r for r in rules
        if r.get("rule_kind") == "CONSTRAINT" and r.get("enabled", True)
    ]

    for rule in constraint_rules:
        if rule.get("constraint_type") == "MAX_MEALS_PER_WEEK_BY_TAG":
            tag_id = rule.get("tag_id")
            max_count = rule.get("max_count", 0)

            # Count meals with this tag
            count = 0
            for date, entry in plan_entries.items():
                if entry is None:
                    continue
                recipe_id = entry.get("recipe_id")
                recipe = recipe_map.get(recipe_id)
                if recipe and tag_id in recipe.get("tag_ids", []):
                    count += 1

            if count > max_count:
                tag_name = tag_map.get(tag_id, {}).get("name", tag_id)
                warnings.append(
                    ValidationWarning(
                        rule_id=rule["rule_id"],
                        type="MAX_MEALS_PER_WEEK_BY_TAG",
                        message=f"Tag '{tag_name}' planned {count} times > max {max_count}",
                        details={
                            "tag_id": tag_id,
                            "tag_name": tag_name,
                            "count": count,
                            "max": max_count,
                        },
                    )
                )

    # Check for missing recipes
    for date, entry in plan_entries.items():
        if entry is None:
            continue
        recipe_id = entry.get("recipe_id")
        if recipe_id and recipe_id not in recipe_map:
            warnings.append(
                ValidationWarning(
                    rule_id="system",
                    type="MISSING_RECIPE",
                    message=f"Recipe missing for {date}; please reselect",
                    details={"date": date, "recipe_id": recipe_id},
                )
            )

    return warnings
