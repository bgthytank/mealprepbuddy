# MealPrepBuddy

A mobile-friendly web app for weekly dinner planning with recipe management, rules engine, and Apple Calendar export.

## Features

- **Recipe Management**: Create recipes with tags (Protein, Portion, Prep, Other)
- **Weekly Planning**: Drag-and-drop calendar for Mon-Sun dinner planning
- **Rule Engine**:
  - Constraint rules: Limit tag frequency per week (e.g., max 3 pork meals)
  - Action rules: Generate calendar reminders (e.g., thaw beef 1 day before)
- **ICS Export**: Download calendar file for Apple Calendar import
- **Simple Auth**: Password-based login with JWT

## Tech Stack

### Backend
- **FastAPI** (Python 3.11)
- **DynamoDB** for storage
- **AWS Lambda** via Mangum adapter

### Frontend
- **React 18** + TypeScript
- **Vite** for build
- **TailwindCSS** for styling

### Deployment
- **AWS SAM** for infrastructure as code
- **S3 + CloudFront** for frontend hosting
- **API Gateway + Lambda** for backend

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- AWS CLI configured (for DynamoDB Local or AWS)
- Docker (optional, for DynamoDB Local)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server (proxies /api to backend)
npm run dev
```

### Using DynamoDB Local

```bash
# Start DynamoDB Local with Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Create table
aws dynamodb create-table \
  --table-name mealprepbuddy \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=gsi1pk,AttributeType=S \
    AttributeName=gsi1sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --global-secondary-indexes \
    "[{\"IndexName\":\"gsi1\",\"KeySchema\":[{\"AttributeName\":\"gsi1pk\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"gsi1sk\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000

# Update backend/.env
# DYNAMODB_ENDPOINT_URL=http://localhost:8000
```

## AWS Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- AWS SAM CLI installed

### Deploy

```bash
# Set JWT secret (or let script generate one)
export JWT_SECRET_KEY="your-secure-secret-key"

# Deploy to dev environment
./deploy.sh dev

# Deploy to prod environment
./deploy.sh prod
```

### Manual Deployment

```bash
# Build SAM application
sam build

# Deploy (will prompt for parameters)
sam deploy --guided

# Build and deploy frontend
cd frontend && npm run build
aws s3 sync dist s3://YOUR_BUCKET_NAME --delete
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `DELETE /api/tags/{tag_id}` - Delete tag

### Recipes
- `GET /api/recipes` - List recipes (optional: `?tag_id=`, `?q=`)
- `POST /api/recipes` - Create recipe
- `DELETE /api/recipes/{recipe_id}` - Delete recipe

### Rules
- `GET /api/rules` - List all rules
- `POST /api/rules/constraint/max_meals_per_week_by_tag` - Create constraint
- `POST /api/rules/action/remind_offset_days_before_dinner` - Create reminder
- `PATCH /api/rules/{rule_id}` - Update rule
- `DELETE /api/rules/{rule_id}` - Delete rule

### Plans
- `GET /api/plans/{week_start_date}` - Get weekly plan
- `PUT /api/plans/{week_start_date}/entry` - Add/update entry
- `DELETE /api/plans/{week_start_date}/entry?date=` - Delete entry
- `POST /api/plans/{week_start_date}/validate` - Validate plan
- `GET /api/plans/{week_start_date}/export.ics` - Export to ICS

## Project Structure

```
mealprepbuddy/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app & Lambda handler
│   │   ├── config.py         # Settings
│   │   ├── models/           # Pydantic models
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # DynamoDB & Auth
│   │   └── utils/            # ICS generator, validation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app
│   │   ├── types.ts          # TypeScript types
│   │   ├── services/api.ts   # API client
│   │   ├── views/            # Page components
│   │   └── components/       # UI components
│   └── package.json
├── template.yaml             # SAM template
├── samconfig.toml            # SAM configuration
└── deploy.sh                 # Deployment script
```

## License

MIT
