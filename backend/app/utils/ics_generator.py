from datetime import datetime, timedelta
from icalendar import Calendar, Event, Alarm
from zoneinfo import ZoneInfo
import hashlib


def generate_ics(
    plan_entries: dict,
    recipes: list[dict],
    rules: list[dict],
    tags: list[dict],
    household: dict,
    week_start_date: str,
) -> str:
    """
    Generate an ICS calendar file for the weekly plan.

    Includes:
    - Dinner events for each planned meal
    - Reminder events from action rules
    """
    cal = Calendar()
    cal.add("prodid", "-//MealPrepBuddy//mealprepbuddy.com//")
    cal.add("version", "2.0")
    cal.add("calscale", "GREGORIAN")
    cal.add("method", "PUBLISH")
    cal.add("x-wr-calname", "MealPrepBuddy")

    household_id = household.get("household_id", "unknown")
    timezone_str = household.get("timezone", "America/Los_Angeles")
    dinner_time = household.get("dinner_time_local", "18:00")

    try:
        tz = ZoneInfo(timezone_str)
    except:
        tz = ZoneInfo("America/Los_Angeles")

    # Parse dinner time
    dinner_hour, dinner_minute = map(int, dinner_time.split(":"))

    # Build lookups
    recipe_map = {r["recipe_id"]: r for r in recipes}
    tag_map = {t["tag_id"]: t for t in tags}

    # Get enabled action rules
    action_rules = [
        r for r in rules
        if r.get("rule_kind") == "ACTION" and r.get("enabled", True)
    ]

    # Track reminders for deduplication
    reminders_set = set()  # (trigger_datetime_iso, message)
    reminders = []

    # Process each planned day
    for date_str, entry in plan_entries.items():
        if entry is None:
            continue

        recipe_id = entry.get("recipe_id")
        servings = entry.get("servings", 4)
        recipe = recipe_map.get(recipe_id)

        if not recipe:
            continue

        # Parse date
        meal_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        day_of_week = meal_date.strftime("%a")

        # Create dinner event
        event_start = datetime(
            meal_date.year,
            meal_date.month,
            meal_date.day,
            dinner_hour,
            dinner_minute,
            tzinfo=tz,
        )

        event = Event()
        event.add("uid", f"mealprepbuddy-{household_id}-{week_start_date}-{date_str}")
        event.add("dtstart", event_start)
        event.add("duration", timedelta(hours=1))
        event.add("summary", f"Dinner: {recipe['title']}")

        description = f"Servings: {servings}"
        if recipe.get("notes"):
            description += f"\n\nNotes: {recipe['notes']}"
        event.add("description", description)

        cal.add_component(event)

        # Process action rules for reminders
        for rule in action_rules:
            applies = False

            if rule.get("target_type") == "TAG":
                rule_tag_id = rule.get("tag_id")
                if rule_tag_id in recipe.get("tag_ids", []):
                    applies = True
            elif rule.get("target_type") == "RECIPE":
                if rule.get("recipe_id") == recipe_id:
                    applies = True

            if not applies:
                continue

            # Calculate trigger datetime
            offset_days = rule.get("offset_days", -1)
            time_local = rule.get("time_local", "10:00")
            time_hour, time_minute = map(int, time_local.split(":"))

            trigger_date = meal_date + timedelta(days=offset_days)
            trigger_datetime = datetime(
                trigger_date.year,
                trigger_date.month,
                trigger_date.day,
                time_hour,
                time_minute,
                tzinfo=tz,
            )

            # Render message template
            message_template = rule.get("message_template", "Reminder for {recipe_title}")
            message = (
                message_template
                .replace("{meal_date}", date_str)
                .replace("{recipe_title}", recipe["title"])
                .replace("{day_of_week}", day_of_week)
            )

            # Dedupe key
            dedupe_key = (trigger_datetime.isoformat(), message)
            if dedupe_key in reminders_set:
                continue
            reminders_set.add(dedupe_key)

            reminders.append({
                "trigger_datetime": trigger_datetime,
                "message": message,
                "meal_date": date_str,
                "recipe_title": recipe["title"],
            })

    # Create reminder events
    for reminder in reminders:
        trigger_dt = reminder["trigger_datetime"]
        message = reminder["message"]

        # Create hash for UID
        hash_input = f"{trigger_dt.isoformat()}{message}"
        uid_hash = hashlib.md5(hash_input.encode()).hexdigest()[:12]

        rem_event = Event()
        rem_event.add(
            "uid",
            f"mealprepbuddy-rem-{household_id}-{week_start_date}-{uid_hash}"
        )
        rem_event.add("dtstart", trigger_dt)
        rem_event.add("duration", timedelta(minutes=5))
        rem_event.add("summary", f"Reminder: {message}")
        rem_event.add(
            "description",
            f"For dinner on {reminder['meal_date']}: {reminder['recipe_title']}"
        )

        # Add alarm at event start
        alarm = Alarm()
        alarm.add("action", "DISPLAY")
        alarm.add("trigger", timedelta(0))
        alarm.add("description", message)
        rem_event.add_component(alarm)

        cal.add_component(rem_event)

    return cal.to_ical().decode("utf-8")
