# MealPrepBuddy — Design Doc v1.0 (Web MVP → iOS later)

## 0) Summary
MealPrepBuddy is a **mobile-friendly web app** for weekly dinner planning with:
- **Manual recipe creation** (title + tags required; notes optional; servings supported)
- **Tag system with fixed tag types** (each tag has exactly one type)
- **Rule engine**
  - **Constraint rules** validate weekly plan (soft warnings)
  - **Action rules** generate **Calendar alerts** for meals matching tags/recipes
- **Export**: download **.ics** file to import into **Apple Calendar**
  - dinners become calendar events
  - rule-driven reminders become calendar alerts (implemented as reminder events)

MVP supports **<10 concurrent users**, **one shared household**, **single editor** (no concurrency handling required).

---

## 1) Goals and non-goals

### Goals (MVP)
1. Create recipes manually (title + ≥1 tag required).
2. Create/manage tags with **fixed tag types**; each tag has exactly one type.
3. Create rules:
   - Weekly constraint rules (e.g., pork ≤ 3 dinners/week)
   - Action rules that generate reminders (e.g., thaw 1 day before at 10am)
4. Weekly dinner planning (Mon–Sun) via drag-and-drop:
   - drag recipe onto day
   - drag tag onto day → choose recipe from recipes containing that tag (**alphabetical list**)
5. Confirm plan → run validations → show violations (**soft; export still allowed**)
6. Export plan to Apple Calendar via `.ics` download:
   - one event per dinner day
   - reminders as calendar alerts
   - reminder deduping

### Non-goals (MVP)
- Ingredients, grocery lists, prep session optimizer
- Native iOS app (comes later)
- Real Apple Reminders integration (only Calendar-based alerts)
- Multi-household / permissions / sharing outside household
- Concurrent editing conflict resolution

---

## 2) Core concepts and definitions

### 2.1 Week definition
- A “week” is **Monday–Sunday**, identified by `week_start_date` (`YYYY-MM-DD`, Monday).
- Weekly plan maps each date in that range → optional dinner entry.

### 2.2 Meal slot
- MVP has exactly one slot per day: **DINNER**.
- Calendar event time is configurable as a household setting, default **18:00 local**.

### 2.3 Time zone
- Store `household.timezone` (IANA string), default from browser at signup (fallback `America/Los_Angeles`).
- All reminder times are in `household.timezone`.

---

## 3) Functional requirements

### 3.1 Authentication and workspace
- Simple password login.
- One shared household (workspace).
- Single editor assumed; no real-time collaboration.

**Acceptance criteria**
- User can log in, create recipes/tags/rules/plans, export.
- Unauthorized requests return 401.

### 3.2 Tags
Tags have:
- `name` (unique within household, case-insensitive)
- `type` (fixed enum; exactly one type per tag)

**Fixed tag types (MVP)**
- `PROTEIN`
- `PORTION`
- `PREP`
- `OTHER`

Examples:
- “pork/shrimp/beef” → `PROTEIN`
- “large portion” → `PORTION`
- “thaw-required” → `PREP`

**Acceptance criteria**
- Create/edit/delete tags.
- Prevent duplicate tag names (case-insensitive).

### 3.3 Recipes
Required:
- `title` (non-empty)
- `tag_ids` (must contain ≥1 tag)
- `default_servings` (int ≥ 1)

Optional:
- `notes` (free-form text)

**Acceptance criteria**
- Cannot save recipe without at least one tag.
- Can filter recipe list by tag or tag type.

### 3.4 Rules
Two classes:

#### A) Constraint rules (weekly validation)
MVP template:
- **MAX_MEALS_PER_WEEK_BY_TAG**
  - Example: “No more than 3 meals of tag=pork per week”

Properties:
- `tag_id`
- `max_count` (int ≥ 0)
- `severity` fixed to `WARNING` (soft enforcement in MVP)

Counting semantics:
- Count by **day**, not servings.
- For a given week, count the number of planned dinner entries whose recipe contains `tag_id`.

#### B) Action rules (reminder generation)
MVP template:
- **REMIND_OFFSET_DAYS_BEFORE_DINNER**
  - Example: “For tag=beef, remind -1 day at 10:00 to thaw”

Properties:
- `target_type`: `TAG` or `RECIPE`
- `tag_id` OR `recipe_id` (exactly one based on `target_type`)
- `offset_days` (int; negative = before, positive = after; MVP typical is `-1`)
- `time_local` (`HH:MM`) — default **10:00**, user-configurable per rule
- `message_template` (string) with placeholders:
  - `{meal_date}` (`YYYY-MM-DD`)
  - `{recipe_title}`
  - `{day_of_week}` (`Mon/Tue/...`)

Deduping:
- Generate all reminders for a week, then **dedupe by** `(trigger_datetime_local, message_text)`.
- If same trigger time but different text → keep both.
- If identical → keep one.

**Acceptance criteria**
- User can create both rule types via forms.
- Constraint rules show warnings on confirm.
- Action rules appear as calendar alerts in export.

### 3.5 Weekly planning
UI: calendar view Mon–Sun.

Actions:
1) Drag recipe → drop on day: sets dinner recipe for that date.
2) Drag tag → drop on day:
   - open picker modal listing recipes containing that tag
   - list sorted alphabetically by recipe title
   - selecting a recipe sets that day’s dinner

Each plan entry stores:
- `recipe_id`
- `servings` (defaults to `recipe.default_servings`; user can override)

**Confirm**
- “Confirm” triggers validation and shows warnings.
- Confirm does **not lock** plan; plan remains editable.
- Export is allowed even if warnings exist.

**Acceptance criteria**
- User can populate week fully or partially.
- Confirm shows warnings; export still works.

---

## 4) UX/screens (MVP)

### 4.1 Login
- Email + password
- On success → redirect to This Week

### 4.2 Weekly Plan (primary)
- Header: week selector (prev/next), “Confirm”, “Export”
- Calendar grid (Mon–Sun)
- Each day card shows:
  - recipe title (or empty)
  - servings
  - tap → edit servings / clear day
- Left panel / bottom drawer:
  - recipe list (search)
  - tag list grouped by tag type

Confirm behavior:
- After confirm, show a warning panel listing violated constraint rules with counts.

Export behavior:
- “Download .ics”
- If warnings exist, show a lightweight modal: “There are warnings. Export anyway?” (default yes)

### 4.3 Recipes
- List + create/edit form
- Required: title, ≥1 tag, default_servings
- Optional: notes

### 4.4 Tags
- CRUD tags
- Type dropdown fixed to enum

### 4.5 Rules
- Two tabs: Constraint Rules / Action Rules
- Template-driven forms (no custom DSL)

---

## 5) System architecture (AWS, Python, scrappy)

### 5.1 Recommended MVP architecture
- **Frontend:** static HTML/CSS/JS (mobile-first responsive)
  - Hosted on **S3 + CloudFront**
- **Backend:** **FastAPI** (Python)
  - Deployed on **AWS Lambda** via API Gateway (HTTP API)
  - Use Mangum adapter (ASGI → Lambda)
- **Database:** **DynamoDB**
- **Auth:** custom simple password login with JWT
  - Password hashed with bcrypt (passlib)
  - JWT signed server-side (HS256) with secret in SSM Parameter Store / Secrets Manager

Meets requirements:
- web MVP, mobile friendly
- Python ecosystem (FastAPI)
- AWS hosting + AWS DB
- low ops, low cost, suitable for <10 users

---

## 6) Data model (DynamoDB)

### 6.1 Tables

#### `users`
- `pk` = `USER#{user_id}`
- Attributes:
  - `user_id` (uuid)
  - `email` (string, unique)
  - `password_hash` (string)
  - `household_id` (uuid)
  - `created_at` (iso datetime)

GSI:
- `gsi1pk` = `EMAIL#{email_lower}` → lookup by email

#### `households`
- `pk` = `HOUSE#{household_id}`
- Attributes:
  - `household_id`
  - `name`
  - `timezone` (IANA, e.g., `America/Los_Angeles`)
  - `dinner_time_local` (`HH:MM`, default `18:00`)

#### `tags`
- `pk` = `HOUSE#{household_id}`
- `sk` = `TAG#{tag_id}`
- Attributes:
  - `tag_id` (uuid)
  - `name`
  - `name_lower`
  - `type` (enum)
  - `created_at`

Uniqueness:
- Enforce unique `name_lower` within household at application layer (conditional write)

#### `recipes`
- `pk` = `HOUSE#{household_id}`
- `sk` = `RECIPE#{recipe_id}`
- Attributes:
  - `recipe_id`
  - `title`
  - `title_lower`
  - `default_servings` (int)
  - `notes` (string, optional)
  - `tag_ids` (string[] of tag_id)
  - `created_at`, `updated_at`

Optional inverted index for “recipes by tag”:
- Table `recipe_tags`:
  - `pk` = `HOUSE#{household_id}#TAG#{tag_id}`
  - `sk` = `RECIPE#{recipe_id}`
  - `title_lower`

#### `weekly_plans`
- `pk` = `HOUSE#{household_id}`
- `sk` = `WEEK#{week_start_date}` (`YYYY-MM-DD`)
- Attributes:
  - `week_start_date`
  - `entries` (map keyed by date string `YYYY-MM-DD`):
    - value: `{ recipe_id, servings }` or `null`
  - `updated_at`

#### `rules`
- `pk` = `HOUSE#{household_id}`
- `sk` = `RULE#{rule_id}`
- Common attributes:
  - `rule_id`
  - `rule_kind` = `CONSTRAINT` | `ACTION`
  - `enabled` (bool)
  - `created_at`, `updated_at`

Constraint attributes:
- `constraint_type` = `MAX_MEALS_PER_WEEK_BY_TAG`
- `tag_id`
- `max_count`

Action attributes:
- `action_type` = `REMIND_OFFSET_DAYS_BEFORE_DINNER`
- `target_type` = `TAG` | `RECIPE`
- `tag_id` or `recipe_id`
- `offset_days`
- `time_local` (default `10:00`)
- `message_template`

---

## 7) API contract (FastAPI)

All endpoints require `Authorization: Bearer <JWT>` except auth endpoints.

### 7.1 Auth
**POST `/api/auth/login`**
Request:
```json
{ "email": "user@example.com", "password": "..." }
```
Response:
```json
{ "access_token": "<jwt>", "user": { "email": "...", "household_id": "..." } }
```

### 7.2 Tags
**GET `/api/tags`**
```json
[{ "tag_id":"...", "name":"pork", "type":"PROTEIN" }]
```

**POST `/api/tags`**
```json
{ "name":"pork", "type":"PROTEIN" }
```

**PATCH `/api/tags/{tag_id}`**
```json
{ "name":"pork belly" }
```

**DELETE `/api/tags/{tag_id}`**

### 7.3 Recipes
**GET `/api/recipes?tag_id=...&q=...`**
```json
[{ "recipe_id":"...", "title":"Korean Pork Bowl", "default_servings":4, "tag_ids":["..."], "notes":"" }]
```

**POST `/api/recipes`**
```json
{ "title":"Korean Pork Bowl", "default_servings":4, "tag_ids":["..."], "notes":"Marinade: ..." }
```
Validation: `tag_ids.length >= 1`

**PATCH `/api/recipes/{recipe_id}`**

**DELETE `/api/recipes/{recipe_id}`**

### 7.4 Rules
**GET `/api/rules`**

**POST `/api/rules/constraint/max_meals_per_week_by_tag`**
```json
{ "tag_id":"...", "max_count":3, "enabled":true }
```

**POST `/api/rules/action/remind_offset_days_before_dinner`**
```json
{
  "target_type":"TAG",
  "tag_id":"...",
  "offset_days":-1,
  "time_local":"10:00",
  "message_template":"Thaw for {day_of_week} ({meal_date}): {recipe_title}",
  "enabled":true
}
```

**PATCH `/api/rules/{rule_id}`**

**DELETE `/api/rules/{rule_id}`**

### 7.5 Weekly plan
**GET `/api/plans/{week_start_date}`**
```json
{
  "week_start_date":"2026-01-05",
  "entries":{
    "2026-01-05":{"recipe_id":"...","servings":4},
    "2026-01-06":null
  }
}
```

**PUT `/api/plans/{week_start_date}/entry`**
```json
{ "date":"2026-01-05", "recipe_id":"...", "servings":6 }
```

**DELETE `/api/plans/{week_start_date}/entry?date=2026-01-05`**

### 7.6 Validation
**POST `/api/plans/{week_start_date}/validate`**
```json
{
  "warnings":[
    {
      "rule_id":"...",
      "type":"MAX_MEALS_PER_WEEK_BY_TAG",
      "message":"Tag 'pork' planned 4 times > max 3",
      "details":{"tag_id":"...","count":4,"max":3}
    }
  ]
}
```

### 7.7 Export
**GET `/api/plans/{week_start_date}/export.ics`**
- Returns `text/calendar` file download
- Includes dinner events + reminder events

---

## 8) Rule engine specification (exact)

### 8.1 Inputs
- `week_start_date`
- weekly plan entries for that week
- recipes referenced by plan
- rules (enabled only)
- household settings (timezone, dinner_time)

### 8.2 Constraint evaluation: MAX_MEALS_PER_WEEK_BY_TAG
Algorithm:
1. For each enabled constraint rule:
2. Count `c = number of dates in week where entry exists AND rule.tag_id in recipe.tag_ids`
3. If `c > max_count`, emit a warning.

Missing recipe reference:
- Emit warning: “Recipe missing; please reselect” (separate warning type)

### 8.3 Action expansion: REMIND_OFFSET_DAYS_BEFORE_DINNER
For each planned dinner entry `(meal_date, recipe_id)`:
1. Determine applicability:
   - If `target_type == TAG`: applies if `tag_id in recipe.tag_ids`
   - If `target_type == RECIPE`: applies if `recipe_id == rule.recipe_id`
2. Compute trigger datetime:
   - `trigger_date = meal_date + offset_days`
   - `trigger_datetime_local = trigger_date at rule.time_local in household.timezone`
3. Render message via template placeholders.
4. Collect reminder `(trigger_datetime_local, message)`.

Deduping:
- Set keyed by `(trigger_datetime_local_iso, message)`.

---

## 9) iCalendar (.ics) export specification

### 9.1 Dinner events
For each date `D` with a planned recipe:
- Create `VEVENT`:
  - `UID`: deterministic: `mealprepbuddy-{household_id}-{week_start_date}-{D}`
  - `DTSTART`: `D` at `household.dinner_time_local` in household timezone
  - `DURATION`: `PT1H` (fixed 1 hour in MVP)
  - `SUMMARY`: `Dinner: {recipe_title}`
  - `DESCRIPTION` includes:
    - servings
    - recipe notes (if any)

### 9.2 Reminder events (for exact timing on other days)
Because reminders can be on a different date/time than dinner (e.g., day before at 10:00),
export reminders as separate short VEVENTs with an alarm at start.

For each deduped reminder:
- Create reminder `VEVENT`:
  - `UID`: `mealprepbuddy-rem-{household_id}-{week_start_date}-{hash(trigger_datetime+message)}`
  - `DTSTART`: `trigger_datetime_local`
  - `DURATION`: `PT5M`
  - `SUMMARY`: `Reminder: {message}`
  - `DESCRIPTION`: `For dinner on {meal_date}: {recipe_title}` (if available)
- Add `VALARM`:
  - `TRIGGER:PT0M` (fire at event start)
  - `ACTION:DISPLAY`
  - `DESCRIPTION:{message}`

---

## 10) Frontend implementation approach (scrappy)

### 10.1 Stack
- Static frontend: HTML + CSS + vanilla JS
- Responsive CSS (mobile-first)
- Drag-and-drop:
  - HTML5 drag/drop API
  - Provide a tap-to-place fallback if mobile Safari drag/drop is unreliable

### 10.2 Key behaviors
- Tag drop → open modal recipe picker (alphabetical)
- Servings edit → inline numeric input/stepper
- Confirm → calls validate endpoint and renders warnings
- Export → download `.ics`

---

## 11) Deployment on AWS (free-tier oriented)

### 11.1 Infra components
- S3 bucket: static site
- CloudFront distribution
- API Gateway HTTP API
- AWS Lambda: FastAPI app
- DynamoDB tables
- SSM Parameter Store / Secrets Manager for secrets

### 11.2 Deployment tooling
- AWS SAM (recommended) or Serverless Framework

---

## 12) Python dependencies
- `fastapi`
- `mangum`
- `pydantic`
- `boto3`
- `passlib[bcrypt]`
- `python-jose` (or `PyJWT`)
- `icalendar` (or `ics`)
- `python-dateutil`
- `zoneinfo` (py3.9+) or `pytz`

---

## 13) MVP build plan (coding order)
1. DynamoDB tables + local dev config
2. Auth (login, JWT, middleware)
3. Tags CRUD + uniqueness checks
4. Recipes CRUD + validation (≥1 tag)
5. Weekly plan CRUD
6. Rules CRUD (two templates)
7. Validation endpoint
8. Export `.ics` endpoint (dinner events)
9. Action reminders → reminder VEVENTs + dedupe
10. Frontend pages + responsive styling
11. Drag/drop + tag-picker modal + servings editor
12. Deploy to AWS

---

## 14) Costs and constraints
- With <10 users, Lambda/DynamoDB/S3/CloudFront costs should be minimal; free tiers may cover most usage.
- No paid services required for MVP.

---

## 15) Optional last-mile settings (not blockers)
- Household default dinner time (keep `18:00`?)
- Touch drag/drop fallback (recommended)
- Show tags on calendar cards (nice-to-have)
