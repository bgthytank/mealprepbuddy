import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from datetime import datetime
from typing import Any, Optional, List, Dict
import uuid

from ..config import get_settings


class DynamoDBService:
    def __init__(self):
        settings = get_settings()
        self.table_name = settings.dynamodb_table_name

        if settings.dynamodb_endpoint_url:
            # For local DynamoDB, use fake credentials
            self.dynamodb = boto3.resource(
                "dynamodb",
                endpoint_url=settings.dynamodb_endpoint_url,
                region_name=settings.aws_region,
                aws_access_key_id="fakeAccessKeyId",
                aws_secret_access_key="fakeSecretAccessKey",
            )
        else:
            self.dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)

        self.table = self.dynamodb.Table(self.table_name)

    # --- User Operations ---
    def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email using GSI"""
        response = self.table.query(
            IndexName="gsi1",
            KeyConditionExpression=Key("gsi1pk").eq(f"EMAIL#{email.lower()}"),
        )
        items = response.get("Items", [])
        return items[0] if items else None

    def create_user(
        self, email: str, password_hash: str, household_id: Optional[str] = None
    ) -> dict:
        """Create a new user and optionally a household"""
        user_id = str(uuid.uuid4())
        if not household_id:
            household_id = str(uuid.uuid4())
            # Create household
            self._create_household(household_id, f"{email}'s Household")

        now = datetime.utcnow().isoformat()
        user = {
            "pk": f"USER#{user_id}",
            "sk": f"USER#{user_id}",
            "gsi1pk": f"EMAIL#{email.lower()}",
            "gsi1sk": f"USER#{user_id}",
            "user_id": user_id,
            "email": email,
            "email_lower": email.lower(),
            "password_hash": password_hash,
            "household_id": household_id,
            "created_at": now,
        }
        self.table.put_item(Item=user)
        return user

    def _create_household(self, household_id: str, name: str) -> dict:
        """Create a new household"""
        settings = get_settings()
        now = datetime.utcnow().isoformat()
        household = {
            "pk": f"HOUSE#{household_id}",
            "sk": f"HOUSE#{household_id}",
            "household_id": household_id,
            "name": name,
            "timezone": settings.default_timezone,
            "dinner_time_local": settings.default_dinner_time,
            "created_at": now,
        }
        self.table.put_item(Item=household)
        return household

    def get_household(self, household_id: str) -> Optional[dict]:
        """Get household by ID"""
        response = self.table.get_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"HOUSE#{household_id}"}
        )
        return response.get("Item")

    # --- Tag Operations ---
    def get_tags(self, household_id: str) -> List[dict]:
        """Get all tags for a household"""
        response = self.table.query(
            KeyConditionExpression=Key("pk").eq(f"HOUSE#{household_id}")
            & Key("sk").begins_with("TAG#")
        )
        return response.get("Items", [])

    def get_tag(self, household_id: str, tag_id: str) -> Optional[dict]:
        """Get a single tag"""
        response = self.table.get_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"TAG#{tag_id}"}
        )
        return response.get("Item")

    def create_tag(
        self, household_id: str, name: str, tag_type: str
    ) -> dict:
        """Create a new tag (check uniqueness first)"""
        # Check for existing tag with same name
        existing = self.get_tags(household_id)
        for tag in existing:
            if tag.get("name_lower") == name.lower():
                raise ValueError(f"Tag '{name}' already exists")

        tag_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        tag = {
            "pk": f"HOUSE#{household_id}",
            "sk": f"TAG#{tag_id}",
            "tag_id": tag_id,
            "name": name,
            "name_lower": name.lower(),
            "type": tag_type,
            "household_id": household_id,
            "created_at": now,
        }
        self.table.put_item(Item=tag)
        return tag

    def update_tag(
        self, household_id: str, tag_id: str, updates: dict
    ) -> Optional[dict]:
        """Update a tag"""
        update_expr = []
        expr_values = {}
        expr_names = {}

        for key, value in updates.items():
            if value is not None:
                update_expr.append(f"#{key} = :{key}")
                expr_values[f":{key}"] = value
                expr_names[f"#{key}"] = key
                if key == "name":
                    update_expr.append("#name_lower = :name_lower")
                    expr_values[":name_lower"] = value.lower()
                    expr_names["#name_lower"] = "name_lower"

        if not update_expr:
            return self.get_tag(household_id, tag_id)

        response = self.table.update_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"TAG#{tag_id}"},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames=expr_names,
            ReturnValues="ALL_NEW",
        )
        return response.get("Attributes")

    def delete_tag(self, household_id: str, tag_id: str) -> bool:
        """Delete a tag"""
        self.table.delete_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"TAG#{tag_id}"}
        )
        return True

    # --- Recipe Operations ---
    def get_recipes(
        self, household_id: str, tag_id: Optional[str] = None
    ) -> List[dict]:
        """Get all recipes for a household, optionally filtered by tag"""
        response = self.table.query(
            KeyConditionExpression=Key("pk").eq(f"HOUSE#{household_id}")
            & Key("sk").begins_with("RECIPE#")
        )
        recipes = response.get("Items", [])

        if tag_id:
            recipes = [r for r in recipes if tag_id in r.get("tag_ids", [])]

        return recipes

    def get_recipe(self, household_id: str, recipe_id: str) -> Optional[dict]:
        """Get a single recipe"""
        response = self.table.get_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"RECIPE#{recipe_id}"}
        )
        return response.get("Item")

    def create_recipe(
        self,
        household_id: str,
        title: str,
        tag_ids: List[str],
        default_servings: int,
        notes: Optional[str],
    ) -> dict:
        """Create a new recipe"""
        recipe_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        recipe = {
            "pk": f"HOUSE#{household_id}",
            "sk": f"RECIPE#{recipe_id}",
            "recipe_id": recipe_id,
            "title": title,
            "title_lower": title.lower(),
            "tag_ids": tag_ids,
            "default_servings": default_servings,
            "notes": notes or "",
            "household_id": household_id,
            "created_at": now,
            "updated_at": now,
        }
        self.table.put_item(Item=recipe)
        return recipe

    def update_recipe(
        self, household_id: str, recipe_id: str, updates: dict
    ) -> Optional[dict]:
        """Update a recipe"""
        update_expr = ["#updated_at = :updated_at"]
        expr_values = {":updated_at": datetime.utcnow().isoformat()}
        expr_names = {"#updated_at": "updated_at"}

        for key, value in updates.items():
            if value is not None:
                update_expr.append(f"#{key} = :{key}")
                expr_values[f":{key}"] = value
                expr_names[f"#{key}"] = key
                if key == "title":
                    update_expr.append("#title_lower = :title_lower")
                    expr_values[":title_lower"] = value.lower()
                    expr_names["#title_lower"] = "title_lower"

        response = self.table.update_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"RECIPE#{recipe_id}"},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames=expr_names,
            ReturnValues="ALL_NEW",
        )
        return response.get("Attributes")

    def delete_recipe(self, household_id: str, recipe_id: str) -> bool:
        """Delete a recipe"""
        self.table.delete_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"RECIPE#{recipe_id}"}
        )
        return True

    # --- Rule Operations ---
    def get_rules(self, household_id: str) -> List[dict]:
        """Get all rules for a household"""
        response = self.table.query(
            KeyConditionExpression=Key("pk").eq(f"HOUSE#{household_id}")
            & Key("sk").begins_with("RULE#")
        )
        return response.get("Items", [])

    def get_rule(self, household_id: str, rule_id: str) -> Optional[dict]:
        """Get a single rule"""
        response = self.table.get_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"RULE#{rule_id}"}
        )
        return response.get("Item")

    def create_constraint_rule(
        self,
        household_id: str,
        constraint_type: str,
        tag_id: str,
        max_count: int,
        enabled: bool,
    ) -> dict:
        """Create a constraint rule"""
        rule_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        rule = {
            "pk": f"HOUSE#{household_id}",
            "sk": f"RULE#{rule_id}",
            "rule_id": rule_id,
            "rule_kind": "CONSTRAINT",
            "constraint_type": constraint_type,
            "tag_id": tag_id,
            "max_count": max_count,
            "enabled": enabled,
            "household_id": household_id,
            "created_at": now,
            "updated_at": now,
        }
        self.table.put_item(Item=rule)
        return rule

    def create_action_rule(
        self,
        household_id: str,
        action_type: str,
        target_type: str,
        tag_id: Optional[str],
        recipe_id: Optional[str],
        offset_days: int,
        time_local: str,
        message_template: str,
        enabled: bool,
    ) -> dict:
        """Create an action rule"""
        rule_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        rule = {
            "pk": f"HOUSE#{household_id}",
            "sk": f"RULE#{rule_id}",
            "rule_id": rule_id,
            "rule_kind": "ACTION",
            "action_type": action_type,
            "target_type": target_type,
            "tag_id": tag_id,
            "recipe_id": recipe_id,
            "offset_days": offset_days,
            "time_local": time_local,
            "message_template": message_template,
            "enabled": enabled,
            "household_id": household_id,
            "created_at": now,
            "updated_at": now,
        }
        self.table.put_item(Item=rule)
        return rule

    def update_rule(
        self, household_id: str, rule_id: str, updates: dict
    ) -> Optional[dict]:
        """Update a rule"""
        update_expr = ["#updated_at = :updated_at"]
        expr_values = {":updated_at": datetime.utcnow().isoformat()}
        expr_names = {"#updated_at": "updated_at"}

        for key, value in updates.items():
            if value is not None:
                update_expr.append(f"#{key} = :{key}")
                expr_values[f":{key}"] = value
                expr_names[f"#{key}"] = key

        response = self.table.update_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"RULE#{rule_id}"},
            UpdateExpression="SET " + ", ".join(update_expr),
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames=expr_names,
            ReturnValues="ALL_NEW",
        )
        return response.get("Attributes")

    def delete_rule(self, household_id: str, rule_id: str) -> bool:
        """Delete a rule"""
        self.table.delete_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"RULE#{rule_id}"}
        )
        return True

    # --- Weekly Plan Operations ---
    def get_weekly_plan(
        self, household_id: str, week_start_date: str
    ) -> Optional[dict]:
        """Get weekly plan"""
        response = self.table.get_item(
            Key={"pk": f"HOUSE#{household_id}", "sk": f"WEEK#{week_start_date}"}
        )
        return response.get("Item")

    def save_weekly_plan(
        self, household_id: str, week_start_date: str, entries: dict
    ) -> dict:
        """Save/update weekly plan"""
        now = datetime.utcnow().isoformat()
        plan = {
            "pk": f"HOUSE#{household_id}",
            "sk": f"WEEK#{week_start_date}",
            "week_start_date": week_start_date,
            "entries": entries,
            "household_id": household_id,
            "updated_at": now,
        }
        self.table.put_item(Item=plan)
        return plan

    def update_plan_entry(
        self,
        household_id: str,
        week_start_date: str,
        date: str,
        recipe_id: str,
        servings: int,
    ) -> dict:
        """Update a single plan entry"""
        plan = self.get_weekly_plan(household_id, week_start_date)
        if not plan:
            entries = {}
        else:
            entries = plan.get("entries", {})

        entries[date] = {"recipe_id": recipe_id, "servings": servings}
        return self.save_weekly_plan(household_id, week_start_date, entries)

    def delete_plan_entry(
        self, household_id: str, week_start_date: str, date: str
    ) -> dict:
        """Delete a plan entry"""
        plan = self.get_weekly_plan(household_id, week_start_date)
        if plan and "entries" in plan:
            entries = plan["entries"]
            if date in entries:
                del entries[date]
            return self.save_weekly_plan(household_id, week_start_date, entries)
        return plan or {}


# Singleton instance
db_service = DynamoDBService()
